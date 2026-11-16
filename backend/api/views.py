from datetime import timedelta
import logging
import secrets
import re
import smtplib
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from rest_framework import generics, permissions, serializers, status, views
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.core.files.base import ContentFile
from django.http import FileResponse
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.core.mail.message import BadHeaderError
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)

from .models import (
    User, Institution, Certificate, CertificateStatusHistory,
    VerificationLog, AuditLog, SystemNotification, CertificateApplication, EmailOTP,
)
from .serializers import (
    UserSerializer, InstitutionSerializer, CertificateSerializer, 
    PublicCertificateVerificationSerializer, VerificationLogSerializer, 
    AuditLogSerializer, SystemNotificationSerializer, RegisterSerializer,
    CurrentUserProfileSerializer, CertificateStatusHistorySerializer,
    CertificateApplicationSerializer, certificate_is_valid,
)
from .permissions import IsSuperAdmin, IsInstitutionAdmin, IsStudent
from .pdf_generator import generate_certificate_pdf

class OptionalPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        if 'page' not in request.query_params:
            return None
        return super().paginate_queryset(queryset, request, view)


def notify_administrators(institution, title, message):
    recipients = User.objects.filter(role='SUPER_ADMIN')
    if institution:
        recipients = recipients | User.objects.filter(
            role='INSTITUTION_ADMIN',
            institution=institution,
        )
    SystemNotification.objects.bulk_create([
        SystemNotification(user=recipient, title=title, message=message)
        for recipient in recipients.distinct()
    ])


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    allowed_roles = ('STUDENT',)

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.role not in self.allowed_roles:
            raise serializers.ValidationError('This account cannot use this login portal.')
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'phone': self.user.phone,
            'student_id_number': self.user.student_id_number,
            'institution': self.user.institution_id,
            'institution_name': self.user.institution.name if self.user.institution else None,
        }
        # Log login
        AuditLog.objects.create(
            user=self.user,
            institution=self.user.institution,
            action='USER_LOGIN',
            details=f"User {self.user.email} logged in with role {self.user.role}"
        )
        return data


def send_email_otp(email, otp_code, purpose='LOGIN', first_name=''):
    if not settings.EMAIL_HOST:
        raise ImproperlyConfigured(
            'Email delivery is not configured. Set EMAIL_HOST in the backend .env file.'
        )

    purpose_title = 'Login' if purpose == 'LOGIN' else 'Registration'
    subject = f'Your CertVerify {purpose_title} Verification Code'
    plain_text = (
        f"Hello {first_name or 'there'},\n\n"
        f"Your CertVerify {purpose_title.lower()} verification code is: {otp_code}\n\n"
        f"IMPORTANT: This code expires in 1 minute (60 seconds).\n"
        f"Enter this code on the portal to securely verify your identity.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"CertVerify Security Team"
    )
    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 800; font-size: 20px; padding: 8px 16px; border-radius: 10px;">
                CertVerify
            </div>
            <h2 style="color: #0f172a; margin: 16px 0 6px; font-size: 20px;">{purpose_title} Verification Code</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">1-Minute Security Verification</p>
        </div>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 10px;">One-Time Passcode (OTP)</p>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1e40af; background: #ffffff; padding: 12px 24px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block; font-family: monospace;">
                {otp_code}
            </div>
            <p style="font-size: 12px; font-weight: 600; color: #dc2626; margin: 12px 0 0;">
                &#x23F1; Expires in 1 minute (60 seconds)
            </p>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 16px;">
            This OTP was generated for <strong>{email}</strong>. For your protection, never share this code with anyone.
        </p>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
            &copy; {timezone.now().year} CertVerify - Certificate Verification and Validation System.
        </div>
    </div>
    """
    send_mail(
        subject=subject,
        message=plain_text,
        html_message=html_content,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[email],
        fail_silently=False,
    )


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class AdminTokenObtainPairSerializer(CustomTokenObtainPairSerializer):
    allowed_roles = ('SUPER_ADMIN', 'INSTITUTION_ADMIN')


class AdminLoginView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer


def send_registration_otp(user):
    otp_code = f'{secrets.randbelow(900000) + 100000:06d}'
    EmailOTP.objects.filter(
        email__iexact=user.email,
        purpose='REGISTER',
        is_used=False,
    ).update(is_used=True)
    EmailOTP.objects.create(
        email=user.email,
        otp_code=make_password(otp_code),
        purpose='REGISTER',
    )
    send_email_otp(user.email, otp_code, purpose='REGISTER', first_name=user.first_name)
    return otp_code


class RegisterView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                user = serializer.save()
                send_registration_otp(user)
        except (ImproperlyConfigured, BadHeaderError, smtplib.SMTPException, OSError):
            logger.exception('Could not send registration verification email.')
            return Response(
                {'detail': 'Email delivery is not configured or available. Check the sender Gmail and App Password in backend/.env.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                'message': 'A verification code has been sent to your Gmail address. It expires in 1 minute.',
                'email': user.email,
                'expires_in': 60,
            },
            status=status.HTTP_201_CREATED,
        )


class RegisterOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        otp_code = str(request.data.get('otp', '')).strip()
        if not email or not otp_code:
            return Response(
                {'detail': 'Email and verification code are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user = User.objects.filter(
                email__iexact=email,
                role='STUDENT',
                is_active=False,
            ).first()
            otp = EmailOTP.objects.select_for_update().filter(
                email__iexact=email,
                purpose='REGISTER',
                is_used=False,
            ).order_by('-created_at').first()

            if not user or not otp:
                return Response(
                    {'detail': 'No pending registration was found. Please register again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if otp.is_expired():
                otp.is_used = True
                otp.save(update_fields=['is_used'])
                return Response(
                    {'detail': 'This verification code has expired (1 minute limit). Request a new code to continue.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if otp.attempts >= 5:
                otp.is_used = True
                otp.save(update_fields=['is_used'])
                return Response(
                    {'detail': 'Too many incorrect attempts. Request a new code to continue.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            if otp.otp_code != otp_code and not check_password(otp_code, otp.otp_code):
                otp.attempts += 1
                if otp.attempts >= 5:
                    otp.is_used = True
                otp.save(update_fields=['attempts', 'is_used'])
                return Response(
                    {'detail': 'That verification code is incorrect. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.is_active = True
            user.save(update_fields=['is_active'])
            otp.is_used = True
            otp.save(update_fields=['is_used'])
            Certificate.objects.filter(
                student_email__iexact=user.email,
                student__isnull=True,
            ).update(student=user)
            AuditLog.objects.create(
                user=user,
                institution=user.institution,
                action='USER_REGISTER',
                details=f"New user registered: {user.email} as {user.role}"
            )

        return Response({'message': 'Phone verified successfully! You can now log in.'})


class ResendRegisterOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        if not email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(
            email__iexact=email,
            role='STUDENT',
            is_active=False,
        ).first()
        if not user:
            return Response(
                {'detail': 'No pending registration was found. Please register again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        latest_otp = EmailOTP.objects.filter(
            email__iexact=email,
            purpose='REGISTER',
        ).order_by('-created_at').first()
        if latest_otp and (timezone.now() < latest_otp.created_at + timedelta(minutes=1)):
            remaining = max(1, int((latest_otp.created_at + timedelta(minutes=1) - timezone.now()).total_seconds()))
            return Response(
                {'detail': f'Please wait {remaining} seconds before requesting another code.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            with transaction.atomic():
                send_registration_otp(user)
        except (ImproperlyConfigured, BadHeaderError, smtplib.SMTPException, OSError):
            logger.exception('Could not resend registration verification email.')
            return Response(
                {'detail': 'Email delivery is not configured or available. Check the sender Gmail and App Password in backend/.env.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({
            'message': 'A new verification code has been sent to your Gmail. It expires in 1 minute.',
            'expires_in': 60,
        })


class PublicInstitutionListView(generics.ListAPIView):
    queryset = Institution.objects.filter(is_active=True).order_by('name')
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.AllowAny]


class PublicCertificateTypeListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Certificate.objects.filter(
            status='ACTIVE',
            institution__is_active=True,
        ).values(
            'institution_id',
            'institution__name',
            'title',
            'course_name',
        ).distinct().order_by('institution__name', 'title', 'course_name')

    def list(self, request, *args, **kwargs):
        certificate_types = [
            {
                'institution_id': item['institution_id'],
                'institution_name': item['institution__name'],
                'title': item['title'],
                'course_name': item['course_name'],
            }
            for item in self.get_queryset()
        ]
        return Response(certificate_types)


# User Profile
class CurrentUserProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = CurrentUserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({'error': 'Incorrect old password'}, status=status.HTTP_400_BAD_REQUEST)

        if not new_password or len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        AuditLog.objects.create(
            user=user,
            institution=user.institution,
            action='PASSWORD_CHANGE',
            details=f"User {user.email} changed password"
        )
        return Response({'message': 'Password updated successfully'})


# Super Admin - Institutions
class InstitutionListCreateView(generics.ListCreateAPIView):
    queryset = Institution.objects.all().order_by('-created_at')
    serializer_class = InstitutionSerializer
    permission_classes = [IsSuperAdmin]

    def perform_create(self, serializer):
        institution = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            institution=institution,
            action='CREATE_INSTITUTION',
            details=f"Created institution {institution.name} ({institution.code})"
        )


class InstitutionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsSuperAdmin()]
        return [IsInstitutionAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            return Institution.objects.all()
        if user.role == 'INSTITUTION_ADMIN' and user.institution_id:
            return Institution.objects.filter(pk=user.institution_id)
        return Institution.objects.none()

    def perform_update(self, serializer):
        inst = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            institution=inst,
            action='UPDATE_INSTITUTION',
            details=f"Updated institution {inst.name}"
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user,
            institution=None,
            action='DELETE_INSTITUTION',
            details=f"Deleted institution {instance.name} ({instance.code})"
        )
        instance.delete()


# User Management
class UserListCreateView(generics.ListCreateAPIView):
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsInstitutionAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        role_filter = self.request.query_params.get('role')
        qs = User.objects.all().order_by('-date_joined')

        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            if role_filter:
                qs = qs.filter(role=role_filter)
            return qs
        elif user.role == 'INSTITUTION_ADMIN':
            qs = qs.filter(institution=user.institution, role='STUDENT')
            if role_filter:
                qs = qs.filter(role=role_filter)
            return qs
        return User.objects.filter(id=user.id)

    def perform_create(self, serializer):
        if self.request.user.role == 'INSTITUTION_ADMIN':
            serializer.save(institution=self.request.user.institution, role='STUDENT')
        else:
            serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsInstitutionAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            return User.objects.all()
        if user.role == 'INSTITUTION_ADMIN' and user.institution_id:
            return User.objects.filter(institution_id=user.institution_id, role='STUDENT')
        return User.objects.none()

    def perform_update(self, serializer):
        if self.request.user.role == 'INSTITUTION_ADMIN':
            if serializer.validated_data.get('role', 'STUDENT') != 'STUDENT':
                raise serializers.ValidationError(
                    {'role': 'Institution administrators can only manage student accounts.'}
                )
            serializer.save(institution=self.request.user.institution, role='STUDENT')
            return
        serializer.save()


# Certificate Management
class CertificateListCreateView(generics.ListCreateAPIView):
    serializer_class = CertificateSerializer
    pagination_class = OptionalPageNumberPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsInstitutionAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Certificate.objects.all().order_by('-created_at')

        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            institution_id = self.request.query_params.get('institution')
            if institution_id:
                qs = qs.filter(institution_id=institution_id)
        elif user.role == 'INSTITUTION_ADMIN':
            qs = qs.filter(institution=user.institution)
        elif user.role == 'STUDENT':
            qs = qs.filter(Q(student=user) | Q(student_email__iexact=user.email))
        else:
            return Certificate.objects.none()

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(certificate_id__icontains=search)
                | Q(student_name__icontains=search)
                | Q(course_name__icontains=search)
            )

        status_filter = self.request.query_params.get('status', '').upper()
        if status_filter:
            if status_filter not in dict(Certificate.STATUS_CHOICES):
                raise serializers.ValidationError({'status': 'Unsupported certificate status.'})
            qs = qs.filter(status=status_filter)

        date_after = self.request.query_params.get('issue_date_after')
        date_before = self.request.query_params.get('issue_date_before')
        if date_after:
            qs = qs.filter(issue_date__gte=date_after)
        if date_before:
            qs = qs.filter(issue_date__lte=date_before)

        ordering = self.request.query_params.get('ordering', '-created_at')
        allowed_ordering = {
            'certificate_id', '-certificate_id', 'student_name', '-student_name',
            'course_name', '-course_name', 'issue_date', '-issue_date',
            'created_at', '-created_at',
        }
        if ordering not in allowed_ordering:
            raise serializers.ValidationError({'ordering': 'Unsupported ordering field.'})
        return qs.order_by(ordering)

    @transaction.atomic
    def perform_create(self, serializer):
        institution = self.request.user.institution if self.request.user.role == 'INSTITUTION_ADMIN' else serializer.validated_data.get('institution')
        if not institution:
            raise serializers.ValidationError({'institution': 'Select an institution for this certificate.'})
        student_email = serializer.validated_data.get('student_email').strip().lower()
        serializer.validated_data['student_email'] = student_email
        student_user = User.objects.filter(email__iexact=student_email).first()
        initial_password = serializer.validated_data.pop('student_initial_password', None)
        if student_user and student_user.role != 'STUDENT':
            raise serializers.ValidationError({
                'student_email': 'This email is already assigned to a non-student account.'
            })
        if (
            student_user
            and student_user.institution_id
            and student_user.institution_id != institution.id
        ):
            raise serializers.ValidationError({
                'student_email': 'This student is registered with a different institution.'
            })

        if not student_user:
            if not initial_password:
                raise serializers.ValidationError({
                    'student_initial_password': 'Set an initial CertVerify password for this new student account.'
                })
            username_base = student_email.split('@', 1)[0][:130] or 'student'
            username = username_base
            suffix = 1
            while User.objects.filter(username__iexact=username).exists():
                username = f'{username_base[:120]}{suffix}'
                suffix += 1
            name_parts = serializer.validated_data.get('student_name', '').strip().split()
            student_user = User.objects.create_user(
                email=student_email,
                username=username,
                password=initial_password,
                role='STUDENT',
                institution=institution,
                student_id_number=serializer.validated_data.get('student_roll_no') or None,
                first_name=name_parts[0] if name_parts else '',
                last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else '',
            )

        cert = serializer.save(
            institution=institution,
            issued_by=self.request.user,
            student=student_user
        )

        # Generate and save default PDF if not uploaded
        if not cert.pdf_file:
            pdf_bytes = generate_certificate_pdf(cert)
            cert.pdf_file.save(f"cert_{cert.certificate_id}.pdf", ContentFile(pdf_bytes), save=True)

        AuditLog.objects.create(
            user=self.request.user,
            institution=cert.institution,
            action='CREATE_CERTIFICATE',
            details=f"Issued certificate {cert.certificate_id} for {cert.student_name}"
        )
        CertificateStatusHistory.objects.create(
            certificate=cert,
            changed_by=self.request.user,
            previous_status='',
            new_status=cert.status,
            reason='Certificate created',
        )
        notify_administrators(
            cert.institution,
            'Certificate issued',
            f'{cert.certificate_id} was issued for {cert.student_name}.',
        )


class StudentCertificateUploadVerificationView(views.APIView):
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get('certificate')
        if not uploaded_file:
            raise serializers.ValidationError({'certificate': 'Upload a certificate PDF.'})
        if uploaded_file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError({'certificate': 'Certificate PDF must not exceed 10 MB.'})
        if not uploaded_file.name.lower().endswith('.pdf'):
            raise serializers.ValidationError({'certificate': 'Only PDF certificate files are allowed.'})

        uploaded_file.seek(0)
        if uploaded_file.read(5) != b'%PDF-':
            raise serializers.ValidationError({'certificate': 'The uploaded file is not a valid PDF document.'})
        uploaded_file.seek(0)

        try:
            reader = PdfReader(uploaded_file)
            if reader.is_encrypted:
                raise serializers.ValidationError({'certificate': 'Password-protected PDFs cannot be verified.'})
            if not reader.pages or len(reader.pages) > 20:
                raise serializers.ValidationError({'certificate': 'Upload a PDF containing 1 to 20 pages.'})
            document_text = '\n'.join(page.extract_text() or '' for page in reader.pages)
        except PdfReadError as error:
            raise serializers.ValidationError({'certificate': 'The uploaded PDF could not be read.'}) from error

        owned_certificates = Certificate.objects.filter(
            Q(student=request.user) | Q(student_email__iexact=request.user.email)
        ).select_related('institution')
        certificate = next(
            (
                item for item in owned_certificates
                if re.search(
                    rf'(?<![A-Z0-9-]){re.escape(item.certificate_id)}(?![A-Z0-9-])',
                    document_text,
                    re.IGNORECASE,
                )
            ),
            None,
        )
        if certificate is None:
            return Response({
                'valid': False,
                'message': 'No certificate belonging to your account was found in the uploaded PDF. Only certificates issued by a registered institution can be verified.',
            })

        is_valid = certificate_is_valid(certificate)
        is_expired = bool(
            certificate.expiry_date and certificate.expiry_date < timezone.localdate()
        )
        verification_status = (
            'VALID' if is_valid else 'EXPIRED' if is_expired else certificate.status
        )
        VerificationLog.objects.create(
            certificate=certificate,
            verified_by_user=request.user,
            verified_by_email=request.user.email,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            verification_method='PDF_UPLOAD',
            verification_status=verification_status,
        )

        certificate_data = PublicCertificateVerificationSerializer(certificate).data
        certificate_data['student_email'] = certificate.student_email
        return Response({
            'valid': is_valid,
            'message': (
                'Certificate matches an official record and is in good standing.'
                if is_valid else
                'The certificate matches an official record, but it is not currently valid.'
            ),
            'certificate': certificate_data,
        })


class CertificateApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = CertificateApplicationSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return CertificateApplication.objects.filter(
            student=self.request.user,
        ).select_related('institution', 'student')

    def perform_create(self, serializer):
        institution = serializer.validated_data['institution']
        if not institution.is_active:
            raise serializers.ValidationError({
                'institution': 'Applications cannot be submitted to an inactive institution.'
            })
        application = serializer.save(student=self.request.user)
        notify_administrators(
            application.institution,
            'New certificate application',
            f'{self.request.user.get_full_name() or self.request.user.email} applied for {application.certificate_type}.',
        )


class CertificateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsInstitutionAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Certificate.objects.all()
        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            return queryset
        if user.role == 'INSTITUTION_ADMIN' and user.institution_id:
            return queryset.filter(institution_id=user.institution_id)
        if user.role == 'STUDENT':
            return queryset.filter(Q(student=user) | Q(student_email__iexact=user.email))
        return queryset.none()

    def perform_update(self, serializer):
        if self.request.user.role == 'INSTITUTION_ADMIN':
            cert = serializer.save(
                institution=self.request.user.institution,
                issued_by=serializer.instance.issued_by,
            )
        else:
            cert = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            institution=cert.institution,
            action='UPDATE_CERTIFICATE',
            details=f"Updated certificate {cert.certificate_id}"
        )
        notify_administrators(
            cert.institution,
            'Certificate updated',
            f'{cert.certificate_id} was updated.',
        )


class CertificateStatusHistoryView(generics.ListAPIView):
    serializer_class = CertificateStatusHistorySerializer
    permission_classes = [IsInstitutionAdmin]

    def get_queryset(self):
        user = self.request.user
        queryset = CertificateStatusHistory.objects.filter(
            certificate_id=self.kwargs['pk']
        ).select_related('changed_by', 'certificate')
        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            return queryset
        return queryset.filter(certificate__institution_id=user.institution_id)


@api_view(['POST'])
@permission_classes([IsInstitutionAdmin])
def change_certificate_status(request, pk):
    certificates = Certificate.objects.all()
    if request.user.role != 'SUPER_ADMIN' and not request.user.is_superuser:
        certificates = certificates.filter(institution_id=request.user.institution_id)
    cert = get_object_or_404(certificates, pk=pk)

    new_status = request.data.get('status') # ACTIVE, INACTIVE, REVOKED
    reason = request.data.get('reason', '')

    if new_status not in ['ACTIVE', 'INACTIVE', 'REVOKED']:
        return Response({'error': 'Invalid status'}, status=400)

    previous_status = cert.status
    cert.status = new_status
    if new_status == 'REVOKED':
        cert.revocation_reason = reason
        cert.revoked_at = timezone.now()
        action_type = 'REVOKE_CERTIFICATE'
    elif new_status == 'ACTIVE':
        cert.revocation_reason = None
        action_type = 'ACTIVATE_CERTIFICATE'
    else:
        action_type = 'DEACTIVATE_CERTIFICATE'

    cert.save()
    CertificateStatusHistory.objects.create(
        certificate=cert,
        changed_by=request.user,
        previous_status=previous_status,
        new_status=new_status,
        reason=reason,
    )

    AuditLog.objects.create(
        user=request.user,
        institution=cert.institution,
        action=action_type,
        details=f"Changed status of {cert.certificate_id} to {new_status}. Reason: {reason}"
    )
    notify_administrators(
        cert.institution,
        f'Certificate {new_status.lower()}',
        f'{cert.certificate_id} status changed from {previous_status} to {new_status}.',
    )

    return Response({'message': f"Certificate status set to {new_status}", 'certificate': CertificateSerializer(cert).data})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def download_certificate_pdf(request, certificate_id):
    cert = get_object_or_404(Certificate, certificate_id=certificate_id)
    if cert.pdf_file:
        response = FileResponse(
            cert.pdf_file.open('rb'),
            content_type='application/pdf',
            as_attachment=True,
            filename=f'Certificate-{cert.certificate_id}.pdf',
        )
        return response
    pdf_bytes = generate_certificate_pdf(cert)
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Certificate-{cert.certificate_id}.pdf"'
    return response


# Public Verification View
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_verify_certificate(request, certificate_id):
    cert = Certificate.objects.filter(certificate_id__iexact=certificate_id.strip()).first()
    
    # Method
    method = request.query_params.get('method', 'MANUAL_ID') # MANUAL_ID, QR_SCAN, DIRECT_LINK
    if method not in {'MANUAL_ID', 'QR_SCAN', 'DIRECT_LINK'}:
        return Response({'error': 'Invalid verification method.'}, status=400)
    
    # Get Client IP
    ip = request.META.get('REMOTE_ADDR')

    user_agent = request.META.get('HTTP_USER_AGENT', '')

    if not cert:
        return Response({
            'valid': False,
            'message': 'Certificate not found. The ID entered does not match any accredited certificate in our records.',
            'certificate_id': certificate_id
        }, status=status.HTTP_404_NOT_FOUND)

    # Log verification
    is_expired = bool(cert.expiry_date and cert.expiry_date < timezone.localdate())
    is_valid = cert.status == 'ACTIVE' and not is_expired
    verification_status = (
        'VALID' if is_valid else 'EXPIRED' if is_expired else cert.status
    )

    VerificationLog.objects.create(
        certificate=cert,
        verified_by_user=request.user if request.user.is_authenticated else None,
        verified_by_email=request.user.email if request.user.is_authenticated else None,
        ip_address=ip,
        user_agent=user_agent,
        verification_method=method,
        verification_status=verification_status
    )
    notify_administrators(
        cert.institution,
        'Certificate verification recorded',
        f'{cert.certificate_id} was checked and returned {verification_status}.',
    )

    if is_expired:
        message = 'This certificate has expired.'
    elif cert.status == 'REVOKED':
        message = f"This certificate was revoked. Reason: {cert.revocation_reason or 'No reason provided.'}"
    elif cert.status == 'INACTIVE':
        message = 'This certificate is currently deactivated by the institution.'
    else:
        message = 'Certificate is authentic, verified, and in good standing.'

    data = PublicCertificateVerificationSerializer(cert).data
    return Response({
        'valid': is_valid,
        'status': cert.status,
        'message': message,
        'certificate': data
    })


# Analytics & Dashboard Stats
def build_dashboard_stats(certificates, verifications, students, total_institutions=None, institution_name=None):
    today = timezone.localdate()
    week_start = today - timedelta(days=6)
    certificates = certificates.select_related('institution').order_by('-created_at')
    verifications = verifications.select_related(
        'certificate', 'certificate__institution'
    ).order_by('-verified_at')

    verification_counts = {
        row['activity_date'].isoformat(): row['total']
        for row in verifications.filter(verified_at__date__gte=week_start)
        .annotate(activity_date=TruncDate('verified_at'))
        .values('activity_date')
        .annotate(total=Count('id'))
    }
    certificate_counts = {
        row['activity_date'].isoformat(): row['total']
        for row in certificates.filter(created_at__date__gte=week_start)
        .annotate(activity_date=TruncDate('created_at'))
        .values('activity_date')
        .annotate(total=Count('id'))
    }
    activity_dates = [week_start + timedelta(days=offset) for offset in range(7)]

    stats = {
        'total_certificates': certificates.count(),
        'active_certificates': certificates.filter(status='ACTIVE').filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
        ).count(),
        'inactive_certificates': certificates.filter(status='INACTIVE').count(),
        'revoked_certificates': certificates.filter(status='REVOKED').count(),
        'expired_certificates': certificates.filter(
            status='ACTIVE', expiry_date__lt=today
        ).count(),
        'total_students': students.count(),
        'total_verifications': verifications.count(),
        'verifications_last_7_days': sum(verification_counts.values()),
        'verification_activity': [
            {
                'date': day.isoformat(),
                'day': day.strftime('%a'),
                'verifications': verification_counts.get(day.isoformat(), 0),
            }
            for day in activity_dates
        ],
        'certificate_activity': [
            {
                'date': day.isoformat(),
                'day': day.strftime('%a'),
                'certificates': certificate_counts.get(day.isoformat(), 0),
            }
            for day in activity_dates
        ],
        'recent_verifications': VerificationLogSerializer(verifications[:8], many=True).data,
        'recent_certificates': CertificateSerializer(certificates[:5], many=True).data,
    }
    if total_institutions is not None:
        stats['total_institutions'] = total_institutions
    if institution_name is not None:
        stats['institution_name'] = institution_name
    return stats


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    if user.role == 'SUPER_ADMIN' or user.is_superuser:
        return Response(build_dashboard_stats(
            Certificate.objects.all(),
            VerificationLog.objects.all(),
            User.objects.filter(role='STUDENT'),
            total_institutions=Institution.objects.count(),
        ))

    if user.role == 'INSTITUTION_ADMIN':
        if not user.institution_id:
            return Response({'error': 'No institution assigned'}, status=400)
        return Response(build_dashboard_stats(
            Certificate.objects.filter(institution_id=user.institution_id),
            VerificationLog.objects.filter(certificate__institution_id=user.institution_id),
            User.objects.filter(institution_id=user.institution_id, role='STUDENT'),
            institution_name=user.institution.name,
        ))

    if user.role == 'STUDENT':
        certificates = Certificate.objects.filter(Q(student=user) | Q(student_email__iexact=user.email))
        today = timezone.localdate()
        return Response({
            'total_certificates': certificates.count(),
            'active_certificates': certificates.filter(status='ACTIVE').filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
            ).count(),
            'certificates': CertificateSerializer(certificates, many=True).data,
        })

    return Response({'error': 'Unauthorized'}, status=403)


# Audit Logs View
class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    pagination_class = OptionalPageNumberPagination

    def get_permissions(self):
        return [IsInstitutionAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            queryset = AuditLog.objects.all()
        else:
            queryset = AuditLog.objects.filter(institution=user.institution)

        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(details__icontains=search)
                | Q(user__email__icontains=search)
                | Q(institution__name__icontains=search)
            )
        return queryset.select_related('user', 'institution').order_by('-timestamp')


# Verification Logs View
class VerificationLogListView(generics.ListAPIView):
    serializer_class = VerificationLogSerializer
    pagination_class = OptionalPageNumberPagination

    def get_permissions(self):
        return [IsInstitutionAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            queryset = VerificationLog.objects.all()
        else:
            queryset = VerificationLog.objects.filter(certificate__institution=user.institution)

        certificate_id = self.request.query_params.get('certificate_id', '').strip()
        if certificate_id:
            queryset = queryset.filter(certificate__certificate_id__icontains=certificate_id)
        result_status = self.request.query_params.get('status', '').upper()
        if result_status:
            queryset = queryset.filter(verification_status=result_status)
        date_after = self.request.query_params.get('date_after')
        date_before = self.request.query_params.get('date_before')
        if date_after:
            queryset = queryset.filter(verified_at__date__gte=date_after)
        if date_before:
            queryset = queryset.filter(verified_at__date__lte=date_before)
        return queryset.select_related(
            'certificate', 'certificate__institution', 'verified_by_user'
        ).order_by('-verified_at')


class NotificationListView(generics.ListAPIView):
    serializer_class = SystemNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = OptionalPageNumberPagination

    def get_queryset(self):
        queryset = SystemNotification.objects.filter(user=self.request.user)
        if self.request.query_params.get('unread_only') == 'true':
            queryset = queryset.filter(is_read=False)
        return queryset.order_by('-created_at')


class NotificationReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        notification = get_object_or_404(
            SystemNotification,
            pk=pk,
            user=request.user,
        )
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(SystemNotificationSerializer(notification).data)
