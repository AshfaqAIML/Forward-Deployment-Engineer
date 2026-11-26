"""Compute WCAG 2.1 contrast ratios for the FDE Academy web palette.
Prints real numbers; the design document quotes only pairs that pass.
"""
def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 * 12.92 else ((c + 0.055) / 1.055) ** 2.4

def luminance(hexcol):
    hexcol = hexcol.lstrip("#")
    r, g, b = (int(hexcol[i:i+2], 16) for i in (0, 2, 4))
    return 0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)

def ratio(fg, bg):
    l1, l2 = sorted([luminance(fg), luminance(bg)], reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)

PAIRS = [
    # (foreground, background, role)
    ("#1A2330", "#FFFFFF", "Primary text on white"),
    ("#1A2330", "#F5F7FA", "Primary text on surface"),
    ("#2C3440", "#FFFFFF", "Body text on white"),
    ("#46566B", "#FFFFFF", "Secondary text on white"),
    ("#68727E", "#FFFFFF", "Muted text on white (large/caption check)"),
    ("#FFFFFF", "#1A2330", "Inverse text on ink (hero)"),
    ("#D8DEE6", "#1A2330", "Subtle inverse text on ink"),
    ("#FFFFFF", "#A55F33", "Text on primary button (dark amber)"),
    ("#FFFFFF", "#C27E4D", "Text on brand amber (decoration check)"),
    ("#8F5229", "#FFF7ED", "Amber-800 text on amber-50 chip"),
    ("#2E7D74", "#FFFFFF", "Success text on white"),
    ("#FFFFFF", "#2E7D74", "Text on success button"),
    ("#B3452E", "#FFFFFF", "Error text on white"),
    ("#8A3B26", "#FDF1EE", "Error text on error-50 chip"),
    ("#1E3A5F", "#FFFFFF", "Link text on white"),
    ("#1E3A5F", "#EFF6FF", "Link text on info-50 chip"),
    ("#46566B", "#F0F4F8", "Secondary text on band"),
    ("#FFFFFF", "#2D4A6F", "Text on slate-blue panel"),
]

print(f"{'foreground':<10} {'background':<10} {'ratio':>6}  {'AA(4.5)':<8} {'AAA(7)':<8} role")
for fg, bg, role in PAIRS:
    r = ratio(fg, bg)
    aa = "PASS" if r >= 4.5 else ("AA-Large" if r >= 3.0 else "FAIL")
    aaa = "PASS" if r >= 7.0 else "-"
    print(f"{fg:<10} {bg:<10} {r:>6.2f}  {aa:<8} {aaa:<8} {role}")
