import json
import os
import sys
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image


def load_font(branding):
    font_path = None
    if isinstance(branding, dict):
        font_path = branding.get('font_path')
    if font_path and os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont('BrandFont', font_path))
            return 'BrandFont'
        except Exception:
            return 'Helvetica'
    return 'Helvetica'


def safe_text(value):
    if value is None:
        return ''
    return str(value)


def build_header(branding, styles):
    elements = []
    header_text = branding.get('header_text') if isinstance(branding, dict) else None
    logo_path = branding.get('logo_path') if isinstance(branding, dict) else None
    primary_color = branding.get('primary_color', '#2f8f83') if isinstance(branding, dict) else '#2f8f83'

    row = []
    if logo_path and os.path.exists(logo_path):
        row.append(Image(logo_path, width=40 * mm, height=18 * mm))
    else:
        row.append(Paragraph('Fund Manager', styles['Title']))

    if header_text:
        row.append(Paragraph(header_text, styles['Heading2']))
    else:
        row.append(Paragraph('KYC Submission Summary', styles['Heading2']))

    table = Table([row], colWidths=[60 * mm, 120 * mm])
    table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor(primary_color)),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 8))
    return elements


def build_metadata(data, styles):
    elements = []
    meta_rows = [
        ['Investor', safe_text(data.get('investor_name'))],
        ['Submission ID', safe_text(data.get('submission_id'))],
        ['Template', safe_text(data.get('template_name'))],
        ['Generated', safe_text(data.get('generated_at'))],
    ]
    table = Table(meta_rows, colWidths=[40 * mm, 140 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F6F3EF')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0F172A')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#E2D6C6')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#D7CFC3')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 12))
    return elements


def build_sections(schema, submission_data, styles, language='en', branding=None):
    elements = []
    primary_color = branding.get('primary_color', '#2f8f83') if isinstance(branding, dict) else '#2f8f83'
    for section in schema.get('sections', []):
        title = section.get('title', {})
        section_title = title.get(language) if isinstance(title, dict) else title
        elements.append(Paragraph(safe_text(section_title), styles['Heading3']))
        elements.append(Spacer(1, 4))

        rows = [['Field', 'Value']]
        for field in section.get('fields', []):
            key = field.get('key') or field.get('id')
            label = field.get('label', {})
            label_text = label.get(language) if isinstance(label, dict) else label
            value = submission_data.get(key)
            if isinstance(value, list):
                value = ', '.join([safe_text(item) for item in value])
            rows.append([safe_text(label_text), safe_text(value) or '-'])

        table = Table(rows, colWidths=[70 * mm, 110 * mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(primary_color)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#0F172A')),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#E2D6C6')),
            ('FONTNAME', (0, 0), (-1, -1), styles['BodyText'].fontName),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 10))
    return elements


def build_signatures(branding, styles):
    elements = []
    signatures = []
    if isinstance(branding, dict):
        signatures = branding.get('signatures', []) or []

    if not signatures:
        signatures = [
            {'label': 'GP Approval', 'name': '____________________'},
            {'label': 'Compliance', 'name': '____________________'},
        ]

    rows = [[sig.get('label', ''), sig.get('name', '')] for sig in signatures]
    table = Table(rows, colWidths=[80 * mm, 100 * mm])
    table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.5, colors.HexColor('#D7CFC3')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0F172A')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(Spacer(1, 8))
    elements.append(table)
    return elements


def main():
    if len(sys.argv) < 3:
        print('Usage: render_pdf.py input.json output.pdf', file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    with open(input_path, 'r', encoding='utf-8') as handle:
        payload = json.load(handle)

    branding = payload.get('branding', {}) or {}
    font_name = load_font(branding)

    styles = getSampleStyleSheet()
    styles['Title'].fontName = font_name
    styles['Heading2'].fontName = font_name
    styles['Heading3'].fontName = font_name
    styles['BodyText'].fontName = font_name
    styles.add(ParagraphStyle(name='Small', parent=styles['BodyText'], fontSize=9))

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    elements = []
    elements.extend(build_header(branding, styles))
    elements.extend(build_metadata(payload, styles))

    schema = payload.get('schema', {}) or {}
    data = payload.get('data', {}) or {}
    language = payload.get('language', 'en')
    elements.extend(build_sections(schema, data, styles, language=language, branding=branding))

    footer_text = branding.get('footer_text') if isinstance(branding, dict) else None
    if footer_text:
        elements.append(Paragraph(footer_text, styles['Small']))
    elements.extend(build_signatures(branding, styles))

    doc.build(elements)


if __name__ == '__main__':
    main()
