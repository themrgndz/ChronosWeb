@echo off
title Chronos Tum Sistemleri Baslatma Paneli
chcp 65001 > nul

echo =======================================================
echo     CHRONOS FORECASTING SYSTEM AYAĞA KALKIYOR AGAM...
echo =======================================================

:: %~dp0 değişkeni bat dosyasının bulunduğu ana dizini otomatik yakalar brom.
set "ROOT_DIR=%~dp0"

echo [1/3] Python FastAPI uyanıyor...
start "Python FastAPI" cmd /k "cd /d "%ROOT_DIR%ai-service" && .\venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Spring Boot Backend köprüsü kuruluyor...
timeout /t 5 >nul
start "Spring Boot Backend" cmd /k "cd /d "%ROOT_DIR%backend-service" && .\mvnw clean spring-boot:run"

echo [3/3] React Frontend vitrini açılıyor...
timeout /t 5 >nul
start "React Frontend" cmd /k "cd /d "%ROOT_DIR%frontend-service" && npm run dev"

echo =======================================================
echo    TÜM MOTORLAR ATEŞLENDİ BROM! TARAYICIYI KONTROL ET.
echo =======================================================
pause