from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomLoginView, AdminLoginView,
    RegisterView, RegisterOTPView, ResendRegisterOTPView, PublicInstitutionListView,
    PublicCertificateTypeListView, CertificateApplicationListCreateView,
    CurrentUserProfileView, ChangePasswordView,
    InstitutionListCreateView, InstitutionDetailView,
    UserListCreateView, UserDetailView, StudentCertificateUploadVerificationView,
    CertificateListCreateView, CertificateDetailView,
    CertificateStatusHistoryView, NotificationListView, NotificationReadView,
    change_certificate_status, download_certificate_pdf,
    public_verify_certificate, dashboard_stats,
    AuditLogListView, VerificationLogListView
)

urlpatterns = [
    # Auth
    path('auth/login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('auth/admin-login/', AdminLoginView.as_view(), name='admin_token_obtain_pair'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/register/verify-otp/', RegisterOTPView.as_view(), name='register_verify_otp'),
    path('auth/register/resend-otp/', ResendRegisterOTPView.as_view(), name='register_resend_otp'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', CurrentUserProfileView.as_view(), name='current_user_profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),

    # Public Directory & Verification & PDF
    path('public/institutions/', PublicInstitutionListView.as_view(), name='public_institutions'),
    path('public/certificate-types/', PublicCertificateTypeListView.as_view(), name='public_certificate_types'),
    path('public/verify/<str:certificate_id>/', public_verify_certificate, name='public_verify'),
    path('public/download/<str:certificate_id>/', download_certificate_pdf, name='download_pdf'),

    # Dashboard Stats
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),

    # Institutions (Super Admin)
    path('institutions/', InstitutionListCreateView.as_view(), name='institution_list_create'),
    path('institutions/<int:pk>/', InstitutionDetailView.as_view(), name='institution_detail'),

    # Users
    path('users/', UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),

    # Certificates
    path('certificates/verify-upload/', StudentCertificateUploadVerificationView.as_view(), name='certificate_upload_verification'),
    path('certificates/', CertificateListCreateView.as_view(), name='certificate_list_create'),
    path('certificates/<int:pk>/', CertificateDetailView.as_view(), name='certificate_detail'),
    path('certificates/<int:pk>/history/', CertificateStatusHistoryView.as_view(), name='certificate_status_history'),
    path('certificates/<int:pk>/status/', change_certificate_status, name='certificate_change_status'),
    path('certificate-applications/', CertificateApplicationListCreateView.as_view(), name='certificate_application_list_create'),

    # Logs
    path('logs/audit/', AuditLogListView.as_view(), name='audit_logs'),
    path('logs/verifications/', VerificationLogListView.as_view(), name='verification_logs'),
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification_mark_read'),
]
