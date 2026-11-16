# CertVerify – Certificate Verification and Validation System

A professional, full-stack, responsive web application for educational institutions, training academies, and universities to issue, manage, and verify digital certificates.

## 🚀 Key Features

1. **Public Verification Portal (No login required)**:
   - Verification by unique alphanumeric ID (e.g., `CERT-MIT-2026-88F4A190`).
   - Live camera QR code scanning via `html5-qrcode`.
   - Authentic badge indicator with confetti feedback.
   - Revocation warnings with official reason logs.
   - High-resolution PDF certificate downloads directly generated on-the-fly.

2. **Panel 1: Super Admin Console**:
   - Multi-tenant institution management (Add, edit, deactivate, view analytics).
   - Global metrics (Total issued certificates, verification requests, active rates).
   - Comprehensive system audit logs with client IP and timestamps.

3. **Panel 2: Institution Admin Portal**:
   - Issue certificates with automatic cryptographic ID generation.
   - Auto-generated QR codes pointing to verification URLs.
   - Revoke/re-activate certificates with reason tracking.
   - Enrolled student management and verification history.

4. **Panel 3: Student Portal**:
   - View all accredited certificates issued to the student's email.
   - Upload a certificate PDF to verify it against official records linked to the signed-in student account.
   - Instant PDF download and direct public verification link.

5. **API & Documentation**:
   - Django REST Framework + SimpleJWT Authentication.
   - Interactive Swagger/OpenAPI docs at `/api/docs/`.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Recharts, Axios, React Router v7, HTML5-QRCode, Canvas-Confetti
- **Backend**: Python 3.13, Django 5+, Django REST Framework, Simple JWT, ReportLab (PDF), QRCode, DRF-Spectacular (OpenAPI/Swagger)
- **Database**: SQLite (default out-of-the-box) or MySQL (configurable via environment variables `DB_ENGINE=mysql`)

---

## 🔑 Pre-Configured Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | Provided privately to the administrator | Not published |
| **Institution Admin** | Provided privately by the institution | Not published |
| **Student (Alex Morgan)** | `alex.morgan@gmail.com` | `student123` |
| **Student (Priya Sharma)** | `priya.sharma@gmail.com` | `student123` |

### Sample Certificate IDs for Instant Verification:
- **Valid MIT Certificate**: `CERT-MIT-2026-88F4A190`
- **Valid Stanford Certificate**: `CERT-STAN-2026-11C2B904`
- **Revoked Certificate**: `CERT-MIT-2026-REVOKED99`

### Registration Email OTP

Student registration and login verification codes are sent to the user's registered email address. Configure Gmail SMTP in `backend/.env` with a Google App Password (not the normal Gmail password), then restart the backend.

---

## 🏃 Quick Start Guide

### One-click startup (Windows)
Double-click `start_app.bat` in the project folder. Keep both server windows open, then open the Local URL shown in the frontend window.

### 1. Run the Django Backend
```powershell
cd backend
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
- API Base: `http://127.0.0.1:8000/api/`
- Interactive Swagger UI: `http://127.0.0.1:8000/api/docs/`
- Django Admin: `http://127.0.0.1:8000/admin/`

### 2. Run the React Frontend
```powershell
cd frontend
npm run dev
```
- Frontend UI: `http://localhost:5173/`
