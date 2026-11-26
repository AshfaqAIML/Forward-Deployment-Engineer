"""Blank worksheet figures for the MA-2 Practical Workbook.

Six fill-in worksheet illustrations (distinct from all textbook figures): the
learner draws or writes on these. English labels, GO-1 palette, Agg backend.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm

fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Circle

plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = "/home/z/my-project/scripts/assets"
INK = "#2C3440"
ACCENT = "#C27E4D"
MUTED = "#8A94A0"
MATH = "#46566B"
SURFACE = "#F8F0EB"

def save(fig, name):
    fig.savefig(OUT + "/" + name, dpi=200)
    plt.close(fig)

# ---------------------------------------------- 1. blank number line -5..10
fig, ax = plt.subplots(figsize=(10, 1.9), constrained_layout=True)
ax.set_xlim(-5.8, 10.8); ax.set_ylim(-0.9, 1.1); ax.axis("off")
ax.plot([-5.5, 10.5], [0, 0], color=INK, lw=1.8)
for x in range(-5, 11):
    ax.plot([x, x], [-0.14, 0.14], color=INK, lw=1.5)
    ax.text(x, -0.45, str(x), ha="center", fontsize=11, color=INK)
ax.annotate("", xy=(10.45, 0), xytext=(10.0, 0),
            arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.8))
ax.text(2.5, 0.62, "your number line: mark and shade here", ha="center",
        fontsize=11, color=MUTED)
save(fig, "fig_wb_numberline.png")

# ---------------------------------------------- 2. blank 6x6 grid
fig, ax = plt.subplots(figsize=(4.6, 4.4), constrained_layout=True)
ax.set_xlim(-0.5, 6.9); ax.set_ylim(-0.9, 6.9); ax.axis("off")
for g in range(7):
    ax.plot([0, 6], [g, g], color=MATH, lw=1.2)
    ax.plot([g, g], [0, 6], color=MATH, lw=1.2)
ax.text(3.0, -0.6, "a 6 by 6 grid: shade squares or draw shapes here",
        ha="center", fontsize=10, color=MUTED)
save(fig, "fig_wb_grid6.png")

# ---------------------------------------------- 3. blank coordinate grid 0..8
fig, ax = plt.subplots(figsize=(5.4, 5.0), constrained_layout=True)
ax.set_xlim(-0.9, 8.9); ax.set_ylim(-0.9, 8.9); ax.axis("off")
for g in range(9):
    ax.plot([-0.6, 8.6], [g, g], color="#E3D9D2", lw=0.9, zorder=0)
    ax.plot([g, g], [-0.6, 8.6], color="#E3D9D2", lw=0.9, zorder=0)
ax.annotate("", xy=(8.6, 0), xytext=(-0.6, 0), arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.6))
ax.annotate("", xy=(0, 8.6), xytext=(0, -0.6), arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.6))
ax.text(8.5, -0.45, "x", fontsize=13, color=INK)
ax.text(-0.45, 8.4, "y", fontsize=13, color=INK)
for v in range(1, 8):
    ax.text(v, -0.32, str(v), ha="center", fontsize=8, color=MUTED)
    ax.text(-0.28, v - 0.05, str(v), va="center", ha="right", fontsize=8, color=MUTED)
ax.text(4.0, 8.15, "plot your points here: across first, then up",
        ha="center", fontsize=10, color=MUTED)
save(fig, "fig_wb_coordgrid.png")

# ---------------------------------------------- 4. empty balance scale
fig, ax = plt.subplots(figsize=(8.5, 3.0), constrained_layout=True)
ax.set_xlim(0, 12); ax.set_ylim(0, 3.4); ax.axis("off")
ax.plot([2.0, 10.0], [2.6, 2.6], color=INK, lw=3)
ax.plot([6.0, 6.0], [2.6, 1.0], color=INK, lw=3)
ax.add_patch(FancyBboxPatch((4.6, 0.55), 2.8, 0.45, boxstyle="round,pad=0.05",
             fc=INK, ec=INK))
ax.add_patch(FancyBboxPatch((1.0, 2.72), 3.0, 0.5, boxstyle="round,pad=0.05",
             fc=SURFACE, ec=ACCENT, lw=1.8, linestyle=(0, (4, 3))))
ax.add_patch(FancyBboxPatch((8.0, 2.72), 3.0, 0.5, boxstyle="round,pad=0.05",
             fc=SURFACE, ec=ACCENT, lw=1.8, linestyle=(0, (4, 3))))
ax.text(2.5, 2.97, "left pan: write here", ha="center", fontsize=10, color=MUTED)
ax.text(9.5, 2.97, "right pan: write here", ha="center", fontsize=10, color=MUTED)
ax.text(6.0, 0.15, "keep both pans equally heavy in every move", ha="center",
        fontsize=11, color=MUTED)
save(fig, "fig_wb_balance.png")

# ---------------------------------------------- 5. empty Venn circles
fig, ax = plt.subplots(figsize=(7.2, 4.4), constrained_layout=True)
ax.set_xlim(0, 12); ax.set_ylim(0, 6.2); ax.axis("off")
c1 = plt.Circle((4.4, 3.0), 2.4, fc="none", ec=MATH, lw=2.0, linestyle=(0, (5, 3)))
c2 = plt.Circle((7.6, 3.0), 2.4, fc="none", ec=ACCENT, lw=2.0, linestyle=(0, (5, 3)))
ax.add_patch(c1); ax.add_patch(c2)
ax.text(2.9, 5.6, "set A", ha="center", fontsize=13, color=MATH, fontweight="bold")
ax.text(9.1, 5.6, "set B", ha="center", fontsize=13, color=ACCENT, fontweight="bold")
ax.text(2.9, 3.0, "A only", ha="center", fontsize=10, color=MUTED)
ax.text(6.0, 3.0, "both", ha="center", fontsize=10, color=MUTED)
ax.text(9.1, 3.0, "B only", ha="center", fontsize=10, color=MUTED)
ax.text(11.3, 1.0, "neither:\nwrite outside\nboth circles", ha="center", fontsize=9, color=MUTED)
save(fig, "fig_wb_venn.png")

# ---------------------------------------------- 6. dot lattice for patterns
fig, ax = plt.subplots(figsize=(7.5, 4.0), constrained_layout=True)
ax.set_xlim(0, 12); ax.set_ylim(0, 5.4); ax.axis("off")
for row in range(3):
    for col in range(8):
        ax.add_patch(Circle((1.0 + col * 0.85, 3.6 - row * 0.85), 0.10,
                     fc=MATH, ec="none"))
ax.text(6.0, 0.7, "the dot lattice: build stages 1, 2, and 3 of your pattern",
        ha="center", fontsize=11, color=MUTED)
ax.annotate("", xy=(10.6, 4.9), xytext=(9.9, 4.9),
            arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2))
save(fig, "fig_wb_dotlattice.png")

print("Workbook figures written to", OUT)
