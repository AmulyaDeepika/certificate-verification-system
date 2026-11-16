import tempfile
import re
from datetime import timedelta

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from .pdf_generator import generate_certificate_pdf

from .models import (
    AuditLog, Certificate, CertificateStatusHistory, EmailOTP, Institution, SystemNotification,
    CertificateApplication, User, VerificationLog,
)


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    EMAIL_HOST='smtp.test',
    EMAIL_HOST_USER='test@example.com',
    EMAIL_HOST_PASSWORD='test-password',
)
class CertificateAccessTests(APITestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        self.media_settings = override_settings(MEDIA_ROOT=self.media_dir.name)
        self.media_settings.enable()

        self.institution_a = Institution.objects.create(
            name='Institution A',
            code='INST-A',
            email='a@example.com',
        )
        self.institution_b = Institution.objects.create(
            name='Institution B',
            code='INST-B',
            email='b@example.com',
        )
        self.admin_a = User.objects.create_user(
            email='admin-a@example.com',
            password='secure-pass-123',
            role='INSTITUTION_ADMIN',
            institution=self.institution_a,
        )
        self.student_a = User.objects.create_user(
            email='student-a@example.com',
            password='secure-pass-123',
            role='STUDENT',
            institution=self.institution_a,
        )
        self.student_b = User.objects.create_user(
            email='student-b@example.com',
            password='secure-pass-123',
            role='STUDENT',
            institution=self.institution_b,
        )
        self.certificate_a = Certificate.objects.create(
            institution=self.institution_a,
            issued_by=self.admin_a,
            student=self.student_a,
            student_name='Student A',
            student_email=self.student_a.email,
            title='Degree',
            course_name='Computer Science',
        )
        self.certificate_b = Certificate.objects.create(
            institution=self.institution_b,
            issued_by=self.admin_a,
            student=self.student_b,
            student_name='Student B',
            student_email=self.student_b.email,
            title='Degree',
            course_name='Information Systems',
        )

    def tearDown(self):
        self.media_settings.disable()
        self.media_dir.cleanup()

    def test_public_registration_cannot_create_an_admin(self):
        response = self.client.post(
            reverse('register'),
            {
                'email': 'new-admin@example.com',
                'username': 'new-admin',
                'role': 'SUPER_ADMIN',
                'password': 'secure-pass-123',
                'confirm_password': 'secure-pass-123',
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email='new-admin@example.com').exists())

    @override_settings(EMAIL_HOST='')
    def test_registration_does_not_create_pending_account_without_email_service(self):
        response = self.client.post(
            reverse('register'),
            {
                'email': 'email-not-configured@example.com',
                'username': 'email-not-configured',
                'role': 'STUDENT',
                'password': 'secure-pass-123',
                'confirm_password': 'secure-pass-123',
            },
        )

        self.assertEqual(response.status_code, 503)
        self.assertIn('Email delivery is not configured', response.data['detail'])
        self.assertFalse(User.objects.filter(email='email-not-configured@example.com').exists())
        self.assertFalse(EmailOTP.objects.filter(email='email-not-configured@example.com').exists())

    def test_public_registration_creates_a_student(self):
        response = self.client.post(
            reverse('register'),
            {
                'email': 'new-student@example.com',
                'username': 'new-student',
                'role': 'STUDENT',
                'password': 'secure-pass-123',
                'confirm_password': 'secure-pass-123',
            },
        )

        self.assertEqual(response.status_code, 201)
        student = User.objects.get(email='new-student@example.com')
        self.assertEqual(student.role, 'STUDENT')
        self.assertFalse(student.is_active)
        self.assertEqual(mail.outbox[0].to, [student.email])
        self.assertEqual(mail.outbox[0].from_email, 'test@example.com')
        otp_code = re.search(r'\b\d{6}\b', mail.outbox[0].body).group()
        self.assertNotEqual(
            self.client.post(
                reverse('token_obtain_pair'),
                {'email': student.email, 'password': 'secure-pass-123'},
            ).status_code,
            200,
        )
        verification_response = self.client.post(
            reverse('register_verify_otp'),
            {'email': student.email, 'otp': otp_code},
        )
        self.assertEqual(verification_response.status_code, 200)
        student.refresh_from_db()
        self.assertTrue(student.is_active)
        self.assertEqual(
            self.client.post(
                reverse('token_obtain_pair'),
                {'email': student.email, 'password': 'secure-pass-123'},
            ).status_code,
            200,
        )
        self.assertTrue(
            EmailOTP.objects.get(email=student.email, purpose='REGISTER').is_used
        )
        self.assertTrue(
            AuditLog.objects.filter(
                user__email='new-student@example.com',
                action='USER_REGISTER',
            ).exists()
        )

    def test_registration_otp_rejects_incorrect_and_expired_codes(self):
        registration_response = self.client.post(
            reverse('register'),
            {
                'email': 'otp-student@example.com',
                'username': 'otp-student',
                'role': 'STUDENT',
                'password': 'secure-pass-123',
                'confirm_password': 'secure-pass-123',
            },
        )
        self.assertEqual(registration_response.status_code, 201)
        student = User.objects.get(email='otp-student@example.com')

        invalid_response = self.client.post(
            reverse('register_verify_otp'),
            {'email': student.email, 'otp': '000000'},
        )
        self.assertEqual(invalid_response.status_code, 400)
        otp = EmailOTP.objects.get(email=student.email)
        self.assertEqual(otp.attempts, 1)

        otp.created_at = timezone.now() - timedelta(minutes=2)
        otp.save(update_fields=['created_at'])
        expired_response = self.client.post(
            reverse('register_verify_otp'),
            {'email': student.email, 'otp': re.search(r'\b\d{6}\b', mail.outbox[0].body).group()},
        )
        self.assertEqual(expired_response.status_code, 400)
        self.assertIn('expired', expired_response.data['detail'])
        student.refresh_from_db()
        self.assertFalse(student.is_active)

    def test_registration_otp_resend_is_limited_to_once_per_minute(self):
        registration_response = self.client.post(
            reverse('register'),
            {
                'email': 'resend-student@example.com',
                'username': 'resend-student',
                'role': 'STUDENT',
                'password': 'secure-pass-123',
                'confirm_password': 'secure-pass-123',
            },
        )
        self.assertEqual(registration_response.status_code, 201)

        limited_response = self.client.post(
            reverse('register_resend_otp'),
            {'email': 'resend-student@example.com'},
        )
        self.assertEqual(limited_response.status_code, 429)

        otp = EmailOTP.objects.get(email='resend-student@example.com')
        otp.created_at = timezone.now() - timedelta(minutes=2)
        otp.save(update_fields=['created_at'])
        resent_response = self.client.post(
            reverse('register_resend_otp'),
            {'email': 'resend-student@example.com'},
        )
        self.assertEqual(resent_response.status_code, 200)
        self.assertEqual(len(mail.outbox), 2)

    def test_admin_can_list_students_in_their_institution(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.get(reverse('user_list_create'), {'role': 'STUDENT'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual([user['email'] for user in response.data], [self.student_a.email])
        self.assertIn('first_name', response.data[0])
        self.assertIn('last_name', response.data[0])

    def test_student_cannot_list_other_users(self):
        self.client.force_authenticate(user=self.student_a)

        response = self.client.get(reverse('user_list_create'), {'role': 'STUDENT'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual([user['email'] for user in response.data], [self.student_a.email])

    def test_student_login_is_visible_in_admin_activity(self):
        login_response = self.client.post(
            reverse('token_obtain_pair'),
            {'email': self.student_a.email, 'password': 'secure-pass-123'},
        )
        self.assertEqual(login_response.status_code, 200)

        self.client.force_authenticate(user=self.admin_a)
        activity_response = self.client.get(reverse('audit_logs'))

        self.assertEqual(activity_response.status_code, 200)
        student_login = next(
            log for log in activity_response.data
            if log['action'] == 'USER_LOGIN' and log['user_email'] == self.student_a.email
        )
        self.assertEqual(student_login['user_role'], 'STUDENT')

    def test_student_login_endpoint_rejects_admin_accounts(self):
        response = self.client.post(
            reverse('token_obtain_pair'),
            {'email': self.admin_a.email, 'password': 'secure-pass-123'},
        )

        self.assertEqual(response.status_code, 400)

    def test_admin_login_endpoint_rejects_student_accounts(self):
        response = self.client.post(
            reverse('admin_token_obtain_pair'),
            {'email': self.student_a.email, 'password': 'secure-pass-123'},
        )

        self.assertEqual(response.status_code, 400)

    def test_student_cannot_retrieve_another_students_certificate(self):
        self.client.force_authenticate(user=self.student_a)

        response = self.client.get(
            reverse('certificate_detail', args=[self.certificate_b.pk])
        )

        self.assertEqual(response.status_code, 404)

    def test_student_certificate_list_contains_only_their_records(self):
        self.client.force_authenticate(user=self.student_a)

        response = self.client.get(reverse('certificate_list_create'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item['certificate_id'] for item in response.data],
            [self.certificate_a.certificate_id],
        )

    def test_student_can_upload_and_verify_their_issued_certificate_pdf(self):
        self.client.force_authenticate(user=self.student_a)
        pdf = generate_certificate_pdf(self.certificate_a)

        response = self.client.post(
            reverse('certificate_upload_verification'),
            {
                'certificate': SimpleUploadedFile(
                    'certificate.pdf', pdf, content_type='application/pdf'
                ),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['valid'])
        self.assertEqual(
            response.data['certificate']['certificate_id'],
            self.certificate_a.certificate_id,
        )
        self.assertEqual(
            response.data['certificate']['student_email'],
            self.student_a.email,
        )
        self.assertTrue(
            VerificationLog.objects.filter(
                certificate=self.certificate_a,
                verified_by_user=self.student_a,
                verification_method='PDF_UPLOAD',
            ).exists()
        )

    def test_student_cannot_get_another_students_certificate_details_from_upload(self):
        self.client.force_authenticate(user=self.student_a)
        pdf = generate_certificate_pdf(self.certificate_b)

        response = self.client.post(
            reverse('certificate_upload_verification'),
            {
                'certificate': SimpleUploadedFile(
                    'certificate.pdf', pdf, content_type='application/pdf'
                ),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['valid'])
        self.assertNotIn('certificate', response.data)

    def test_student_certificate_upload_rejects_non_pdf_files(self):
        self.client.force_authenticate(user=self.student_a)

        response = self.client.post(
            reverse('certificate_upload_verification'),
            {
                'certificate': SimpleUploadedFile(
                    'certificate.txt', b'not a PDF', content_type='text/plain'
                ),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('certificate', response.data)

    def test_student_can_see_certificate_issued_before_registration(self):
        certificate = Certificate.objects.create(
            institution=self.institution_a,
            issued_by=self.admin_a,
            student_name='New Student',
            student_email='new.student@example.com',
            title='Certificate',
            course_name='Information Technology',
        )
        registration_response = self.client.post(
            reverse('register'),
            {
                'email': 'new.student@EXAMPLE.com',
                'username': 'new-student',
                'role': 'STUDENT',
                'password': 'secure-pass-123',
                'confirm_password': 'secure-pass-123',
            },
        )
        self.assertEqual(registration_response.status_code, 201)
        otp_code = re.search(r'\b\d{6}\b', mail.outbox[-1].body).group()
        verification_response = self.client.post(
            reverse('register_verify_otp'),
            {'email': 'new.student@example.com', 'otp': otp_code},
        )
        self.assertEqual(verification_response.status_code, 200)
        student = User.objects.get(email__iexact='new.student@example.com')
        certificate.refresh_from_db()
        self.assertEqual(certificate.student, student)
        self.client.force_authenticate(user=student)

        response = self.client.get(reverse('certificate_list_create'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item['certificate_id'] for item in response.data],
            [certificate.certificate_id],
        )
        detail_response = self.client.get(
            reverse('certificate_detail', args=[certificate.pk])
        )
        self.assertEqual(detail_response.status_code, 200)

    def test_registration_rejects_existing_email_case_insensitively(self):
        response = self.client.post(
            reverse('register'),
            {
                'email': self.student_a.email.upper(),
                'username': 'duplicate-student',
                'role': 'STUDENT',
                'password': 'secure-pass-123',
                'confirm_password': 'secure-pass-123',
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(User.objects.filter(email__iexact=self.student_a.email).count(), 1)

    def test_institution_admin_cannot_retrieve_another_institutions_certificate(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.get(
            reverse('certificate_detail', args=[self.certificate_b.pk])
        )

        self.assertEqual(response.status_code, 404)

    def test_institution_admin_cannot_change_another_institutions_certificate(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            reverse('certificate_change_status', args=[self.certificate_b.pk]),
            {'status': 'REVOKED', 'reason': 'Invalid'},
        )

        self.assertEqual(response.status_code, 404)
        self.certificate_b.refresh_from_db()
        self.assertEqual(self.certificate_b.status, 'ACTIVE')

    def test_institution_admin_cannot_promote_a_student_account(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.patch(
            reverse('user_detail', args=[self.student_a.pk]),
            {'role': 'SUPER_ADMIN'},
        )

        self.assertEqual(response.status_code, 400)
        self.student_a.refresh_from_db()
        self.assertEqual(self.student_a.role, 'STUDENT')

    def test_authenticated_verification_is_attributed_to_the_user(self):
        self.client.force_authenticate(user=self.student_a)

        response = self.client.get(
            reverse('public_verify', args=[self.certificate_a.certificate_id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['valid'])
        self.assertTrue(response.data['certificate']['is_valid'])
        log = VerificationLog.objects.get(certificate=self.certificate_a)
        self.assertEqual(log.verified_by_user, self.student_a)
        self.assertEqual(log.verified_by_email, self.student_a.email)

    def test_expired_certificate_is_reported_as_invalid(self):
        self.certificate_a.expiry_date = timezone.localdate() - timedelta(days=1)
        self.certificate_a.save()
        self.client.force_authenticate(user=self.student_a)

        response = self.client.get(
            reverse('public_verify', args=[self.certificate_a.certificate_id])
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['valid'])
        self.assertFalse(response.data['certificate']['is_valid'])
        log = VerificationLog.objects.get(certificate=self.certificate_a)
        self.assertEqual(log.verification_status, 'EXPIRED')

    def test_certificate_search_and_pagination_are_server_side(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.get(
            reverse('certificate_list_create'),
            {'search': 'Computer Science', 'page': 1, 'page_size': 1},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(
            response.data['results'][0]['certificate_id'],
            self.certificate_a.certificate_id,
        )

    def test_uploaded_certificate_pdf_is_validated(self):
        self.client.force_authenticate(user=self.admin_a)
        payload = {
            'student_name': 'Student A',
            'student_email': self.student_a.email,
            'title': 'Degree',
            'course_name': 'Computer Science',
            'pdf_file': SimpleUploadedFile(
                'certificate.pdf',
                b'%PDF-1.4\nvalid test file',
                content_type='application/pdf',
            ),
        }

        response = self.client.post(reverse('certificate_list_create'), payload, format='multipart')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['pdf_file'].endswith('.pdf'))

    def test_admin_can_create_student_login_when_issuing_certificate(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.post(
            reverse('certificate_list_create'),
            {
                'student_name': 'New Student',
                'student_email': 'new.student@example.com',
                'student_initial_password': 'student-pass-123',
                'title': 'Degree',
                'course_name': 'Computer Science',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201, response.data)
        student = User.objects.get(email='new.student@example.com')
        self.assertEqual(student.role, 'STUDENT')
        self.assertEqual(student.institution, self.institution_a)
        self.assertTrue(student.check_password('student-pass-123'))

        login_response = self.client.post(
            reverse('token_obtain_pair'),
            {'email': student.email, 'password': 'student-pass-123'},
        )
        self.assertEqual(login_response.status_code, 200)

        self.client.force_authenticate(user=student)
        certificate_response = self.client.get(reverse('certificate_list_create'))
        self.assertEqual(certificate_response.status_code, 200)
        self.assertEqual(len(certificate_response.data), 1)

    def test_new_student_certificate_requires_initial_portal_password(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.post(
            reverse('certificate_list_create'),
            {
                'student_name': 'New Student',
                'student_email': 'new.student@example.com',
                'title': 'Degree',
                'course_name': 'Computer Science',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email__iexact='new.student@example.com').exists())
        self.assertFalse(Certificate.objects.filter(student_email__iexact='new.student@example.com').exists())

    def test_certificate_issue_does_not_change_existing_student_password(self):
        self.client.force_authenticate(user=self.admin_a)
        response = self.client.post(
            reverse('certificate_list_create'),
            {
                'student_name': 'Student A',
                'student_email': self.student_a.email,
                'student_initial_password': 'different-pass-123',
                'title': 'Additional Degree',
                'course_name': 'Computer Science',
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.student_a.refresh_from_db()
        self.assertTrue(self.student_a.check_password('secure-pass-123'))
        self.assertFalse(self.student_a.check_password('different-pass-123'))

    def test_uploaded_non_pdf_is_rejected(self):
        self.client.force_authenticate(user=self.admin_a)
        certificate_count = Certificate.objects.count()
        payload = {
            'student_name': 'Student A',
            'student_email': self.student_a.email,
            'title': 'Degree',
            'course_name': 'Computer Science',
            'pdf_file': SimpleUploadedFile(
                'certificate.pdf',
                b'not a PDF',
                content_type='application/pdf',
            ),
        }

        response = self.client.post(reverse('certificate_list_create'), payload, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Certificate.objects.count(), certificate_count)

    def test_status_changes_create_history_and_notification(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            reverse('certificate_change_status', args=[self.certificate_a.pk]),
            {'status': 'REVOKED', 'reason': 'Issuer review'},
        )

        self.assertEqual(response.status_code, 200)
        history = CertificateStatusHistory.objects.get(certificate=self.certificate_a)
        self.assertEqual(history.previous_status, 'ACTIVE')
        self.assertEqual(history.new_status, 'REVOKED')
        self.assertTrue(SystemNotification.objects.filter(user=self.admin_a).exists())

    def test_students_can_submit_and_only_see_their_own_applications(self):
        self.client.force_authenticate(user=self.student_a)
        response = self.client.post(
            reverse('certificate_application_list_create'),
            {
                'institution': self.institution_a.pk,
                'certificate_type': 'Degree certificate',
                'purpose': 'Applying for my degree certificate',
            },
        )

        self.assertEqual(response.status_code, 201)
        application = CertificateApplication.objects.get()
        self.assertEqual(application.student, self.student_a)
        self.assertEqual(application.status, 'PENDING')

        self.client.force_authenticate(user=self.student_b)
        response = self.client.get(reverse('certificate_application_list_create'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

    def test_only_students_can_create_certificate_applications(self):
        self.client.force_authenticate(user=self.admin_a)

        response = self.client.post(
            reverse('certificate_application_list_create'),
            {
                'institution': self.institution_a.pk,
                'certificate_type': 'Degree certificate',
            },
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(CertificateApplication.objects.exists())

    def test_public_certificate_types_include_active_awards(self):
        response = self.client.get(reverse('public_certificate_types'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['course_name'], 'Computer Science')
