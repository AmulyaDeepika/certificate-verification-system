import uuid
import qrcode
from pathlib import Path
from io import BytesIO
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils import timezone


def validate_certificate_upload(upload):
    max_size = 10 * 1024 * 1024
    if upload.size > max_size:
        raise ValidationError('Certificate PDF must not exceed 10 MB.')
    if Path(upload.name).suffix.lower() != '.pdf':
        raise ValidationError('Only PDF certificate files are allowed.')

    position = upload.tell()
    upload.seek(0)
    signature = upload.read(5)
    upload.seek(position)
    if signature != b'%PDF-':
        raise ValidationError('The uploaded file is not a valid PDF document.')


class UserManager(BaseUserManager):
    def create_user(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        if not username:
            username = email.split('@')[0]
        extra_fields.setdefault('username', username)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        return self.create_user(email, username, password, **extra_fields)


class Institution(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='institutions/logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class User(AbstractUser):
    ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Admin'),
        ('INSTITUTION_ADMIN', 'Institution Admin'),
        ('STUDENT', 'Student'),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=25, choices=ROLE_CHOICES, default='STUDENT')
    phone = models.CharField(max_length=20, blank=True, null=True)
    institution = models.ForeignKey(
        Institution, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='members'
    )
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    student_id_number = models.CharField(max_length=100, blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


class Certificate(models.Model):
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('REVOKED', 'Revoked'),
    )

    certificate_id = models.CharField(max_length=64, unique=True, editable=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='certificates')
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='issued_certificates')
    
    # Student information
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='certificates')
    student_name = models.CharField(max_length=255)
    student_email = models.EmailField()
    student_roll_no = models.CharField(max_length=100, blank=True, null=True)

    # Certificate details
    title = models.CharField(max_length=255) # e.g. "Full Stack Web Development", "Bachelor of Science"
    course_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    grade = models.CharField(max_length=50, blank=True, null=True) # e.g. "Grade A+", "Distinction"
    issue_date = models.DateField(default=timezone.localdate)
    expiry_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    revocation_reason = models.TextField(blank=True, null=True)
    revoked_at = models.DateTimeField(blank=True, null=True)

    # Assets
    qr_code = models.ImageField(upload_to='certificates/qrcodes/', blank=True, null=True)
    pdf_file = models.FileField(
        upload_to='certificates/pdfs/',
        blank=True,
        null=True,
        validators=[validate_certificate_upload],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = not self.pk
        if not self.certificate_id:
            # Generate unique formatted certificate ID: e.g. CERT-INSTCODE-YEAR-UUID
            code_prefix = self.institution.code.upper() if self.institution else "GEN"
            year = timezone.now().strftime("%Y")
            unique_part = uuid.uuid4().hex[:8].upper()
            self.certificate_id = f"CERT-{code_prefix}-{year}-{unique_part}"

        super().save(*args, **kwargs)

        if is_new or not self.qr_code:
            self.generate_qr_code()

    def generate_qr_code(self):
        # Verification URL scanned by mobile or public scanner
        verification_url = (
            f"{settings.FRONTEND_BASE_URL}/verify/{self.certificate_id}"
        )
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=8,
            border=2,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#1E3A8A", back_color="white")

        buffer = BytesIO()
        img.save(buffer, format='PNG')
        filename = f"qr_{self.certificate_id}.png"
        self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)
        super().save(update_fields=['qr_code'])

    def __str__(self):
        return f"{self.certificate_id} - {self.student_name} ({self.title})"


class VerificationLog(models.Model):
    certificate = models.ForeignKey(Certificate, on_delete=models.CASCADE, related_name='verifications')
    verified_by_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verifications_performed')
    verified_by_email = models.EmailField(blank=True, null=True)
    verified_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    verification_method = models.CharField(max_length=50, default='MANUAL_ID') # MANUAL_ID, QR_SCAN, DIRECT_LINK
    verification_status = models.CharField(max_length=50, default='VALID') # VALID, REVOKED, EXPIRED

    def __str__(self):
        verifier = self.verified_by_email or (self.verified_by_user.email if self.verified_by_user else 'Public Guest')
        return f"Verify: {self.certificate.certificate_id} by {verifier} at {self.verified_at}"


class CertificateStatusHistory(models.Model):
    certificate = models.ForeignKey(
        Certificate, on_delete=models.CASCADE, related_name='status_history'
    )
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='certificate_status_changes',
    )
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.certificate.certificate_id}: {self.previous_status} -> {self.new_status}"


class CertificateApplication(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificate_applications',
    )
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name='certificate_applications',
    )
    certificate_type = models.CharField(max_length=255)
    purpose = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.certificate_type} application by {self.student.email}"



class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('CREATE_CERTIFICATE', 'Create Certificate'),
        ('UPDATE_CERTIFICATE', 'Update Certificate'),
        ('REVOKE_CERTIFICATE', 'Revoke Certificate'),
        ('ACTIVATE_CERTIFICATE', 'Activate Certificate'),
        ('DEACTIVATE_CERTIFICATE', 'Deactivate Certificate'),
        ('CREATE_INSTITUTION', 'Create Institution'),
        ('UPDATE_INSTITUTION', 'Update Institution'),
        ('DELETE_INSTITUTION', 'Delete Institution'),
        ('USER_LOGIN', 'User Login'),
        ('USER_REGISTER', 'User Registration'),
        ('PASSWORD_CHANGE', 'Password Change'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"


class SystemNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"


class EmailOTP(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=128)
    purpose = models.CharField(max_length=50, default='LOGIN') # LOGIN or REGISTER
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    def is_expired(self):
        from datetime import timedelta
        # 1-minute strict validity limit requested by user
        return timezone.now() >= self.created_at + timedelta(minutes=1)

    def __str__(self):
        return f"{self.purpose} OTP for {self.email}"
