"""figures.py — Matplotlib diagram builders for the print editions.

Every figure is generated from APPROVED content data (the block payloads) —
nothing is invented. Figures are cached under work/figures and referenced by
the DOCX builder. A4-consistent palette, 200 dpi, no tight_layout conflicts.
"""
import hashlib
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm
fm.fontManager.addfont("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

NAVY = "#1E3A5F"
TEAL = "#2E7D74"
AMBER = "#B45309"
MUTED = "#5B6472"
INK = "#1F2430"
PAPER = "#F4F6F8"
RULE = "#C9D2DC"

FIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "work", "figures")
os.makedirs(FIG_DIR, exist_ok=True)


def _save(fig, name):
    path = os.path.join(FIG_DIR, f"{name}.png")
    fig.savefig(path, dpi=200, facecolor="white")
    plt.close(fig)
    return path


def _key(*parts):
    return hashlib.sha256("|".join(str(p) for p in parts).encode()).hexdigest()[:12]


# ---------------- fraction diagram ----------------
def fraction_figure(block):
    n, d, label = block["n"], block["d"], block.get("label", "")
    fig, ax = plt.subplots(figsize=(4.4, 3.1), constrained_layout=True)
    ax.set_aspect("equal"); ax.axis("off")
    ax.add_patch(plt.Circle((0, 0), 1.0, fill=False, lw=2.4, edgecolor=NAVY))
    for k in range(d):
        a0 = 2 * np.pi * k / d
        ax.plot([0, np.cos(a0), ], [0, np.sin(a0)], color=NAVY, lw=1.6) if d > 1 else None
        a1 = 2 * np.pi * (k + 1) / d
        mid = 2 * np.pi * (k + 0.5) / d
        if k < n:
            ax.fill_between(np.linspace(0, 1, 40) * 0 + np.linspace(a0, a1, 40),
                            [0] * 40, [1] * 40, alpha=0)
        theta = np.linspace(a0, a1, 60)
        ax.fill(np.cos(theta), np.sin(theta), color=TEAL if k < n else "white",
                alpha=0.9 if k < n else 1.0, edgecolor=NAVY, lw=1.4)
    ax.set_xlim(-1.25, 1.25); ax.set_ylim(-1.2, 1.2)
    if label:
        ax.set_title(f"{label}  —  {n}/{d}", fontsize=10.5, color=NAVY, pad=8)
    return _save(fig, f"frac-{_key(n, d, label)}")


# ---------------- number line ----------------
def numberline_figure(block):
    lo, hi, val = float(block["min"]), float(block["max"]), float(block["value"])
    step = float(block.get("step", (hi - lo) / 10))
    fig, ax = plt.subplots(figsize=(5.6, 1.7), constrained_layout=True)
    ticks = np.arange(lo, hi + step / 2, step)
    ax.axhline(0, color=NAVY, lw=2)
    for t in ticks:
        ax.plot([t, t], [-0.12, 0.12], color=NAVY, lw=1.2)
        ax.text(t, -0.34, f"{t:g}", ha="center", fontsize=8.4, color=MUTED)
    ax.plot([val], [0], "o", ms=9, color=AMBER, zorder=5)
    ax.annotate(str(block.get("value")), (val, 0), xytext=(val, 0.42),
                ha="center", fontsize=9.5, color=AMBER, fontweight="bold")
    ax.set_xlim(lo - (hi - lo) * 0.08, hi + (hi - lo) * 0.08)
    ax.set_ylim(-0.6, 0.75); ax.axis("off")
    if block.get("label"):
        ax.set_title(block["label"], fontsize=10, color=NAVY, pad=2)
    return _save(fig, f"nl-{_key(lo, hi, step, val)}")


# ---------------- percentage bar ----------------
def pct_figure(block):
    pct, of, label = float(block["pct"]), float(block["of"]), block.get("label", "")
    part = round(of * pct / 100)
    fig, ax = plt.subplots(figsize=(5.6, 1.9), constrained_layout=True)
    ax.barh([0], [of], color=PAPER, edgecolor=RULE, height=0.42)
    ax.barh([0], [part], color=TEAL, height=0.42)
    ax.text(of * 0.012, 0, f" {pct:g}% of {of:g} = {part:g}", va="center",
            fontsize=9.6, color="white" if pct >= 25 else NAVY, fontweight="bold")
    ax.set_xlim(0, of * 1.02); ax.set_ylim(-0.55, 0.62)
    ax.axis("off")
    if label:
        ax.set_title(label, fontsize=10, color=NAVY, pad=2)
    return _save(fig, f"pct-{_key(pct, of, label)}")


# ---------------- break-even (inequality/equation explorer) ----------------
def breakeven_figure(block):
    s = {x["key"]: float(x["val"]) for x in block.get("sliders", [])}
    fc = s.get("fc", 20.0); p = s.get("p", 4.0); c = s.get("c", 1.5)
    xmax = max(20, int(fc / max(p - c, 0.1) * 1.8))
    xs = np.linspace(0, xmax, 100)
    cost = fc + c * xs; revenue = p * xs
    be = fc / (p - c) if p > c else None
    fig, ax = plt.subplots(figsize=(6.0, 3.4), constrained_layout=True)
    ax.plot(xs, revenue, color=TEAL, lw=2.2, label=f"Money in: {p:g} × rolls")
    ax.plot(xs, cost, color=AMBER, lw=2.2, label=f"Money out: {fc:g} + {c:g} × rolls")
    if be is not None:
        ax.plot([be], [p * be], "o", ms=9, color=NAVY, zorder=5)
        ax.annotate(f"break-even at {be:g} rolls", (be, p * be), xytext=(be + xmax * 0.05, p * be),
                    fontsize=9.4, color=NAVY, fontweight="bold",
                    arrowprops=dict(arrowstyle="-", color=RULE))
        ax.fill_between(xs, revenue, cost, where=revenue >= cost, color=TEAL, alpha=0.10)
        ax.fill_between(xs, revenue, cost, where=revenue < cost, color=AMBER, alpha=0.10)
    ax.set_xlabel("rolls sold", fontsize=9.5, color=MUTED)
    ax.set_ylabel("GBP", fontsize=9.5, color=MUTED)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", color=RULE, lw=0.6, alpha=0.6)
    ax.legend(loc="upper left", fontsize=8.8, frameon=False)
    ax.tick_params(labelsize=8.4, colors=MUTED)
    if block.get("caption"):
        ax.set_title(block["caption"].split("—")[0].strip(), fontsize=10.2, color=NAVY, pad=6)
    return _save(fig, f"ieq-{_key(fc, p, c)}")


# ---------------- function plot (parsed from the caption: y = a x + b) ----------------
def plot_figure(block):
    import re
    cap = block.get("caption", "")
    m = re.search(r"y\s*=\s*([+-]?[\d.]+)\s*\*?\s*x\s*([+-]\s*[\d.]+)?", cap.replace("−", "-"))
    if not m:
        return None
    a = float(m.group(1)); b = float((m.group(2) or "0").replace(" ", ""))
    xmin = float(block.get("xmin", 0)); xmax = float(block.get("xmax", 20))
    xs = np.linspace(xmin, xmax, 100)
    ys = a * xs + b
    fig, ax = plt.subplots(figsize=(6.0, 3.4), constrained_layout=True)
    ax.plot(xs, ys, color=TEAL, lw=2.4)
    ax.axhline(0, color=NAVY, lw=1.4); ax.axvline(0, color=NAVY, lw=1.4)
    for mk in block.get("marks", []):
        ax.plot([mk["x"]], [mk["y"]], "o", ms=9, color=mk.get("color", AMBER), zorder=5)
        if mk.get("label"):
            ax.annotate(mk["label"], (mk["x"], mk["y"]), xytext=(mk["x"] + xmax * 0.04, mk["y"]),
                        fontsize=9.4, color=NAVY, fontweight="bold")
    ax.set_xlabel("x", fontsize=9.5, color=MUTED); ax.set_ylabel("y", fontsize=9.5, color=MUTED)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(color=RULE, lw=0.6, alpha=0.6)
    ax.tick_params(labelsize=8.4, colors=MUTED)
    ax.set_title(cap.split("—")[0].strip(), fontsize=10.2, color=NAVY, pad=6)
    return _save(fig, f"plot-{_key(cap, a, b, xmin, xmax)}")


# ---------------- chapter concept map (used when a chapter has no data figure) ----------------
def concept_figure(chapter_title, objectives, key_terms):
    import textwrap
    fig, ax = plt.subplots(figsize=(6.6, 3.3), constrained_layout=True)
    ax.axis("off"); ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    items = list(dict.fromkeys(objectives))[:4] or list(dict.fromkeys(key_terms))[:4]
    # center node
    wrapped_title = "\n".join(textwrap.wrap(chapter_title, 24))
    ax.add_patch(plt.Rectangle((0.335, 0.40), 0.33, 0.20, facecolor=NAVY, edgecolor="none"))
    ax.text(0.5, 0.50, wrapped_title, ha="center", va="center", fontsize=9.0,
            color="white", fontweight="bold", linespacing=1.25)
    n = len(items)
    for i, item in enumerate(items):
        col = i % 2
        row = i // 2
        y = 0.86 - row * 0.30
        x = 0.03 if col == 0 else 0.70
        text = "\n".join(textwrap.wrap(item, 26)[:2])
        ax.add_patch(plt.Rectangle((x, y - 0.075), 0.27, 0.15, facecolor=PAPER, edgecolor=TEAL, lw=1.1))
        ax.text(x + 0.135, y, text, ha="center", va="center", fontsize=7.0, color=INK, linespacing=1.2)
        ax.annotate("", xy=(0.335 if col == 0 else 0.665, 0.50), xytext=(x + (0.27 if col == 0 else 0), y),
                    arrowprops=dict(arrowstyle="-", color=RULE, lw=0.9,
                                    connectionstyle="arc3,rad=0.08"))
    return _save(fig, f"concept-{_key(chapter_title)}")


# ---------------- cover page (A4, print-quality) ----------------
def cover_figure(book, workdir=None):
    fig = plt.figure(figsize=(8.27, 11.69), dpi=300)
    ax = fig.add_axes([0, 0, 1, 1]); ax.axis("off"); ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, facecolor="#FFFFFF"))
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, facecolor=NAVY))
    ax.add_patch(plt.Rectangle((0, 0.775), 1, 0.225, facecolor="#16304F"))
    ax.add_patch(plt.Rectangle((0, 0.758), 1, 0.006, facecolor=TEAL))
    # wordmark
    ax.text(0.09, 0.925, "FDE ACADEMY", fontsize=17, color="white", fontweight="bold", family="DejaVu Sans")
    ax.text(0.09, 0.895, "FROM ZERO KNOWLEDGE TO REAL-WORLD ENGINEERING", fontsize=7.0,
            color="#9FB6CF", family="DejaVu Sans")
    ax.add_patch(plt.Rectangle((0.09, 0.88), 0.055, 0.004, facecolor=TEAL))
    # series + edition
    ax.text(0.09, 0.80, f"{book['subject'].upper()} SERIES  ·  PRINT EDITION {book['edition']}",
            fontsize=8.6, color="#9FB6CF", family="DejaVu Sans")
    # title block
    ax.text(0.09, 0.665, book["title"], fontsize=30, color="white", fontweight="bold",
            family="DejaVu Sans", wrap=True)
    if book.get("subtitle"):
        ax.text(0.09, 0.595, book["subtitle"], fontsize=12.5, color="#C9D8E8",
                family="DejaVu Sans", style="italic")
    # objectives teaser
    if book.get("objectives"):
        ax.text(0.09, 0.535, "WHAT THIS BOOK DELIVERS", fontsize=7.6, color=TEAL,
                family="DejaVu Sans", fontweight="bold")
        for i, o in enumerate(book["objectives"][:4]):
            ax.text(0.09, 0.505 - i * 0.033, f"—  {o[:88]}", fontsize=8.6, color="#D7E1EC",
                    family="DejaVu Sans")
    # contents teaser
    ax.text(0.09, 0.315, "INSIDE", fontsize=7.6, color=TEAL, family="DejaVu Sans", fontweight="bold")
    teaser = "  ·  ".join((c.get("title") or l) for l, c in
                          [(ch["lessons"][0], ch) for ch in book["chapters"][:6]])
    ax.text(0.09, 0.288, teaser[:150], fontsize=8.0, color="#D7E1EC", family="DejaVu Sans")
    # meta block
    ax.text(0.09, 0.115, f"Edition {book['edition']}  ·  Version {book['version']}  ·  "
                         f"Published {book['publicationDate']}", fontsize=8.6, color="#9FB6CF",
            family="DejaVu Sans")
    ax.text(0.09, 0.085, f"Book identifier {book['identifier']}  ·  fde.academy/library",
            fontsize=8.0, color="#7E93AB", family="DejaVu Sans")
    path = os.path.join(FIG_DIR, f"cover-{book['slug']}.png")
    fig.savefig(path, dpi=300)
    plt.close(fig)
    return path
