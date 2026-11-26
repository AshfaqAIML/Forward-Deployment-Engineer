#!/usr/bin/env python3
"""Chart for the audit report: findings by severity + verification status."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm
fm.fontManager.addfont("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
import matplotlib.pyplot as plt

plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

labels = ["Critical", "High", "Medium", "Low", "Verified\nby design"]
counts = [1, 1, 2, 3, 12]
# low-saturation palette (Morandi) with the document accent for Critical
colors = ["#B87472", "#C49B72", "#6B9DAD", "#7BA68A", "#9AA6B2"]

fig, ax = plt.subplots(figsize=(9, 4.6), constrained_layout=True)
bars = ax.bar(labels, counts, color=colors, width=0.62, edgecolor="none")
for b, v in zip(bars, counts):
    ax.text(b.get_x() + b.get_width() / 2, v + 0.15, str(v), ha="center",
            fontsize=12, color="#1C2A3D", fontweight="bold")
ax.set_ylabel("Findings", fontsize=11, color="#1C2A3D")
ax.set_ylim(0, 13.5)
ax.spines[["top", "right"]].set_visible(False)
ax.spines[["left", "bottom"]].set_color("#B0B0B0")
ax.tick_params(colors="#1C2A3D", labelsize=10.5)
ax.grid(axis="y", alpha=0.3, color="#B0B0B0")
ax.set_title("FDE Academy audit findings by severity (19 findings total)",
             fontsize=12.5, color="#1C2A3D", pad=10)
fig.savefig("/home/z/my-project/scripts/audit_chart.png", dpi=200)
print("chart saved")
