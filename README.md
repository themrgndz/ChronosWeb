# 📊 ChronosWeb: AI-Driven Live Traffic Forecasting & Anomaly Detection Dashboard

ChronosWeb; zaman serisi verileri için geliştirilmiş çağdaş bir *in-context learning* modeli olan **Amazon Chronos (T5-Mini)** mimarisini kullanan, mikroservis tabanlı ve uçtan uca canlı bir trafik tahminleme ile anomali tespit platformudur.

Proje, gerçek zamanlı simüle edilen trafik akışlarını **kayan pencere (sliding window)** mekanizmasıyla analiz ederek gelecekteki trafik yoğunluğunu tahmin eder ve istatistiksel güven sınırları vasıtasıyla anlık anomalileri (Aşırı Yoğun / Aşırı Tenha) yakalar.

---

## 🚀 Mimari ve Veri Akışı

Platform, birbirleriyle asenkron ve yüksek performanslı iletişim kuran 3 ana mikroservisten oluşmaktadır:

1. **AI Service (FastAPI & PyTorch):** Amazon'un `chronos-t5-mini` modelini hafızaya yükler (GPU/CUDA destekli). Backend servisinden gelen geçmiş zaman serisi pencerelerini (context) işleyerek önümüzdeki 1 adım sonrasının medyan tahminini ve %5 - %95 güven aralıklarını hesaplar.
2. **Backend Service (Spring Boot WebFlux & WebSockets):** `traffic.csv` dosyasından verileri okuyarak gerçek zamanlı bir trafik akışı simüle eder. Verileri 100'lük kayan pencerelerde biriktirir ve asenkron (WebFlux/Reactive `WebClient`) olarak AI servisine tahmin istekleri gönderir. Gelen sonuçları anomali filtresinden geçirerek WebSocket üzerinden istemcilere yayınlar.
3. **Frontend Service (React & Vite):** WebSocket hattından beslenen canlı SOC (Security Operations Center) konsoludur. Recharts tabanlı dinamik grafiklerle anlık trafik akışını, tahmin projeksiyonlarını ve güven koridorlarını (üst/alt sınır) görselleştirir.

---

## 🛠️ Kullanılan Teknolojiler

* **AI & Forecasting:** Python, FastAPI, PyTorch, Amazon Chronos Pipeline (`chronos-t5-mini`), NumPy
* **Backend:** Java 17, Spring Boot, Spring WebFlux (Reactive Web Client), WebSockets, Lombok
* **Frontend:** React, Vite, Lucide React, Recharts, Tailwind CSS
* **Konteynerizasyon:** Docker, Docker Compose

---

## 📊 Öne Çıkan Özellikler

* **Zero-Shot / In-Context Forecasting:** Model, geçmişe dönük trafik patternlerini önceden bir eğitim veya fine-tuning sürecine tabi tutulmaksızın anlık öğrenir ve geleceğe yönelik projeksiyon çıkarır.
* **Dinamik Güven Sınırları & Anomali Tespiti:** Gelen gerçek değer, modelin belirlediği %95 Üst Sınır değerini aşarsa `AŞIRI YOĞUN`, %5 Alt Sınır değerinin altına düşerse `AŞIRI TENHA` anomali etiketini alır ve SOC konsoluna anlık düşer.
* **Çift Kanallı Canlı İzleme Konsolu:** Arayüz üzerinde sadece anomalileri yakalayan sol panel ile sunucudan akan tüm simülasyon adımlarını gösteren sağ log akışı (Maks 40 satır) eşzamanlı çalışır.
* **Görsel Çizgi Kontrolleri:** Grafikteki karmaşıklığı azaltmak adına kullanıcılar Gerçek Trafik, Gelecek Projeksiyonu veya Güven Sınır çizgilerini dinamik olarak gizleyip açabilir.

---

## 📂 Proje Yapısı

```plaintext
├── ai-service/               # Python FastAPI tabanlı yapay zeka servisi
│   ├── app/main.py           # Amazon Chronos model tahmini endpoint'leri
│   ├── Dockerfile
│   └── requirements.txt      
├── backend-service/          # Spring Boot reactive simülasyon ve WebSocket servisi
│   ├── src/main/java/...     # WebFlux, WebSocket ve client konfigürasyonları
│   ├── src/main/resources/   # traffic.csv veri kaynağı ve ayarlar
│   └── Dockerfile
├── frontend-service/         # React, Vite ve Recharts tabanlı canlı izleme paneli
│   ├── src/App.jsx           
│   ├── src/components/       # AnomalyTable ve DashboardChart bileşenleri
│   └── Dockerfile
└── docker-compose.yml        # Tek komutla tüm mimariyi ayağa kaldıran orkestrasyon dosyası

<img width="1919" height="1079" alt="06 07 2026" src="https://github.com/user-attachments/assets/9c8f4c58-57a4-4b95-bed0-cf0ecbc0993e" />
