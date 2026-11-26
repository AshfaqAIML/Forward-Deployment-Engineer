"""Figures for Book MA-1: Everyday Mathematics for Future Engineers.

All figures are code-free mathematical illustrations with English labels,
muted GO-1 palette, constrained_layout (no tight_layout).
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm

fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, Rectangle, FancyBboxPatch

plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = "/home/z/my-project/scripts/assets"
import os
os.makedirs(OUT, exist_ok=True)

INK = "#2C3440"
ACCENT = "#C27E4D"
MUTED = "#8A94A0"
MATH = "#46566B"
SURFACE = "#F8F0EB"

def save(fig, name):
    fig.savefig(OUT + "/" + name, dpi=200)
    plt.close(fig)

# ------------------------------------------------ 1. Number line 0-10 (ch2)
fig, ax = plt.subplots(figsize=(10, 2.6), constrained_layout=True)
ax.set_xlim(-0.7, 10.7)
ax.set_ylim(-1.1, 1.4)
for x in range(11):
    ax.plot([x, x], [-0.12, 0.12], color=INK, lw=1.6)
    ax.text(x, -0.42, str(x), ha="center", fontsize=11, color=INK)
ax.plot([-0.6, 10.6], [0, 0], color=INK, lw=1.6)
ax.annotate("", xy=(10.55, 0), xytext=(10.1, 0),
            arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.6))
ax.add_patch(FancyArrowPatch((0, 0), (7, 0), arrowstyle="-|>", mutation_scale=16,
             color=ACCENT, lw=2.4, linestyle=(0, (5, 3))))
for x, lab in [(3, "3"), (7, "7")]:
    ax.plot(x, 0, "o", ms=9, color=ACCENT)
    ax.text(x, 0.45, lab, ha="center", fontsize=12, color=ACCENT, fontweight="bold")
ax.text(2.0, 0.82, "7 steps to the right", fontsize=10, color=ACCENT, ha="center")
ax.text(5.5, -0.85, "Numbers grow to the right; every step adds one.", fontsize=10, color=MUTED, ha="center")
ax.axis("off")
save(fig, "fig_ma1_02_numberline.png")

# ------------------------------------------------ 2. Place value chart 4,307 (ch2)
fig, ax = plt.subplots(figsize=(9.5, 3.4), constrained_layout=True)
ax.set_xlim(0, 10)
ax.set_ylim(0, 3.4)
ax.axis("off")
cols = [("4", "thousands", "4,000"), ("3", "hundreds", "300"), ("0", "tens", "0"), ("7", "ones", "7")]
for i, (digit, place, worth) in enumerate(cols):
    x = 0.6 + i * 2.3
    ax.add_patch(Rectangle((x, 1.15), 1.9, 1.25, facecolor=SURFACE, edgecolor=MATH, lw=1.6))
    ax.text(x + 0.95, 1.78, digit, ha="center", fontsize=30, color=MATH, fontweight="bold")
    ax.text(x + 0.95, 0.82, place, ha="center", fontsize=11, color=INK)
    ax.text(x + 0.95, 0.42, "worth " + worth, ha="center", fontsize=10, color=ACCENT)
    if i < 3:
        ax.add_patch(FancyArrowPatch((x + 2.18, 1.78), (x + 2.32, 1.78), arrowstyle="-|>",
                     mutation_scale=13, color=MUTED))
ax.text(5.0, 2.85, "4,307  read as:  four thousand, three hundred seven", ha="center",
        fontsize=13, color=INK, fontweight="bold")
ax.text(5.0, 2.55, "each position is ten times the one to its right", ha="center", fontsize=10, color=MUTED)
save(fig, "fig_ma1_02_placevalue.png")

# ------------------------------------------------ 3. Column addition with carrying (ch3)
fig, ax = plt.subplots(figsize=(6.8, 4.6), constrained_layout=True)
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis("off")
ax.text(6.7, 8.9, "carry:  1    1", fontsize=11, color=ACCENT, ha="center")
rows = [(" ", "3", "4", "8"), ("+", "2", "7", "5"), ("=", "6", "2", "3")]
ys = [7.6, 6.1, 4.2]
for (row, y) in zip(rows, ys):
    ax.text(3.2, y, row[0], fontsize=22, color=INK, ha="center", va="center")
    for j, ch in enumerate(row[1:]):
        ax.text(4.6 + j * 1.7, y, ch, fontsize=26, color=INK if row[0] != "=" else ACCENT,
                ha="center", va="center", fontweight="bold" if row[0] == "=" else "normal")
ax.plot([2.6, 8.2], [5.2, 5.2], color=INK, lw=2.2)
ax.plot([2.6, 8.2], [7.0, 7.0], color=MUTED, lw=1.0, linestyle=(0, (4, 3)))
for (x1, y1, x2, y2) in [(5.4, 8.55, 5.0, 7.05), (7.1, 8.55, 6.7, 7.05)]:
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>", mutation_scale=12,
                 color=ACCENT, lw=1.6, linestyle=(0, (3, 2))))
ax.text(5.0, 3.0, "8 + 5 = 13:  write 3, carry 1", ha="center", fontsize=11, color=INK)
ax.text(5.0, 2.4, "4 + 7 + 1 = 12:  write 2, carry 1", ha="center", fontsize=11, color=INK)
ax.text(5.0, 1.8, "3 + 2 + 1 = 6", ha="center", fontsize=11, color=INK)
ax.text(5.0, 1.0, "Ten small units become one of the next size.", ha="center", fontsize=10, color=MUTED)
save(fig, "fig_ma1_03_carry.png")

# ------------------------------------------------ 4. Fraction bars (ch4)
fig, ax = plt.subplots(figsize=(9.0, 3.4), constrained_layout=True)
ax.set_xlim(0, 10)
ax.set_ylim(0, 3.4)
ax.axis("off")
def bar(y, label, parts, shaded, color):
    w = 7.0
    x0 = 2.0
    for i in range(parts):
        ax.add_patch(Rectangle((x0 + i * w / parts, y), w / parts, 0.8,
                     facecolor=color if i < shaded else "white", edgecolor=INK, lw=1.3))
    ax.text(1.75, y + 0.4, label, fontsize=13, color=INK, ha="right", va="center", fontweight="bold")
bar(2.3, "3/4", 4, 3, ACCENT)
bar(1.1, "6/8", 8, 6, MATH)
ax.text(6.4, 0.45, "3/4 and 6/8 cover the same amount: the sharing is equally fair.",
        fontsize=10.5, color=MUTED, ha="center")
save(fig, "fig_ma1_04_fractionbar.png")

# ------------------------------------------------ 5. Decimal place value (ch5)
fig, ax = plt.subplots(figsize=(9.5, 3.2), constrained_layout=True)
ax.set_xlim(0, 10)
ax.set_ylim(0, 3.2)
ax.axis("off")
cells = [("2", "tens", "20"), ("3", "ones", "3"), (".", "", ""), ("4", "tenths", "0.4"), ("5", "hundredths", "0.05")]
for i, (digit, place, worth) in enumerate(cells):
    x = 1.0 + i * 1.75
    if digit == ".":
        ax.text(x + 0.7, 1.55, ".", fontsize=34, color=ACCENT, ha="center", va="center", fontweight="bold")
        ax.text(x + 0.7, 0.45, "decimal point", fontsize=9.5, color=ACCENT, ha="center")
        continue
    ax.add_patch(Rectangle((x, 1.05), 1.35, 1.0, facecolor=SURFACE, edgecolor=MATH, lw=1.5))
    ax.text(x + 0.675, 1.55, digit, ha="center", fontsize=26, color=MATH, fontweight="bold")
    ax.text(x + 0.675, 0.72, place, ha="center", fontsize=9.5, color=INK)
    ax.text(x + 0.675, 0.42, worth, ha="center", fontsize=9.5, color=ACCENT)
ax.text(5.0, 2.75, "23.45  read as:  twenty-three and forty-five hundredths", ha="center",
        fontsize=13, color=INK, fontweight="bold")
save(fig, "fig_ma1_05_decimalpv.png")

# ------------------------------------------------ 6. Percent grid (ch6)
fig, ax = plt.subplots(figsize=(6.2, 5.4), constrained_layout=True)
n = 10
shaded = 25
ax.set_xlim(0, n)
ax.set_ylim(0, n)
ax.set_aspect("equal")
ax.axis("off")
count = 0
for r in range(n):
    for c in range(n):
        idx = r * n + c
        ax.add_patch(Rectangle((c, r), 1, 1,
                     facecolor=ACCENT if idx < shaded else "white",
                     edgecolor="#B0B8C0", lw=0.8))
ax.text(n / 2, n + 0.7, "25 of the 100 small squares are shaded", ha="center", fontsize=12, color=INK)
ax.text(n / 2, -0.9, "25 shaded = 25 percent = 25/100 = 0.25", ha="center", fontsize=11.5, color=MUTED)
save(fig, "fig_ma1_06_percentgrid.png")

# ------------------------------------------------ 7. Ratio blocks (ch7)
fig, ax = plt.subplots(figsize=(8.6, 3.2), constrained_layout=True)
ax.set_xlim(0, 10)
ax.set_ylim(0, 3.2)
ax.axis("off")
def blocks(y, label, a, b, ca, cb):
    for i in range(a):
        ax.add_patch(Rectangle((1.6 + i * 0.75, y), 0.65, 0.6, facecolor=ca, edgecolor=INK, lw=1.0))
    for i in range(b):
        ax.add_patch(Rectangle((1.6 + (a + 0.55) * 0.75 + i * 0.75, y), 0.65, 0.6, facecolor=cb, edgecolor=INK, lw=1.0))
    ax.text(1.45, y + 0.3, label, fontsize=13, color=INK, ha="right", va="center", fontweight="bold")
blocks(2.15, "3 : 2", 3, 2, ACCENT, MATH)
blocks(0.85, "6 : 4", 6, 4, ACCENT, MATH)
ax.text(6.9, 1.7, "doubling both sides\nkeeps the same pattern", fontsize=10.5, color=MUTED,
        ha="center", va="center", linespacing=1.4)
save(fig, "fig_ma1_07_ratioblocks.png")

# ------------------------------------------------ 8. Negative number line (ch8)
fig, ax = plt.subplots(figsize=(11.5, 3.0), constrained_layout=True)
ax.set_xlim(-10.8, 10.8)
ax.set_ylim(-1.5, 1.6)
for x in range(-10, 11):
    c = ACCENT if x < 0 else INK
    ax.plot([x, x], [-0.1, 0.1], color=c, lw=1.5)
    ax.text(x, -0.45, str(x), ha="center", fontsize=9.5, color=c)
ax.plot([-10.6, 10.6], [0, 0], color=INK, lw=1.6)
ax.annotate("", xy=(10.55, 0), xytext=(10.1, 0), arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.6))
ax.plot(0, 0, "o", ms=11, color=INK)
ax.text(0, 0.55, "zero", ha="center", fontsize=11, color=INK, fontweight="bold")
ax.add_patch(FancyArrowPatch((-3, 0), (-9, 0), arrowstyle="-|>", mutation_scale=15,
             color=ACCENT, lw=2.4, linestyle=(0, (5, 3))))
ax.text(-6, 0.62, "further below zero = smaller", fontsize=10, color=ACCENT, ha="center")
ax.text(-6, -0.95, "minus 9  <  minus 3  <  0", fontsize=11, color=INK, ha="center")
ax.axis("off")
save(fig, "fig_ma1_08_negline.png")

# ------------------------------------------------ 9. Power anatomy + squares (ch9)
fig, axes = plt.subplots(1, 2, figsize=(10.5, 3.6), constrained_layout=True,
                         gridspec_kw={"width_ratios": [1.15, 1.0]})
ax = axes[0]
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis("off")
ax.text(3.4, 3.4, "5", fontsize=54, color=MATH, ha="center", va="center", fontweight="bold")
ax.text(4.55, 4.15, "3", fontsize=26, color=ACCENT, ha="center", va="center", fontweight="bold")
ax.annotate("exponent:\nhow many copies", xy=(4.7, 4.4), xytext=(7.2, 5.2),
            fontsize=10, color=ACCENT, ha="center",
            arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=1.2))
ax.annotate("base:\nthe number repeated", xy=(3.3, 3.0), xytext=(1.7, 1.1),
            fontsize=10, color=MATH, ha="center",
            arrowprops=dict(arrowstyle="-|>", color=MATH, lw=1.2))
ax.text(4.0, 0.25, "= 5 \u00d7 5 \u00d7 5  =  125", fontsize=13, color=INK, ha="center")
ax = axes[1]
ax.set_xlim(0, 13)
ax.set_ylim(-1.2, 13)
ax.set_aspect("equal")
ax.axis("off")
for k, s in enumerate([1, 2, 3, 4, 5]):
    ax.add_patch(Rectangle((0, 0), s, s, facecolor="none", edgecolor=MATH, lw=1.4))
    ax.plot([s], [s], "o", ms=4, color=ACCENT)
    ax.text(s + 0.45, s - 0.55, "%d\u00b2 = %d" % (s, s * s), fontsize=10, color=INK, va="center")
save(fig, "fig_ma1_09_power.png")

# ------------------------------------------------ 10. Metric conversion map (ch10)
fig, ax = plt.subplots(figsize=(10.2, 3.9), constrained_layout=True)
ax.set_xlim(0, 12)
ax.set_ylim(0, 4)
ax.axis("off")
def unit_box(x, y, text):
    ax.add_patch(FancyBboxPatch((x, y), 2.3, 0.95, boxstyle="round,pad=0.18,rounding_size=0.25",
                 facecolor=SURFACE, edgecolor=MATH, lw=1.4))
    ax.text(x + 1.15, y + 0.48, text, fontsize=11.5, color=INK, ha="center", va="center", fontweight="bold")
def conv_arrow(x, y, label, dx=1.25):
    ax.add_patch(FancyArrowPatch((x, y + 0.15), (x + dx, y + 0.15), arrowstyle="-|>",
                 mutation_scale=12, color=ACCENT, lw=1.4))
    ax.text(x + dx / 2, y + 0.62, label, fontsize=9.5, color=ACCENT, ha="center")
row1 = [("km", 0.4), ("m", 4.05), ("cm", 7.7)]
for (t, x) in row1:
    unit_box(x, 2.5, t)
conv_arrow(2.75, 2.5, "\u00d7 1,000")
conv_arrow(6.4, 2.5, "\u00f7 100")
unit_box(10.7, 2.5, "mm")
conv_arrow(10.0, 2.5, "\u00f7 10", dx=0.55)
row2 = [("kg", 0.4), ("g", 4.05)]
for (t, x) in row2:
    unit_box(x, 0.9, t)
conv_arrow(2.75, 0.9, "\u00d7 1,000")
unit_box(7.7, 0.9, "L")
unit_box(10.7, 0.9, "mL")
conv_arrow(10.0, 0.9, "\u00d7 1,000", dx=0.55)
ax.text(6.0, 3.85, "kilo = 1,000 steps bigger      centi = 100 steps smaller      milli = 1,000 steps smaller",
        fontsize=10.5, color=MUTED, ha="center")
save(fig, "fig_ma1_10_unitmap.png")

# ------------------------------------------------ 11. Room grid 4x3 (ch10)
fig, ax = plt.subplots(figsize=(7.6, 3.9), constrained_layout=True)
n_cols, n_rows = 4, 3
ax.set_xlim(-0.4, n_cols + 0.4)
ax.set_ylim(-0.9, n_rows + 0.9)
ax.set_aspect("equal")
ax.axis("off")
for r in range(n_rows):
    for c in range(n_cols):
        ax.add_patch(Rectangle((c, r), 1, 1, facecolor=SURFACE, edgecolor="#B0B8C0", lw=1.0))
        ax.plot([c + 0.5], [r + 0.5], marker="s", ms=2, color=MUTED)
ax.add_patch(Rectangle((0, 0), n_cols, n_rows, facecolor="none", edgecolor=INK, lw=2.6))
ax.text(n_cols / 2, n_rows + 0.55, "4 m", fontsize=12, color=INK, ha="center")
ax.text(-0.28, n_rows / 2, "3 m", fontsize=12, color=INK, va="center", rotation=90)
ax.text(n_cols / 2, -0.5, "area = 4 \u00d7 3 = 12 square meters (m\u00b2)", fontsize=11.5,
        color=ACCENT, ha="center", fontweight="bold")
ax.text(n_cols / 2, -0.85, "perimeter = 4 + 3 + 4 + 3 = 14 meters", fontsize=11.5, color=MATH,
        ha="center", fontweight="bold")
save(fig, "fig_ma1_10_roomgrid.png")

# ------------------------------------------------ 12. Problem-solving flow (ch11)
fig, ax = plt.subplots(figsize=(11.6, 3.0), constrained_layout=True)
ax.set_xlim(0, 12)
ax.set_ylim(0, 3.0)
ax.axis("off")
steps = [("1. Understand", "What is given?\nWhat is asked?"),
         ("2. Plan", "Which operations,\nin what order?"),
         ("3. Solve", "One small step at a\ntime, units written"),
         ("4. Check", "Estimate, reverse,\nmake sense?")]
for i, (title, sub) in enumerate(steps):
    x = 0.3 + i * 3.0
    ax.add_patch(FancyBboxPatch((x, 0.55), 2.5, 1.9, boxstyle="round,pad=0.2,rounding_size=0.3",
                 facecolor=SURFACE, edgecolor=MATH, lw=1.6))
    ax.text(x + 1.25, 2.0, title, fontsize=12.5, color=INK, ha="center", fontweight="bold")
    ax.text(x + 1.25, 1.15, sub, fontsize=9.5, color=MUTED, ha="center", va="center", linespacing=1.5)
    if i < 3:
        ax.add_patch(FancyArrowPatch((x + 2.62, 1.5), (x + 2.88, 1.5), arrowstyle="-|>",
                     mutation_scale=14, color=ACCENT, lw=2.0))
save(fig, "fig_ma1_11_solveflow.png")

from PIL import Image
import glob
for p in sorted(glob.glob(OUT + "/fig_ma1_*.png")):
    im = Image.open(p).convert("L")
    h = im.histogram()
    print(os.path.basename(p), im.size, "non-white ratio %.3f" % (1 - h[255] / sum(h)))
