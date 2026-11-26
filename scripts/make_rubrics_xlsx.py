"""Build FDE_Project_Rubrics.xlsx - the evaluation rubric workbook.

One sheet per level (6 dimensions x 0-4, evidence column, automatic total and
pass verdict via formulas) plus a Summary sheet pulling every project total.
"""
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

OUT = "/home/z/my-project/download/FDE_Project_Rubrics.xlsx"

HDR_FILL = PatternFill("solid", fgColor="D4875A")
HDR_FONT = Font(color="FFFFFF", bold=True, name="Calibri", size=11)
TITLE_FONT = Font(bold=True, name="Calibri", size=14, color="2C3440")
BODY_FONT = Font(name="Calibri", size=11)
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="center")

DIMENSIONS = ["Understanding", "Correctness", "Craft", "Safety & security",
              "Operation", "Communication"]

LEVEL_PROJECTS = {
    "Level 1": ["1.1 The Market-Stall Budget", "1.2 The Delivery-Route Logic Pack"],
    "Level 2": ["2.1 The Expense Tracker CLI", "2.2 The Sales Report Automator"],
    "Level 3": ["3.1 Clean the Market Dataset", "3.2 The Sales Reporting Database"],
    "Level 4": ["4.1 The Task Tracker API and Frontend", "4.2 The Feedback Dashboard"],
    "Level 5": ["5.1 Package and Ship the Task Tracker", "5.2 Operate It: Backups and Monitoring"],
    "Level 6": ["6.1 The Support FAQ Assistant", "6.2 The Document Search System"],
    "Level 7": ["7.1 AI Support Assistant for BrightCart",
                "7.2 Document Search for Halewood & Partners",
                "7.3 AI Reporting Assistant for NovaFleet Sales"],
}

LEVEL_NOTE = {
    "Level 1": "Depth note: correctness means hand-verified numbers; operation means a stranger can follow the rule sheet.",
    "Level 2": "Depth note: correctness adds runtime behavior tests; craft adds validation and clean error paths.",
    "Level 3": "Depth note: correctness adds independent verification of every reported number; operation adds repeatable builds.",
    "Level 4": "Depth note: craft adds documented API contracts with honest status codes; operation adds restart survival.",
    "Level 5": "Depth note: operation is the core dimension here - runbooks, backups, drills, monitoring.",
    "Level 6": "Depth note: correctness includes the evaluation gate; communication includes honest limitations and refusals.",
    "Level 7": "Depth note: all six dimensions graded as a working professional - scope discipline, pilot evidence, handover quality.",
}


def style_header(ws, row, cols):
    for c in cols:
        cell = ws.cell(row=row, column=c)
        cell.fill = HDR_FILL
        cell.font = HDR_FONT
        cell.alignment = CENTER


def build_level_sheet(wb, level_name):
    ws = wb.create_sheet(level_name[:31])
    ws.sheet_properties.tabColor = "C27E4D"
    ws["A1"] = level_name + " - evaluation rubric"
    ws["A1"].font = TITLE_FONT
    ws["A2"] = LEVEL_NOTE[level_name]
    ws["A2"].font = Font(italic=True, name="Calibri", size=10, color="68727E")
    ws["A3"] = "Score each dimension 0-4. Pass at 16+ total AND no dimension below 2. Evidence column: one sentence of proof."
    ws["A3"].font = Font(italic=True, name="Calibri", size=10, color="68727E")

    headers = ["Project"] + DIMENSIONS + ["Total", "Verdict", "Evidence (one sentence per dimension)"]
    for i, h in enumerate(headers, start=1):
        ws.cell(row=5, column=i, value=h)
    style_header(ws, 5, range(1, len(headers) + 1))

    row = 6
    for proj in LEVEL_PROJECTS[level_name]:
        ws.cell(row=row, column=1, value=proj).font = Font(bold=True, name="Calibri", size=11)
        for c in range(2, 8):
            ws.cell(row=row, column=c, value=None)
        ws.cell(row=row, column=8,
                value=f"=IF(COUNT(B{row}:G{row})=6,SUM(B{row}:G{row}),\"\")")
        ws.cell(row=row, column=9,
                value=(f"=IF(COUNT(B{row}:G{row})<6,\"\","
                       f"IF(AND(H{row}>=16,MIN(B{row}:G{row})>=2),\"PASS\",\"NOT YET\"))"))
        ws.cell(row=row, column=10, value="")
        for c in range(1, len(headers) + 1):
            cell = ws.cell(row=row, column=c)
            cell.alignment = WRAP if c in (1, 10) else CENTER
            cell.font = BODY_FONT
        ws.row_dimensions[row].height = 46
        row += 1

    widths = [34, 13, 13, 10, 15, 12, 16, 9, 11, 46]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A6"
    return row - 6


wb = Workbook()

# Summary sheet first
ws = wb.active
ws.title = "Summary"
ws["A1"] = "FDE Project Handbook - Evaluation Summary"
ws["A1"].font = Font(bold=True, size=14, name="Calibri", color="2C3440")
ws["A2"] = "One row per project. Totals pull live from the level sheets; a project passes at 16+ with no dimension below 2."
ws["A2"].font = Font(italic=True, size=10, name="Calibri", color="68727E")
headers = ["Level", "Project", "Total", "Verdict"]
for i, h in enumerate(headers, start=1):
    ws.cell(row=4, column=i, value=h)
style_header(ws, 4, range(1, 5))

r = 5
sheet_rows = {}
for level_name, projects in LEVEL_PROJECTS.items():
    sheet = level_name[:31]
    build_level_sheet(wb, level_name)
    for i, proj in enumerate(projects):
        src_row = 6 + i
        ws.cell(row=r, column=1, value=level_name.replace("Level ", "L"))
        ws.cell(row=r, column=2, value=proj)
        ws.cell(row=r, column=3, value=f"='{sheet}'!H{src_row}")
        ws.cell(row=r, column=4, value=f"='{sheet}'!I{src_row}")
        for c in range(1, 5):
            ws.cell(row=r, column=c).font = BODY_FONT
            ws.cell(row=r, column=c).alignment = WRAP if c == 2 else CENTER
        sheet_rows[level_name] = src_row
        r += 1

ws.column_dimensions["A"].width = 8
ws.column_dimensions["B"].width = 44
ws.column_dimensions["C"].width = 9
ws.column_dimensions["D"].width = 11
ws.freeze_panes = "A5"

# Read-me sheet last
rm = wb.create_sheet("Read me", 0)
rm.sheet_properties.tabColor = "46566B"
rm["A1"] = "How to use this rubric workbook"
rm["A1"].font = Font(bold=True, size=14, name="Calibri", color="2C3440")
lines = [
    "",
    "1. One sheet per level; one row per project; one score (0-4) per dimension.",
    "2. Dimensions: Understanding, Correctness, Craft, Safety & security, Operation, Communication.",
    "3. A project passes at 16+ total AND no dimension below 2 - the verdict column computes itself.",
    "4. Always write one sentence of evidence in the Evidence column; scores without evidence are opinions.",
    "5. The Summary sheet pulls every total live - it is the programme's scoreboard.",
    "",
    "The production-readiness rule (from the handbook): a demo becomes production only when the test",
    "suite passes, authentication and HTTPS exist, monitoring and backups run on schedule, a recovery",
    "drill has been performed, and someone other than the author has deployed it from the runbook.",
    "Every Level 7 engagement ends with the list of which of those are still open.",
    "",
    "Scoring scale per dimension: 0 not attempted, 1 attempted but broken, 2 works with gaps,",
    "3 works and verified, 4 works, verified, and explained in plain language.",
]
for i, t in enumerate(lines, start=2):
    rm.cell(row=i, column=1, value=t).font = Font(name="Calibri", size=11)
rm.column_dimensions["A"].width = 110

wb.save(OUT)
print("written:", OUT, "| sheets:", wb.sheetnames)
