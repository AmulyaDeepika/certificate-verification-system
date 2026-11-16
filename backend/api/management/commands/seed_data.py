from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, Institution, Certificate, VerificationLog, AuditLog
from datetime import timedelta

class Command(BaseCommand):
    help = 'Seeds database with realistic demo data for Super Admin, Institutions, Admins, Students, and Certificates'

    def handle(self, *args, **options):
        self.stdout.write("Seeding data...")

        # 1. Super Admin
        super_admin, created = User.objects.get_or_create(
            email='admin@certverify.com',
            defaults={
                'username': 'superadmin',
                'role': 'SUPER_ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Global',
                'last_name': 'SuperAdmin'
            }
        )
        super_admin.set_password('admin123')
        super_admin.save()
        self.stdout.write("Created Super Admin: admin@certverify.com / admin123")

        # 2. Institutions
        inst1, _ = Institution.objects.get_or_create(
            code='MIT-GLOBAL',
            defaults={
                'name': 'MIT Institute of Technology',
                'email': 'contact@mitglobal.edu',
                'phone': '+1 (555) 234-5678',
                'address': '77 Massachusetts Ave, Cambridge, MA',
                'website': 'https://mitglobal.edu',
                'is_active': True
            }
        )

        inst2, _ = Institution.objects.get_or_create(
            code='STAN-ACAD',
            defaults={
                'name': 'Stanford Academy of Computing',
                'email': 'registry@stanfordacad.edu',
                'phone': '+1 (555) 987-6543',
                'address': '450 Jane Stanford Way, Stanford, CA',
                'website': 'https://stanfordacad.edu',
                'is_active': True
            }
        )

        # 3. Institution Admins
        inst_admin1, _ = User.objects.get_or_create(
            email='admin@mit.edu',
            defaults={
                'username': 'mit_admin',
                'role': 'INSTITUTION_ADMIN',
                'institution': inst1,
                'first_name': 'Dr. Robert',
                'last_name': 'Chen'
            }
        )
        inst_admin1.set_password('admin123')
        inst_admin1.save()

        inst_admin2, _ = User.objects.get_or_create(
            email='admin@stanford.edu',
            defaults={
                'username': 'stanford_admin',
                'role': 'INSTITUTION_ADMIN',
                'institution': inst2,
                'first_name': 'Sarah',
                'last_name': 'Jenkins'
            }
        )
        inst_admin2.set_password('admin123')
        inst_admin2.save()

        # 4. Students
        student1, _ = User.objects.get_or_create(
            email='alex.morgan@gmail.com',
            defaults={
                'username': 'alex_morgan',
                'role': 'STUDENT',
                'institution': inst1,
                'first_name': 'Alex',
                'last_name': 'Morgan',
                'student_id_number': 'STU-2026-001'
            }
        )
        student1.set_password('student123')
        student1.save()

        student2, _ = User.objects.get_or_create(
            email='priya.sharma@gmail.com',
            defaults={
                'username': 'priya_sharma',
                'role': 'STUDENT',
                'institution': inst2,
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'student_id_number': 'STU-2026-042'
            }
        )
        student2.set_password('student123')
        student2.save()

        student3, _ = User.objects.get_or_create(
            email='michael.brown@gmail.com',
            defaults={
                'username': 'michael_brown',
                'role': 'STUDENT',
                'institution': inst1,
                'first_name': 'Michael',
                'last_name': 'Brown',
                'student_id_number': 'STU-2026-105'
            }
        )
        student3.set_password('student123')
        student3.save()

        # 5. Certificates
        c1, _ = Certificate.objects.get_or_create(
            certificate_id='CERT-MIT-2026-88F4A190',
            defaults={
                'institution': inst1,
                'issued_by': inst_admin1,
                'student': student1,
                'student_name': 'Alex Morgan',
                'student_email': student1.email,
                'student_roll_no': student1.student_id_number,
                'title': 'Full Stack Web Development & Cloud Architecture',
                'course_name': 'Advanced Full Stack Engineering',
                'description': 'Demonstrated mastery of React.js, Django REST Framework, database design, and cloud deployments.',
                'grade': 'Distinction (A+)',
                'issue_date': timezone.now().date() - timedelta(days=30),
                'status': 'ACTIVE',
            }
        )
        c1.save() # Triggers QR code generation

        c2, _ = Certificate.objects.get_or_create(
            certificate_id='CERT-STAN-2026-11C2B904',
            defaults={
                'institution': inst2,
                'issued_by': inst_admin2,
                'student': student2,
                'student_name': 'Priya Sharma',
                'student_email': student2.email,
                'student_roll_no': student2.student_id_number,
                'title': 'Data Science & Machine Learning Engineering',
                'course_name': 'Deep Learning and AI Systems',
                'description': 'Successfully developed and deployed neural network models and large-scale data validation pipelines.',
                'grade': 'Honors (A)',
                'issue_date': timezone.now().date() - timedelta(days=15),
                'status': 'ACTIVE',
            }
        )
        c2.save()

        c3, _ = Certificate.objects.get_or_create(
            certificate_id='CERT-MIT-2026-REVOKED99',
            defaults={
                'institution': inst1,
                'issued_by': inst_admin1,
                'student': student3,
                'student_name': 'Michael Brown',
                'student_email': student3.email,
                'student_roll_no': student3.student_id_number,
                'title': 'Cybersecurity Operations & Audit',
                'course_name': 'Defensive Security',
                'description': 'Network defense, security telemetry, vulnerability scanning, and incident response.',
                'grade': 'B+',
                'issue_date': timezone.now().date() - timedelta(days=60),
                'status': 'REVOKED',
                'revocation_reason': 'Academic integrity code violation reported during project review.',
                'revoked_at': timezone.now() - timedelta(days=5),
            }
        )
        c3.save()

        # 6. Verification Logs
        VerificationLog.objects.get_or_create(
            certificate=c1,
            verification_method='QR_SCAN',
            verification_status='ACTIVE',
            ip_address='192.168.1.101',
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
        )

        VerificationLog.objects.get_or_create(
            certificate=c1,
            verification_method='MANUAL_ID',
            verification_status='ACTIVE',
            ip_address='127.0.0.1',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
        )

        VerificationLog.objects.get_or_create(
            certificate=c3,
            verification_method='MANUAL_ID',
            verification_status='REVOKED',
            ip_address='10.0.0.45',
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        )

        # 7. Audit Logs
        AuditLog.objects.get_or_create(
            user=inst_admin1,
            institution=inst1,
            action='CREATE_CERTIFICATE',
            details='Issued certificate CERT-MIT-2026-88F4A190 for Alex Morgan'
        )

        AuditLog.objects.get_or_create(
            user=inst_admin1,
            institution=inst1,
            action='REVOKE_CERTIFICATE',
            details='Revoked certificate CERT-MIT-2026-REVOKED99 for Michael Brown. Reason: Academic integrity code violation'
        )

        self.stdout.write(self.style.SUCCESS("Database successfully populated with demo data!"))

