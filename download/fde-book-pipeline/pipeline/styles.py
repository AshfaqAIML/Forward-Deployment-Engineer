"""styles.py — the reusable document design system for FDE Academy print
editions: A4 geometry, typography, named Word styles, table design, and the
shared palette. Every builder imports from here so all books look identical.
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ---- brand palette (matches the platform) ----
NAVY = "1E3A5F"
TEAL = "2E7D74"
AMBER = "B45309"
INK = "1F2430"
MUTED = "5B6472"
PAPER_TINT = "F4F6F8"
RULE = "C9D2DC"

# ---- typography (fonts present in the sandbox AND metric-safe in Word) ----
BODY_FONT = "Liberation Serif"      # Times-metric; Word maps to Times New Roman
HEAD_FONT = "Liberation Sans"       # Arial-metric; Word maps to Arial
MONO_FONT = "Liberation Mono"       # Courier-metric

BODY_SIZE = Pt(10.5)
H1_SIZE = Pt(19)
H2_SIZE = Pt(13.5)
H3_SIZE = Pt(11.5)
SMALL_SIZE = Pt(8.8)

A4_W, A4_H = Cm(21.0), Cm(29.7)
MARGIN = dict(top=Cm(2.3), bottom=Cm(2.2), left=Cm(2.4), right=Cm(2.4))


def _shade(cell_or_par, hex_fill):
    """Apply solid background shading to a table cell or paragraph."""
    el = cell_or_par._tc if hasattr(cell_or_par, "_tc") else cell_or_par._p
    pr = el.get_or_add_tcPr() if hasattr(el, "get_or_add_tcPr") else el.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hex_fill)
    pr.append(shd)


def shade_cell(cell, hex_fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hex_fill)
    tcPr.append(shd)


def set_cell_margins(cell, top=60, bottom=60, left=110, right=110):
    tcPr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for tag, val in (("top", top), ("bottom", bottom), ("start", left), ("end", right)):
        el = OxmlElement(f"w:{tag}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tcPr.append(mar)


def cant_split_row(row):
    trPr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:cantSplit")
    trPr.append(el)


def table_borders(table, color=RULE, size=4):
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(size))
        el.set(qn("w:color"), color)
        borders.append(el)
    tblPr.append(borders)


def keep_with_next(par, on=True):
    par.paragraph_format.keep_with_next = on


def add_page_break_before(par):
    par.paragraph_format.page_break_before = True


def restart_page_numbering(section, start=1):
    sectPr = section._sectPr
    pg = OxmlElement("w:pgNumType")
    pg.set(qn("w:start"), str(start))
    sectPr.append(pg)


def field_run(paragraph, instr, size=SMALL_SIZE, color=MUTED):
    """Insert a Word field (e.g. PAGE) into a paragraph."""
    run = paragraph.add_run()
    b = OxmlElement("w:fldChar"); b.set(qn("w:fldCharType"), "begin")
    run._r.append(b)
    run2 = paragraph.add_run()
    it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = instr
    run2._r.append(it)
    run3 = paragraph.add_run()
    e = OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"), "end")
    run3._r.append(e)
    for r in (run, run2, run3):
        r.font.size = size
        r.font.color.rgb = RGBColor.from_string(color)
        r.font.name = HEAD_FONT
    return run3


def setup_document():
    """A fresh Document with the FDE Academy named styles + A4 geometry."""
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = A4_W, A4_H
    for k, v in MARGIN.items():
        setattr(sec, f"{k}_margin", v)

    st = doc.styles["Normal"]
    st.font.name = BODY_FONT
    st.font.size = BODY_SIZE
    st.font.color.rgb = RGBColor.from_string(INK)
    st.paragraph_format.space_after = Pt(6)
    st.paragraph_format.line_spacing = 1.22
    st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    # East-Asian font fallback guard
    st.element.rPr.rFonts.set(qn("w:eastAsia"), BODY_FONT)

    def _style(name, base="Normal", font=HEAD_FONT, size=BODY_SIZE, bold=False,
               italic=False, color=INK, before=0, after=6, keep=False,
               align=None, spacing=None):
        s = doc.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH) if name not in doc.styles else doc.styles[name]
        s.base_style = doc.styles[base]
        s.font.name = font
        s.font.size = size
        s.font.bold = bold
        s.font.italic = italic
        s.font.color.rgb = RGBColor.from_string(color)
        s.paragraph_format.space_before = Pt(before)
        s.paragraph_format.space_after = Pt(after)
        s.paragraph_format.keep_with_next = keep
        if align is not None:
            s.paragraph_format.alignment = align
        if spacing:
            s.paragraph_format.line_spacing = spacing
        return s

    _style("FDE H1", size=H1_SIZE, bold=True, color=NAVY, before=0, after=10, keep=True, spacing=1.05)
    _style("FDE H2", size=H2_SIZE, bold=True, color=NAVY, before=14, after=6, keep=True)
    _style("FDE H3", size=H3_SIZE, bold=True, color=TEAL, before=10, after=4, keep=True)
    _style("FDE Body")                                   # inherits Normal
    _style("FDE Caption", size=SMALL_SIZE, italic=True, color=MUTED,
           align=WD_ALIGN_PARAGRAPH.CENTER, after=10)
    _style("FDE Code", font=MONO_FONT, size=Pt(9.2), color=INK,
           align=WD_ALIGN_PARAGRAPH.LEFT, spacing=1.12, after=0)
    _style("FDE ListItem", size=BODY_SIZE, align=WD_ALIGN_PARAGRAPH.LEFT, after=3)
    _style("FDE TOC1", font=HEAD_FONT, size=Pt(10.5), bold=True, color=NAVY,
           align=WD_ALIGN_PARAGRAPH.LEFT, after=4)
    _style("FDE TOC2", font=HEAD_FONT, size=Pt(9.8), color=INK,
           align=WD_ALIGN_PARAGRAPH.LEFT, after=3)
    _style("FDE Meta", size=SMALL_SIZE, color=MUTED, align=WD_ALIGN_PARAGRAPH.LEFT, after=2)
    _style("FDE FrontTitle", font=HEAD_FONT, size=Pt(26), bold=True, color=NAVY,
           align=WD_ALIGN_PARAGRAPH.LEFT, after=8)
    return doc


def styled_table(doc, headers, rows, widths=None, header_fill=NAVY):
    """A consistent, professional table: navy header, zebra rows, no splits."""
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table_borders(table)
    total = 16.2  # cm usable width
    widths = widths or [total / len(headers)] * len(headers)
    for j, h in enumerate(headers):
        cell = table.rows[0].cells[j]
        cell.width = Cm(widths[j])
        shade_cell(cell, header_fill)
        set_cell_margins(cell)
        p = cell.paragraphs[0]
        p.style = doc.styles["FDE ListItem"]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.bold = True
        r.font.size = Pt(9.3)
        r.font.name = HEAD_FONT
        r.font.color.rgb = RGBColor.from_string("FFFFFF")
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            cell = table.rows[i + 1].cells[j]
            cell.width = Cm(widths[j])
            set_cell_margins(cell)
            if i % 2 == 1:
                shade_cell(cell, PAPER_TINT)
            p = cell.paragraphs[0]
            p.style = doc.styles["FDE ListItem"]
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(str(val))
            r.font.size = Pt(9.3)
            r.font.name = BODY_FONT
        cant_split_row(table.rows[i + 1])
    cant_split_row(table.rows[0])
    return table
