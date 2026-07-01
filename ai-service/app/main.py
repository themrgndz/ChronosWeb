import torch
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from chronos import ChronosPipeline

app = FastAPI(
    title="Chronos AI Forecasting Service",
    description="Spring Boot tabanlı dashboard için in-context learning tahmin mikroservisi"
)

# ==============================================================================
# 🧠 MODELİN HAFIZAYA (RTX 4060 / CPU) YÜKLENMESİ
# ==============================================================================
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"\n[AI-SERVICE] Model Kontrolü -> Kod {device.upper()} üzerinde çalışacak.")

try:
    pipeline = ChronosPipeline.from_pretrained(
        "amazon/chronos-t5-mini",
        device_map=device,
        torch_dtype=torch.bfloat16,
    )
    print("[AI-SERVICE] Chronos Başarıyla Hafızaya Alındı, Hacı!\n")
except Exception as e:
    print(f"[AI-SERVICE] Model yüklenirken hata oluştu: {str(e)}")
    raise e

# ==============================================================================
# 📝 İSTEK VE CEVAP MODELLERİ (DTO)
# ==============================================================================
class PredictionRequest(BaseModel):
    context: List[float]  # Spring Boot'un göndereceği kayan pencere verisi

class PredictionResponse(BaseModel):
    median: float         # %50 median tahmini
    upper_bound: float    # %95 üst güven sınırı
    lower_bound: float    # %5 alt güven sınırı

# ==============================================================================
# 🚀 TAHMİN ENDPOINT'İ
# ==============================================================================
@app.post("/predict", response_model=PredictionResponse)
def predict_next_step(request: PredictionRequest):
    # Spring Boot en az 20 veri birikene kadar istek atmamalı, burada da garantiye alalım
    if len(request.context) < 20:
        raise HTTPException(
            status_code=400, 
            detail=f"Yetersiz veri! Tahmin için en az 20 geçmiş veri gerekli. Gelen: {len(request.context)}"
        )
    
    try:
        # 1. Gelen listeyi tensöre çeviriyoruz
        context_tensor = torch.tensor(request.context, dtype=torch.float32)
        
        # 2. Önümüzdeki tam 1 adım (1 saat) sonrasını tahmin ediyoruz
        tahmin = pipeline.predict(context_tensor, 1)
        
        # 3. Dağılımın %5, %50 ve %95'lik dilimlerini hesaplıyoruz
        tahmin_numpy = tahmin[0].numpy()
        alt_esik, medyan, ust_esik = np.percentile(tahmin_numpy, [5, 50, 95], axis=0)
        
        # 4. JSON formatında Spring Boot'a paslıyoruz
        return PredictionResponse(
            median=float(medyan[0]),
            upper_bound=float(ust_esik[0]),
            lower_bound=float(alt_esik[0])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tahmin motoru hatası: {str(e)}")

# Sağlık kontrolü ucu (Spring Boot ayağa kalkarken servis açık mı diye baksın)
@app.get("/health")
def health_check():
    return {"status": "UP", "device": device, "model": "amazon/chronos-t5-mini"}