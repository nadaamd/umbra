"""
Rendu PDF du papier Umbra — consomme content.py (source unique).
Police DejaVuSerif (livrée avec matplotlib) pour une couverture Unicode complète
(lettres grecques τ θ α σ β, flèches, symboles math).
Sortie : paper/Umbra_CBRI_Paper.pdf
"""
import os
import matplotlib

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Image,
                                Table, TableStyle, KeepTogether)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

import content as C

OUT = os.path.join(C.HERE, "Umbra_CBRI_Paper.pdf")

# ── Polices Unicode (DejaVuSerif via matplotlib) ─────────────
FD = os.path.join(matplotlib.get_data_path(), "fonts", "ttf")
pdfmetrics.registerFont(TTFont("DJS", os.path.join(FD, "DejaVuSerif.ttf")))
pdfmetrics.registerFont(TTFont("DJS-B", os.path.join(FD, "DejaVuSerif-Bold.ttf")))
pdfmetrics.registerFont(TTFont("DJS-I", os.path.join(FD, "DejaVuSerif-Italic.ttf")))
pdfmetrics.registerFontFamily("DJS", normal="DJS", bold="DJS-B", italic="DJS-I", boldItalic="DJS-B")

INK = colors.HexColor("#141414")
ACCENT = colors.HexColor("#7A1F2B")
GREY = colors.HexColor("#555555")


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ── Styles ───────────────────────────────────────────────────
body = ParagraphStyle("body", fontName="DJS", fontSize=10, leading=14,
                      alignment=TA_JUSTIFY, spaceAfter=6, textColor=INK)
h1 = ParagraphStyle("h1", fontName="DJS-B", fontSize=13, leading=16,
                    spaceBefore=12, spaceAfter=4, textColor=INK)
h2 = ParagraphStyle("h2", fontName="DJS-B", fontSize=10.8, leading=14,
                    spaceBefore=8, spaceAfter=3, textColor=INK)
title_s = ParagraphStyle("title", fontName="DJS-B", fontSize=16.5, leading=20,
                         alignment=TA_CENTER, textColor=INK)
sub_s = ParagraphStyle("sub", fontName="DJS-I", fontSize=10.5, leading=13,
                       alignment=TA_CENTER, textColor=colors.HexColor("#333333"))
meta_s = ParagraphStyle("meta", fontName="DJS", fontSize=9, alignment=TA_CENTER, textColor=GREY)
abs_s = ParagraphStyle("abs", parent=body, fontSize=9.5, leading=13,
                       leftIndent=0.6 * cm, rightIndent=0.6 * cm, spaceAfter=10)
bullet_s = ParagraphStyle("bul", parent=body, leftIndent=0.55 * cm,
                          bulletIndent=0.15 * cm, spaceAfter=4)
cap_s = ParagraphStyle("cap", fontName="DJS-I", fontSize=8.5, leading=11,
                       alignment=TA_CENTER, textColor=GREY, spaceAfter=10)
call_s = ParagraphStyle("call", parent=body, fontSize=9.5, leading=13, spaceAfter=0)
foot_s = ParagraphStyle("foot", fontName="DJS", fontSize=8, alignment=TA_CENTER,
                        textColor=colors.HexColor("#888888"))
tcell = ParagraphStyle("tc", fontName="DJS", fontSize=8.5, leading=11)
thead = ParagraphStyle("th", fontName="DJS-B", fontSize=8.5, leading=11)

doc = SimpleDocTemplate(OUT, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm,
                        leftMargin=2 * cm, rightMargin=2 * cm,
                        title="Umbra — CBRI", author="Umbra Research")
AVAIL = doc.width
story = []


def img_flow(path, target_in):
    w, h = C.png_size(path)
    wpt = min(AVAIL, target_in * inch)
    im = Image(path, width=wpt, height=wpt * h / w)
    im.hAlign = "CENTER"
    return im


# ── En-tête ──────────────────────────────────────────────────
story.append(Paragraph(f"{esc(C.META['title1'])}<br/>{esc(C.META['title2'])}", title_s))
story.append(Spacer(1, 5))
story.append(Paragraph(esc(C.META["subtitle"]), sub_s))
story.append(Spacer(1, 3))
story.append(Paragraph(esc(C.META["meta"]), meta_s))
story.append(Spacer(1, 12))
story.append(Paragraph(f"<b>Abstract.</b> {esc(C.ABSTRACT)}", abs_s))

# ── Corps ────────────────────────────────────────────────────
for block in C.BLOCKS:
    kind = block[0]
    if kind == "h1":
        story.append(Paragraph(esc(block[1]), h1))
    elif kind == "h2":
        story.append(Paragraph(esc(block[1]), h2))
    elif kind == "body":
        story.append(Paragraph(esc(block[1]), body))
    elif kind == "eq":
        path = C.eq(block[1], block[2] if len(block) > 2 else 15)
        story.append(Spacer(1, 2))
        story.append(img_flow(path, 6.3))
        story.append(Spacer(1, 6))
    elif kind == "callout":
        para = Paragraph(
            f"<font color='#7A1F2B'><b>{esc(block[1])}</b></font> <i>{esc(block[2])}</i>",
            call_s)
        t = Table([[para]], colWidths=[AVAIL])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F1EC")),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LINEBEFORE", (0, 0), (0, -1), 2, ACCENT),
        ]))
        story.append(Spacer(1, 2))
        story.append(t)
        story.append(Spacer(1, 8))
    elif kind == "bullet":
        story.append(Paragraph(f"<b>{esc(block[1])}</b> {esc(block[2])}",
                               bullet_s, bulletText="•"))
    elif kind == "table":
        headers, rows, cap = block[1], block[2], block[3]
        n = len(headers)
        w0 = 0.32 * AVAIL
        rest = (AVAIL - w0) / (n - 1)
        widths = [w0] + [rest] * (n - 1)
        data = [[Paragraph(esc(x), thead) for x in headers]]
        data += [[Paragraph(esc(str(c)), tcell) for c in row] for row in rows]
        t = Table(data, colWidths=widths, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EDE9E1")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#C9C4BA")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(Spacer(1, 2))
        story.append(t)
        story.append(Spacer(1, 3))
        story.append(Paragraph(esc(cap), cap_s))
    elif kind == "figure":
        path = os.path.join(C.FIG_DIR, block[1])
        if os.path.exists(path):
            story.append(KeepTogether([img_flow(path, 6.3),
                                       Spacer(1, 3),
                                       Paragraph(esc(block[2]), cap_s)]))
    elif kind == "footer":
        story.append(Spacer(1, 14))
        story.append(Paragraph(esc(block[1]), foot_s))

doc.build(story)
print(f"✅ PDF généré : {OUT}")
