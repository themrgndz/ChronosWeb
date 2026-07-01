ChronosWeb: AI-Driven Live Traffic Forecasting & Anomaly Detection Dashboard

ChronosWeb, zaman serisi verileri için geliştirilmiş çağdaş bir in-context learning modeli olan Amazon Chronos (T5-Mini) mimarisini kullanan; mikroservis tabanlı, uçtan uca canlı bir trafik tahminleme ve anomali tespit platformudur.

Proje, gerçek zamanlı simüle edilen trafik akışlarını kayan pencere (sliding window) mekanizmasıyla analiz ederek gelecekteki trafik yoğunluğunu tahmin eder ve istatistiksel güven sınırları vasıtasıyla anlık anomalileri (Aşırı Yoğun / Aşırı Tenha) yakalar.

🚀 Mimari ve Veri Akışı
AI Service (FastAPI & PyTorch): Amazon'un chronos-t5-mini modelini hafızaya yükler (GPU/CUDA destekli). Spring Boot'tan gelen geçmiş zaman serisi pencerelerini (context) işleyerek önümüzdeki 1 adım sonrasının medyan tahminini ve %5 - %95 güven aralıklarını hesaplar.

Backend Service (Spring Boot WebFlux & WebSockets): traffic.csv dosyasından verileri okuyarak gerçek zamanlı bir trafik akışı simüle eder. Verileri 100'lük kayan pencerelerde biriktirir ve asenkron (WebFlux/Reactive) olarak AI servisine tahmin istekleri gönderir. Gelen sonuçları anomali filtresinden geçirerek WebSocket üzerinden istemcilere yayınlar.

Frontend Service (React & Vite): WebSocket hattından beslenen canlı SOC (Security Operations Center) konsoludur. Recharts tabanlı grafiklerle anlık trafik akışını, tahmin projeksiyonlarını ve güven koridorlarını (üst/alt sınır) görselleştirir.

🛠️ Kullanılan Teknolojiler
AI & Forecasting: Python, FastAPI, PyTorch, Amazon Chronos Pipeline (chronos-t5-mini), NumPy

Backend: Java 17, Spring Boot, Spring WebFlux (Reactive Web Client), WebSockets, Lombok

Frontend: React, Vite, Lucide React, Recharts / Tailwind tabanlı modern Dashboard UI

📂 Proje Yapısı
Plaintext

├── ai-service/               
│   ├── app/main.py           
│   └── requirements.txt      
├── backend-service/         
│   ├── src/main/java/...    
│   └── src/main/resources/ 
└── frontend-service/       
    ├── src/App.jsx         
    └── src/components/    

⚙️ Kurulum ve Çalıştırma
1. AI Servisinin Başlatılması
İlk olarak CUDA/CPU destekli Python mikroservisini ayağa kaldırın:

Bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
Servis ayağa kalktığında http://127.0.0.1:8000/health ucundan durum kontrolü yapılabilir.

2. Backend Servisinin Başlatılması
Spring Boot projesini derleyip çalıştırın. Maven wrapper kullanarak hızlıca ayağa kaldırabilirsiniz:

Bash
cd backend-service
./mvnw spring-boot:run
Sistem traffic.csv dosyasını tarayarak Junction 1 verilerini yükleyecek ve saniyede 1 adım akacak şekilde simülasyonu başlatacaktır.

3. Frontend Servisinin Başlatılması
Kullanıcı arayüzünü ayağa kaldırmak için bağımlılıkları yükleyin ve geliştirme sunucusunu açın:

Bash
cd frontend-service
npm install
npm run dev
Tarayıcınızda ekranda beliren adresi (genellikle http://localhost:5173) açarak canlı paneli izleyebilirsiniz.

📊 Öne Çıkan Özellikler
İn-Context Forecasting: Model, geçmişe dönük trafik patternlerini önceden bir eğitim sürecine tabi tutulmaksızın (zero-shot) anlık öğrenir ve geleceğe yönelik projeksiyon çıkarır.

Dinamik Güven Sınırları & Anomali Tespiti: Gelen gerçek değer, modelin belirlediği %95 Üst Sınır değerini aşarsa AŞIRI YOĞUN, %5 Alt Sınır değerinin altına düşerse AŞIRI TENHA anomali etiketini alır ve SOC konsoluna anlık düşer.

Çift Kanallı Canlı İzleme Konsolu: Arayüz üzerinde sadece anomalileri yakalayan sol panel ile sunucudan akan tüm log akışını (Maks 40 satır) gösteren sağ panel eşzamanlı çalışır.

Çizgi Kontrolleri: Grafikteki karmaşıklığı azaltmak adına kullanıcılar Gerçek Trafik, Gelecek Projeksiyonu veya Güven Sınır çizgilerini dinamik olarak gizleyip açabilir.
