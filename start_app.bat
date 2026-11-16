@echo off
start "CertVerify Backend" /D "%~dp0backend" cmd /k call run_server.bat
start "CertVerify Frontend" /D "%~dp0frontend" cmd /k call run_frontend.bat
echo CertVerify is starting in two separate windows.
echo Open the Local URL shown in the frontend window.
pause
