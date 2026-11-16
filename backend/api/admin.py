from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Institution, Certificate, VerificationLog, AuditLog,
    SystemNotification, CertificateApplication,
)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'institution', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active', 'institution')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'student_id_number')
    ordering = ('email',)

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'email', 'phone', 'is_active', 'created_at')
    search_fields = ('name', 'code', 'email')
    list_filter = ('is_active',)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_id', 'student_name', 'institution', 'course_name', 'status', 'issue_date')
    search_fields = ('certificate_id', 'student_name', 'student_email', 'course_name')
    list_filter = ('status', 'institution', 'issue_date')

@admin.register(VerificationLog)
class VerificationLogAdmin(admin.ModelAdmin):
    list_display = ('certificate', 'verified_at', 'verification_method', 'verification_status', 'ip_address')
    list_filter = ('verification_method', 'verification_status', 'verified_at')

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'institution', 'timestamp')
    list_filter = ('action', 'timestamp')

@admin.register(SystemNotification)
class SystemNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'is_read', 'created_at')

@admin.register(CertificateApplication)
class CertificateApplicationAdmin(admin.ModelAdmin):
    list_display = ('certificate_type', 'student', 'institution', 'status', 'created_at')
    search_fields = ('certificate_type', 'student__email', 'institution__name')
    list_filter = ('status', 'institution', 'created_at')
    readonly_fields = ('student', 'institution', 'certificate_type', 'purpose', 'created_at', 'updated_at')
