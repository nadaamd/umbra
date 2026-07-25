"""
Rendu Word (.docx) du papier Umbra — consomme content.py (source unique).
Sortie : paper/Umbra_CBRI_Paper.docx
"""
import os

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

import content as C

OUT = os.path.join(C.HERE, "Umbra_CBRI_Paper.docx")
INK = RGBColor(0x14, 0x14, 0x14)
ACCENT = RGBColor(0x7A, 0x1F, 0x2B)


def png_w_in(path):
    w, _ = C.png_size(path)
    return w / C.EQ_DPI


def shade(p, fill="F3F1EC"):
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), fill)
    pPr.append(shd)


doc = Document()
for s in doc.sections:
    s.top_margin = s.bottom_margin = Inches(0.9)
    s.left_margin = s.right_margin = Inches(1.0)

normal = doc.styles["Normal"]
normal.font.name = "Georgia"
normal.font.size = Pt(10.5)
normal.paragraph_format.line_spacing = 1.12
for hs in ("Title", "Heading 1", "Heading 2", "Heading 3"):
    st = doc.styles[hs]
    st.font.name = "Georgia"
    st.font.color.rgb = INK


def add_eq(latex, size=15):
    path = C.eq(latex, size)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    p.add_run().add_picture(path, width=Inches(min(6.3, png_w_in(path))))


def add_caption(text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(text)
    r.italic = True
    r.font.size = Pt(9)
    r.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
    p.paragraph_format.space_after = Pt(10)


# ── En-tête ──────────────────────────────────────────────────
title = doc.add_paragraph()
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
for i, line in enumerate((C.META["title1"], C.META["title2"])):
    r = title.add_run(line)
    r.bold = True
    r.font.size = Pt(19)
    r.font.name = "Georgia"
    if i == 0:
        r.add_break()

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
rs = sub.add_run(C.META["subtitle"])
rs.italic = True
rs.font.size = Pt(11)

meta = doc.add_paragraph()
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
rm = meta.add_run(C.META["meta"])
rm.font.size = Pt(9.5)
rm.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

doc.add_paragraph()

ab = doc.add_paragraph()
ab.add_run("Abstract. ").bold = True
ab.add_run(C.ABSTRACT)
ab.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
ab.paragraph_format.left_indent = Inches(0.3)
ab.paragraph_format.right_indent = Inches(0.3)
ab.paragraph_format.space_after = Pt(10)

# ── Corps ────────────────────────────────────────────────────
for block in C.BLOCKS:
    kind = block[0]
    if kind == "h1":
        h = doc.add_heading(block[1], level=1)
        h.paragraph_format.space_before = Pt(12)
    elif kind == "h2":
        h = doc.add_heading(block[1], level=2)
        h.paragraph_format.space_before = Pt(8)
    elif kind == "body":
        p = doc.add_paragraph(block[1])
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(6)
    elif kind == "eq":
        add_eq(block[1], block[2] if len(block) > 2 else 15)
    elif kind == "callout":
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.18)
        p.paragraph_format.right_indent = Inches(0.18)
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(f"{block[1]} ")
        r.bold = True
        r.font.color.rgb = ACCENT
        p.add_run(block[2]).italic = True
        shade(p)
    elif kind == "bullet":
        p = doc.add_paragraph(style="List Bullet")
        p.add_run(block[1]).bold = True
        p.add_run(" " + block[2])
    elif kind == "table":
        headers, rows, cap = block[1], block[2], block[3]
        t = doc.add_table(rows=1, cols=len(headers))
        t.style = "Light Grid Accent 1"
        for i, hh in enumerate(headers):
            cell = t.rows[0].cells[i]
            cell.text = ""
            rr = cell.paragraphs[0].add_run(hh)
            rr.bold = True
            rr.font.size = Pt(9.5)
        for row in rows:
            cells = t.add_row().cells
            for i, val in enumerate(row):
                cells[i].text = ""
                rr = cells[i].paragraphs[0].add_run(str(val))
                rr.font.size = Pt(9.5)
        doc.add_paragraph().paragraph_format.space_after = Pt(2)
        add_caption(cap)
    elif kind == "figure":
        path = os.path.join(C.FIG_DIR, block[1])
        if os.path.exists(path):
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.add_run().add_picture(path, width=Inches(6.2))
            add_caption(block[2])
    elif kind == "footer":
        doc.add_paragraph()
        f = doc.add_paragraph()
        f.alignment = WD_ALIGN_PARAGRAPH.CENTER
        rf = f.add_run(block[1])
        rf.font.size = Pt(8.5)
        rf.font.color.rgb = RGBColor(0x88, 0x88, 0x88)

doc.save(OUT)
print(f"✅ Word généré : {OUT}")
