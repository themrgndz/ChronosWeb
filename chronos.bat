@echo off
title Chronos Tum Sistemleri Baslatma Paneli
chcp 65001 > nul

echo =======================================================
echo     CHRONOS FORECASTING SYSTEM AYAGA KALKIYOR AGAM...
echo =======================================================

set "ROOT_DIR=%~dp0"

echo [1/3] Python FastAPI kontrol ediliyor ve uyandiriliyor...
start "Python FastAPI" cmd /k "cd /d "%ROOT_DIR%ai-service" && (if not exist venv python -m venv venv) && .\venv\Scripts\activate.bat && pip install -r requirements.txt && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Spring Boot Backend koprusu kuruluyor...
timeout /t 3 >nul
start "Spring Boot Backend" cmd /k "cd /d "%ROOT_DIR%backend-service" && .\mvnw clean spring-boot:run"

echo [3/3] React Frontend paketleri kontrol ediliyor ve vitrin aciliyor...
timeout /t 3 >nul
start "React Frontend" cmd /k "cd /d "%ROOT_DIR%frontend-service" && (if not exist node_modules npm install) && npm run dev"

echo =======================================================
echo    HER SEY HAZIR BROM! İLK KURULUM YAPILIYORSA BIRAZ 
echo    BEKLETIYOR OLABILIR, SANTIYEYI KONTROL ET.
echo =======================================================
pause