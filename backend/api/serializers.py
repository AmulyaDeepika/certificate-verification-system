from rest_framework import serializers
from django.utils import timezone
from .models import (
    User, Institution, Certificate, CertificateStatusHistory,
    VerificationLog, AuditLog, SystemNotification, CertificateApplication,
)


def certificate_is_valid(certificate):
    return certificate.status == 'ACTIVE' and (
        not certificate.expiry_date or certificate.expiry_date >= timezone.localdate()
    )


class InstitutionSerializer(serializers.ModelSerializer):
    certificate_count = serializers.SerializerMethodField()
    admin_count = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = '__all__'

    def get_certificate_count(self, obj):
        return obj.certificates.count()

    def get_admin_count(self, obj):
        return obj.members.filter(role='INSTITUTION_ADMIN').count()


class UserSerializer(serializers.ModelSerializer):
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'phone', 'institution', 'institution_name', 'student_id_number', 'profile_image', 'is_active', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'A password is required when creating a user.'})
        user = super().create(validated_data)
        user.set_password(password)
        user.save()
        return user


class CurrentUserProfileSerializer(serializers.ModelSerializer):
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'role',
            'phone', 'institution', 'institution_name', 'student_id_number',
            'profile_image', 'date_joined',
        ]
        read_only_fields = [
            'id', 'email', 'username', 'role', 'institution',
            'institution_name', 'date_joined',
        ]


class CertificateSerializer(serializers.ModelSerializer):
    institution_name = serializers.ReadOnlyField(source='institution.name')
    institution_code = serializers.ReadOnlyField(source='institution.code')
    issued_by_name = serializers.ReadOnlyField(source='issued_by.email')
    is_valid = serializers.SerializerMethodField()
    student_initial_password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=6,
        style={'input_type': 'password'},
    )

    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = ['certificate_id', 'qr_code', 'created_at', 'updated_at', 'revoked_at']
        extra_kwargs = {'institution': {'required': False}}

    def get_is_valid(self, obj):
        return certificate_is_valid(obj)


class PublicCertificateVerificationSerializer(serializers.ModelSerializer):
    institution_name = serializers.ReadOnlyField(source='institution.name')
    institution_code = serializers.ReadOnlyField(source='institution.code')
    institution_website = serializers.ReadOnlyField(source='institution.website')
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'certificate_id',
            'student_name',
            'course_name',
            'title',
            'description',
            'grade',
            'issue_date',
            'expiry_date',
            'status',
            'revocation_reason',
            'revoked_at',
            'institution_name',
            'institution_code',
            'institution_website',
            'is_valid',
            'qr_code',
        ]

    def get_is_valid(self, obj):
        return certificate_is_valid(obj)


class VerificationLogSerializer(serializers.ModelSerializer):
    certificate_id = serializers.ReadOnlyField(source='certificate.certificate_id')
    student_name = serializers.ReadOnlyField(source='certificate.student_name')
    institution_name = serializers.ReadOnlyField(source='certificate.institution.name')
    verified_by_user_name = serializers.ReadOnlyField(source='verified_by_user.first_name')

    class Meta:
        model = VerificationLog
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_role = serializers.ReadOnlyField(source='user.role')
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = AuditLog
        fields = '__all__'


class SystemNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemNotification
        fields = '__all__'


class CertificateStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.ReadOnlyField(source='changed_by.email')

    class Meta:
        model = CertificateStatusHistory
        fields = [
            'id', 'previous_status', 'new_status', 'reason',
            'changed_at', 'changed_by_email',
        ]


class CertificateApplicationSerializer(serializers.ModelSerializer):
    institution_name = serializers.ReadOnlyField(source='institution.name')
    student_email = serializers.ReadOnlyField(source='student.email')

    class Meta:
        model = CertificateApplication
        fields = [
            'id', 'student', 'student_email', 'institution',
            'institution_name', 'certificate_type', 'purpose', 'status',
            'admin_note', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'student_email', 'institution_name', 'status',
            'admin_note', 'created_at', 'updated_at',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'phone', 'role', 'institution', 'student_id_number', 'password', 'confirm_password']

    def validate_email(self, value):
        normalized_email = User.objects.normalize_email(value).lower()
        existing_user = User.objects.filter(email__iexact=normalized_email).first()
        if existing_user and not existing_user.is_active and existing_user.role == 'STUDENT':
            raise serializers.ValidationError(
                'This email has a pending registration. Continue to verification to request a new code.'
            )
        if existing_user:
            raise serializers.ValidationError('An account with this email already exists. Please sign in.')
        return normalized_email

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if attrs.get('role', 'STUDENT') != 'STUDENT':
            raise serializers.ValidationError({"role": "Public registration is limited to student accounts."})
        attrs['role'] = 'STUDENT'
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.is_active = False
        user.save(update_fields=['password', 'is_active'])
        return user
