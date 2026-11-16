from io import BytesIO
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, Line
from django.conf import settings

def generate_certificate_pdf(certificate):
    buffer = BytesIO()
    # Landscape Letter: 11 x 8.5 inches (792 x 612 pt)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    inst_name = certificate.institution.name.upper() if certificate.institution else "ACCREDITED INSTITUTION"
    title = certificate.title
    student_name = certificate.student_name
    course_name = certificate.course_name
    cert_id = certificate.certificate_id
    issue_date = certificate.issue_date.strftime("%B %d, %Y") if certificate.issue_date else "N/A"
    grade = f"with Grade: {certificate.grade}" if certificate.grade else ""

    inst_style = ParagraphStyle(
        'InstStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1 # Center
    )

    cert_head_style = ParagraphStyle(
        'CertHead',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4B5563'),
        alignment=1,
        textTransform='uppercase'
    )

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor('#0F172A'),
        alignment=1
    )

    presented_to = ParagraphStyle(
        'PresentedTo',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#6B7280'),
        alignment=1
    )

    student_style = ParagraphStyle(
        'StudentStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor('#1E40AF'),
        alignment=1
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=20,
        textColor=colors.HexColor('#374151'),
        alignment=1
    )

    footer_label = ParagraphStyle(
        'FooterLabel',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#6B7280'),
        alignment=1
    )

    footer_val = ParagraphStyle(
        'FooterVal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#111827'),
        alignment=1
    )

    elements = []
    elements.append(Paragraph(inst_name, inst_style))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("OFFICIAL CERTIFICATE OF ACHIEVEMENT", cert_head_style))
    elements.append(Spacer(1, 15))
    elements.append(Paragraph(f"This is proudly presented to", presented_to))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(student_name, student_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        f"for successfully completing the comprehensive curriculum in <b>{course_name}</b> and demonstrating high proficiency {grade}.",
        body_style
    ))
    elements.append(Spacer(1, 20))

    # Bottom layout: Signatory, QR Code, Verification Info
    # QR Code handling
    qr_img = None
    if certificate.qr_code and hasattr(certificate.qr_code, 'path'):
        try:
            qr_img = RLImage(certificate.qr_code.path, width=70, height=70)
        except Exception:
            qr_img = Paragraph("[QR CODE]", footer_val)
    else:
        qr_img = Paragraph("[QR CODE]", footer_val)

    col1 = [
        Paragraph("Authorized Signature", footer_label),
        Spacer(1, 15),
        Paragraph("_______________________", footer_val),
        Paragraph("Academic Registrar / Director", footer_label)
    ]

    col2 = [
        qr_img,
        Paragraph("Scan to Verify", footer_label)
    ]

    col3 = [
        Paragraph("Certificate ID", footer_label),
        Paragraph(cert_id, footer_val),
        Spacer(1, 4),
        Paragraph("Issue Date", footer_label),
        Paragraph(issue_date, footer_val)
    ]

    footer_data = [[col1, col2, col3]]
    footer_table = Table(footer_data, colWidths=[240, 140, 240])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))

    elements.append(footer_table)

    def draw_border(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#1E3A8A'))
        canvas.setLineWidth(4)
        canvas.rect(20, 20, 752, 572)

        canvas.setStrokeColor(colors.HexColor('#93C5FD'))
        canvas.setLineWidth(1.5)
        canvas.rect(26, 26, 740, 560)
        canvas.restoreState()

    doc.build(elements, onFirstPage=draw_border)
    buffer.seek(0)
    return buffer.getvalue()

