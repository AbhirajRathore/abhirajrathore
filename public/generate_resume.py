from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

doc = Document()

# ── Page margins ────────────────────────────────────────────────────────────
for section in doc.sections:
    section.top_margin    = Inches(0.4)
    section.bottom_margin = Inches(0.4)
    section.left_margin   = Inches(0.5)
    section.right_margin  = Inches(0.5)

# ── Helper: zero paragraph spacing ──────────────────────────────────────────
def tight(para, space_before=0, space_after=0):
    para.paragraph_format.space_before = Pt(space_before)
    para.paragraph_format.space_after  = Pt(space_after)
    para.paragraph_format.line_spacing = Pt(11)

# ── Helper: add a horizontal rule below a paragraph ─────────────────────────
def add_bottom_border(para):
    pPr = para._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'),   'single')
    bottom.set(qn('w:sz'),    '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), '000000')
    pBdr.append(bottom)
    pPr.append(pBdr)

# ── Helper: section heading ──────────────────────────────────────────────────
def add_section_heading(doc, title):
    p = doc.add_paragraph()
    tight(p, space_before=5, space_after=2)
    run = p.add_run(title.upper())
    run.bold = True
    run.font.size = Pt(9.5)
    add_bottom_border(p)
    return p

# ── Helper: bold + normal inline run ────────────────────────────────────────
def add_mixed_run(para, parts):
    """parts = list of (text, bold) tuples"""
    for text, bold in parts:
        r = para.add_run(text)
        r.bold = bold
        r.font.size = Pt(9)

# ── Helper: bullet item with optional bold segments ──────────────────────────
def add_bullet(doc, parts):
    p = doc.add_paragraph(style='List Bullet')
    tight(p, space_before=0, space_after=0)
    p.paragraph_format.left_indent  = Inches(0.18)
    p.paragraph_format.first_line_indent = Inches(-0.18)
    for text, bold in parts:
        r = p.add_run(text)
        r.bold = bold
        r.font.size = Pt(9)
    return p

# ── Helper: job/project title line with right-aligned date ───────────────────
def add_title_date(doc, title_parts, date_str=None):
    p = doc.add_paragraph()
    tight(p, space_before=3, space_after=0)
    for text, bold in title_parts:
        r = p.add_run(text)
        r.bold = bold
        r.font.size = Pt(9)
    if date_str:
        # tab + right-align date via a right-aligned tab stop
        tab = p.add_run('\t' + date_str)
        tab.font.size = Pt(9)
        from docx.oxml import OxmlElement
        from docx.oxml.ns import qn
        pPr = p._p.get_or_add_pPr()
        tabs = OxmlElement('w:tabs')
        tab_el = OxmlElement('w:tab')
        tab_el.set(qn('w:val'), 'right')
        # right edge ≈ page width minus margins = 8.27 - 1.0 = 7.27 in → twips
        tab_el.set(qn('w:pos'), str(int(7.27 * 1440)))
        tabs.append(tab_el)
        pPr.append(tabs)
    return p

# ── Helper: sub-line (company / university) ──────────────────────────────────
def add_subline(doc, text):
    p = doc.add_paragraph(text)
    tight(p, space_before=0, space_after=1)
    for run in p.runs:
        run.font.size = Pt(9)
    return p


# ════════════════════════════════════════════════════════════════════════════
#  HEADER
# ════════════════════════════════════════════════════════════════════════════
name_p = doc.add_paragraph()
tight(name_p, space_before=0, space_after=1)
name_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
name_run = name_p.add_run('Abhiraj Singh Rathore')
name_run.bold = True
name_run.font.size = Pt(14)

title_p = doc.add_paragraph()
tight(title_p, space_after=1)
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
tr = title_p.add_run('Software Engineer II  |  Dubai, UAE')
tr.font.size = Pt(9)

contact_p = doc.add_paragraph()
tight(contact_p, space_after=4)
contact_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
cr = contact_p.add_run('abhiraj.rathoree@gmail.com  |  +91 9314225845  |  +971 521750314  |  linkedin.com/in/abhirajrathoree')
cr.font.size = Pt(9)


# ════════════════════════════════════════════════════════════════════════════
#  SUMMARY
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, 'Summary')
p = doc.add_paragraph()
tight(p, space_after=2)
add_mixed_run(p, [
    ('Software Engineer II with 4+ years of experience building ', False),
    ('distributed systems, real-time data pipelines, and AI infrastructure', True),
    ('. Proven ability to design ', False),
    ('high-throughput backend systems', True),
    (', optimize latency by ', False),
    ('10×+', True),
    (', and develop ', False),
    ('fault-tolerant architectures', True),
    (' using Kafka, PostgreSQL, and GPU-based pipelines.', False),
])


# ════════════════════════════════════════════════════════════════════════════
#  TECHNICAL SKILLS
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, 'Technical Skills')

skills = [
    ('Languages:',    'Node.js, TypeScript, C#, Python, React, Next.js'),
    ('Systems:',      'Kafka, Distributed Systems, Microservices, Event-Driven Architecture'),
    ('Databases:',    'PostgreSQL, MSSQL, MongoDB, Redis, PL/SQL'),
    ('Cloud/DevOps:', 'AWS, Azure, Docker, CI/CD'),
    ('Other:',        'REST APIs, GraphQL, Prometheus, Grafana'),
]
for label, value in skills:
    p = doc.add_paragraph()
    tight(p, space_before=0, space_after=0)
    r1 = p.add_run(label + ' ')
    r1.bold = True
    r1.font.size = Pt(9)
    r2 = p.add_run(value)
    r2.font.size = Pt(9)


# ════════════════════════════════════════════════════════════════════════════
#  EXPERIENCE
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, 'Experience')

# Software Engineer II
add_title_date(doc, [('Software Engineer II', True)], 'Dec 2023 – Present')
add_subline(doc, 'KGK Diamonds DMCC, Dubai')

bullets_swe2 = [
    [('Reduced API latency from ', False), ('51s to 5s (10× improvement)', True), (' through query optimization, caching, and parallel processing.', False)],
    [('Designed a ', False), ('Kafka-based distributed system', True), (' for real-time inventory synchronization across ERP, CRM, and e-commerce platforms spanning multiple regions.', False)],
    [('Built a ', False), ('high-concurrency bidding platform', True), (' supporting transactions for ', False), ('$50M+ inventory per event', True), ('.', False)],
    [('Developed real-time financial pipelines processing ', False), ('$300M+ receivables', True), (', eliminating manual workflows.', False)],
    [('Implemented ', False), ('PostgreSQL SKIP LOCKED', True), (' for distributed job processing, ensuring safe concurrency.', False)],
    [('Improved observability using ', False), ('Prometheus and Grafana', True), (', reducing incident detection time by ', False), ('40%', True), ('.', False)],
]
for b in bullets_swe2:
    add_bullet(doc, b)

# AI Infrastructure
add_title_date(doc, [('AI Infrastructure & Systems', True)])
bullets_ai = [
    [('Designed a ', False), ('GPU-based inference pipeline', True), (' achieving ', False), ('95% utilization', True), (' using batching and async processing.', False)],
    [('Built a ', False), ('model orchestration system', True), (' across VGG, ViT, and VOLO architectures.', False)],
    [('Implemented ', False), ('zero-downtime deployment', True), (' with shadow testing and fallback mechanisms.', False)],
    [('Managed ', False), ('multi-GPU infrastructure', True), (' with resource control and real-time telemetry.', False)],
]
for b in bullets_ai:
    add_bullet(doc, b)

# Associate Software Engineer
add_title_date(doc, [('Associate Software Engineer', True)], 'Jun 2023 – Dec 2023')
add_subline(doc, 'Sigma Infosolutions, Ahmedabad')
bullets_ase = [
    [('Developed ', False), ('multi-tenant microservices', True), (' using Node.js, C#, and MongoDB.', False)],
    [('Reduced build times by ', False), ('50%', True), (' through optimized architecture.', False)],
    [('Built reusable UI systems improving frontend productivity by ', False), ('2×', True), ('.', False)],
]
for b in bullets_ase:
    add_bullet(doc, b)

# Full Stack Developer
add_title_date(doc, [('Full Stack Developer', True)], 'May 2022 – May 2023')
add_subline(doc, 'Blokminers.io')
bullets_fsd = [
    [('Built NFT marketplace and ticketing platforms using React, Node.js, and MongoDB.', False)],
    [('Enabled secure and scalable digital asset transactions.', False)],
]
for b in bullets_fsd:
    add_bullet(doc, b)


# ════════════════════════════════════════════════════════════════════════════
#  PROJECTS
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, 'Projects')

projects = [
    (
        'Real-Time Inventory Synchronization System',
        [
            [('Built a ', False), ('Kafka-based event-driven system', True), (' integrating ERP, CRM, and e-commerce platforms.', False)],
            [('Implemented retry handling, idempotency, and fault-tolerant pipelines.', False)],
        ]
    ),
    (
        'AI-Powered Diamond Grading Platform',
        [
            [('Developed a ', False), ('distributed GPU inference system', True), (' for high-throughput image processing.', False)],
            [('Designed intelligent model routing and production-grade deployment strategies.', False)],
        ]
    ),
    (
        'Data Warehouse & Reporting Pipeline',
        [
            [('Built real-time reporting pipelines integrating Zoho CRM and ERP systems.', False)],
            [('Automated financial reporting for ', False), ('$300M+ datasets', True), ('.', False)],
        ]
    ),
]
for proj_title, proj_bullets in projects:
    add_title_date(doc, [(proj_title, True)])
    for b in proj_bullets:
        add_bullet(doc, b)


# ════════════════════════════════════════════════════════════════════════════
#  EDUCATION
# ════════════════════════════════════════════════════════════════════════════
add_section_heading(doc, 'Education')

add_title_date(doc, [('M.Tech, AI & Data Science', True)], '2026')
add_subline(doc, 'IIT Patna')

add_title_date(doc, [('B.Tech, Electronics & Computer Science', True)], '2023')
add_subline(doc, 'MBM Engineering College')


# ── Save ─────────────────────────────────────────────────────────────────────
out = '/Users/abhi/abhirajrathoregithub/abhirajrathore/public/resume.docx'
doc.save(out)
print(f'Saved → {out}')
