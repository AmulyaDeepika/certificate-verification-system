@echo off
REM CertVerify - Run Backend Server
echo Starting Django Backend Server on http://127.0.0.1:8000/ ...
cd /d "%~dp0"
"%~dp0venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000
pause
