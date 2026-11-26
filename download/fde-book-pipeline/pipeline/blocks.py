"""blocks.py — renders the platform's content-block schema into Word.

Block kinds: p, ul, table, code, callout, math, steps, nl, frac, pct, ieq,
plot, exercise. Every renderer is deterministic and derives from the approved
payload only. Figures are produced by figures.py and inserted with captions.
"""
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from . import figures as F
from .styles import (NAVY, TEAL, AMBER, INK, MUTED, PAPER_TINT, HEAD_FONT,
                     BODY_FONT, MONO_FONT, styled_table, shade_cell,
                     set_cell_margins, keep_with_next)
from .code import tokens_for


class BlockRenderer:
    def __init__(self, doc):
        self.doc = doc
        self.figure_count = 0
        self.table_count = 0
        self.equation_count = 0
        self.code_count = 0

    # ---------- primitives ----------
    def para(self, text, style="FDE Body"):
        p = self.doc.add_paragraph(text, style=self.doc.styles[style])
        return p

    def _runs_with_math_spacing(self, p, text):
        # gentle typographic pass: keep the approved text verbatim, bold the
        # arithmetic lines that carry expressions
        r = p.add_run(text)
        return r

    def heading(self, text, level=2):
        p = self.doc.add_paragraph(style=self.doc.styles[f"FDE H{level}"])
        p.add_run(text)
        return p

    def caption(self, text):
        return self.doc.add_paragraph(text, style=self.doc.styles["FDE Caption"])

    def _figure(self, path, caption, width=13.6):
        if not path:
            return
        self.doc.add_picture(path, width=Cm(width))
        self.doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        self.doc.paragraphs[-1].paragraph_format.keep_with_next = True
        if caption:
            self.caption(caption)
        self.figure_count += 1

    def _boxed(self, paragraphs, fill=PAPER_TINT, edge="C9D2DC", label=None,
               label_color=TEAL):
        """A one-cell table used as a shaded callout/box (keeps together)."""
        t = self.doc.add_table(rows=1, cols=1)
        t.autofit = False
        cell = t.rows[0].cells[0]
        cell.width = Cm(16.2)
        shade_cell(cell, fill)
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        from .styles import table_borders
        table_borders(t, color=edge, size=6)
        if label:
            pl = cell.paragraphs[0]
            pl.style = self.doc.styles["FDE Meta"]
            pl.paragraph_format.space_after = Pt(2)
            rl = pl.add_run(label.upper())
            rl.font.size = Pt(7.8); rl.font.bold = True
            rl.font.name = HEAD_FONT
            rl.font.color.rgb = RGBColor.from_string(label_color)
            first = False
        else:
            first = True
        for text in paragraphs:
            p = cell.paragraphs[0] if first else cell.add_paragraph()
            first = False
            p.style = self.doc.styles["FDE ListItem"]
            p.paragraph_format.space_after = Pt(4)
            r = p.add_run(text)
            r.font.size = Pt(9.8)
        from .styles import cant_split_row
        cant_split_row(t.rows[0])
        self.doc.add_paragraph("", style=self.doc.styles["FDE Meta"])  # breathing room
        return t

    # ---------- block dispatch ----------
    def render(self, block):
        t = block.get("t")
        fn = getattr(self, f"block_{t}", None)
        if fn is None:
            self.para(str(block.get("x", "")))
            return
        fn(block)

    def block_p(self, b):
        self.para(b.get("x", ""))

    def block_ul(self, b):
        for item in b.get("items", []):
            p = self.doc.add_paragraph(style=self.doc.styles["FDE ListItem"])
            p.paragraph_format.left_indent = Cm(0.6)
            r = p.add_run("•  ")
            r.font.color.rgb = RGBColor.from_string(TEAL)
            p.add_run(str(item))

    def block_table(self, b):
        headers = b.get("headers") or ["", ""]
        rows = b.get("rows") or []
        self.table_count += 1
        keep_with_next(self.doc.add_paragraph("", style=self.doc.styles["FDE Meta"]))
        styled_table(self.doc, headers, rows)
        if b.get("caption"):
            self.caption(f"Table: {b['caption']}")

    def block_code(self, b):
        self.code_count += 1
        lang = b.get("lang", "javascript")
        body = b.get("body") or b.get("code") or ""
        t = self.doc.add_table(rows=1, cols=1)
        t.autofit = False
        cell = t.rows[0].cells[0]
        cell.width = Cm(16.2)
        shade_cell(cell, "F5F7FA")
        set_cell_margins(cell, top=130, bottom=130, left=170, right=170)
        from .styles import table_borders, cant_split_row
        table_borders(t, color="D7DEE6", size=4)
        lines = body.split("\n")
        first = True
        for line in lines:
            p = cell.paragraphs[0] if first else cell.add_paragraph()
            first = False
            p.style = self.doc.styles["FDE Code"]
            p.paragraph_format.space_after = Pt(0)
            for text, color in tokens_for(line, lang):
                r = p.add_run(text)
                r.font.name = MONO_FONT
                r.font.size = Pt(8.8)
                r.font.color.rgb = RGBColor.from_string(color)
        cant_split_row(t.rows[0])
        if b.get("caption"):
            self.caption(f"Listing ({lang}): {b['caption']}")
        self.doc.add_paragraph("", style=self.doc.styles["FDE Meta"])

    def block_callout(self, b):
        self._boxed([b.get("x", "")], fill="EEF6F4", edge="BFDCD6", label="Key idea", label_color=TEAL)

    def block_math(self, b):
        """Equation typography: centered, serif italic, with a hairline frame."""
        self.equation_count += 1
        expr = b.get("x", "")
        t = self.doc.add_table(rows=1, cols=1)
        t.autofit = False
        cell = t.rows[0].cells[0]
        cell.width = Cm(16.2)
        set_cell_margins(cell, top=120, bottom=120, left=170, right=170)
        from .styles import table_borders, cant_split_row
        table_borders(t, color="D7DEE6", size=4)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(expr)
        r.font.name = BODY_FONT
        r.font.size = Pt(11.5)
        r.font.italic = True
        r.font.color.rgb = RGBColor.from_string(NAVY)
        cant_split_row(t.rows[0])
        self.doc.add_paragraph("", style=self.doc.styles["FDE Meta"])

    def block_steps(self, b):
        title = b.get("title") or "Worked steps"
        self.heading(title, 3)
        for i, s in enumerate(b.get("steps", []), 1):
            p = self.doc.add_paragraph(style=self.doc.styles["FDE ListItem"])
            p.paragraph_format.left_indent = Cm(0.6)
            r = p.add_run(f"{i}.  ")
            r.font.bold = True; r.font.name = HEAD_FONT
            r.font.color.rgb = RGBColor.from_string(TEAL)
            re_ = p.add_run(s.get("expr", ""))
            re_.font.name = BODY_FONT
            re_.font.color.rgb = RGBColor.from_string(NAVY)
            re_.font.bold = True
            if s.get("note"):
                rn = p.add_run(f"   — {s['note']}")
                rn.font.color.rgb = RGBColor.from_string(MUTED)
                rn.font.italic = True

    def block_nl(self, b):
        self._figure(F.numberline_figure(b), b.get("label"), width=11.5)

    def block_frac(self, b):
        self._figure(F.fraction_figure(b), b.get("label"), width=8.2)

    def block_pct(self, b):
        self._figure(F.pct_figure(b), b.get("label"), width=11.5)

    def block_ieq(self, b):
        # the model equation, derived from the explorer's own slider values
        s = {x["key"]: float(x["val"]) for x in b.get("sliders", [])}
        if {"fc", "p", "c"} <= set(s):
            p_, c_, fc_ = s["p"], s["c"], s["fc"]
            be = fc_ / (p_ - c_) if p_ > c_ else None
            eq = (f"money in  =  {p_:g} × rolls        "
                  f"money out  =  {fc_:g} + {c_:g} × rolls"
                  + (f"        break-even:  rolls  =  {be:g}" if be is not None else ""))
            self.block_math({"t": "math", "x": eq})
        self._figure(F.breakeven_figure(b), b.get("caption"), width=13.4)

    def block_plot(self, b):
        path = F.plot_figure(b)
        if path:
            self._figure(path, b.get("caption"), width=13.4)
        else:
            self.caption(b.get("caption", ""))

    def block_exercise(self, b):
        # rendered by the chapter frame (examples/exercises sections)
        pass

    def render_concept_figure(self, title, objectives, key_terms):
        self._figure(F.concept_figure(title, objectives, key_terms),
                     f"Concept map — {title}", width=14.2)
