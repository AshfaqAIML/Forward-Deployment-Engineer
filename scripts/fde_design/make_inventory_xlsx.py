"""FDE Academy website - component inventory workbook."""
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

OUT = "/home/z/my-project/download/FDE_Academy_Component_Inventory.xlsx"

HDR_FILL = PatternFill("solid", fgColor="D4875A")
HDR_FONT = Font(color="FFFFFF", bold=True, name="Calibri", size=11)
TITLE_FONT = Font(bold=True, size=14, name="Calibri", color="2C3440")
BODY = Font(name="Calibri", size=11)
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(horizontal="center", vertical="center")

# name, category, purpose, variants, states, used in, priority
ROWS = [
    ("Top navigation bar", "Navigation", "Persistent orientation across the whole site; active section always highlighted", "Public, signed-in, admin, mobile (burger)", "Default, active section, focus-visible, condensed on scroll", "Every page", "P0"),
    ("Footer", "Navigation", "Secondary navigation, download links, legal", "Desktop 4 columns, mobile stacked", "Default", "Every page", "P0"),
    ("Breadcrumb trail", "Navigation", "Location inside deep trees (course > module > chapter > lesson)", "Standard, with progress %", "Default, hover", "Course detail, book detail, roadmap", "P1"),
    ("Logo block", "Brand", "Identity: wordmark + tagline", "Dark-on-light, light-on-dark, favicon glyph", "Default", "Top bar, footer, cover pages", "P0"),
    ("Primary button", "Action", "One per view: the recommended next action", "Solid dark ink", "Default, hover, focus-visible, disabled, loading", "Everywhere", "P0"),
    ("Secondary / ghost button", "Action", "Alternative actions", "Outline", "Default, hover, focus-visible, disabled", "Everywhere", "P0"),
    ("Text link", "Action", "Inline navigation; glossary terms underlined", "Inline, standalone", "Default, hover, focus-visible, visited, glossary-term", "Lesson text, help panels", "P0"),
    ("Chip / badge", "Status", "Subject, difficulty, level, state labels", "Filter chip (toggleable), status chip, count chip", "On, off, hover, focus", "Library, roadmap, projects", "P0"),
    ("Progress bar", "Feedback", "Course / book / stage completion", "Thin inline, full-width", "Animating, complete", "Dashboard, cards", "P0"),
    ("Progress ring", "Feedback", "Overall programme percentage", "Standard", "Animating", "Dashboard header", "P1"),
    ("Stage rail item", "Roadmap", "One row per stage with state, prerequisites, books, projects", "Completed, current, upcoming/locked", "Expanded (detail panel), collapsed", "Roadmap page", "P0"),
    ("Stage detail panel", "Roadmap", "Prerequisites, recommended lessons, related books, linked projects", "Standard", "Loading, empty", "Roadmap page", "P0"),
    ("Course card", "Library", "Course preview with subject/difficulty chips and completion", "Standard, compact (search results)", "Hover, focus", "Course library, home", "P0"),
    ("Module tree", "Library", "Course structure: modules > chapters > lessons with ticks", "Expanded, collapsed", "Lesson done / in progress / locked", "Course detail", "P0"),
    ("Lesson row", "Library", "One lesson with duration, exercise count, completion tick", "Done, next, locked", "Hover", "Course detail, dashboard", "P0"),
    ("Book card", "Library", "Cover, title, difficulty, chapter count, reading progress", "Standard, compact", "Hover", "Book library, home", "P0"),
    ("Table of contents tree", "Library", "Book chapters with per-chapter read state", "Standard", "Read, unread, current", "Book detail, reader", "P0"),
    ("Download buttons (DOCX/PDF)", "Library", "Honest access modes for every book", "Button pair + file-size caption", "Default, generating, downloaded", "Book detail, reader", "P0"),
    ("Reader page", "Library", "Chapter view with rendered mathematics and tracked position", "Online reader", "Font-size adjust, math-rendered, position saved", "Book reader", "P0"),
    ("Filter sidebar", "Library", "Subject / topic / difficulty / stage refinement", "Checkbox lists, chips", "Applied, cleared, counts", "Courses, books, projects", "P0"),
    ("Search box", "Input", "Universal search across lessons, books, glossary", "Header compact, page hero large", "Empty, typing, results, no-results (with help)", "Library, glossary, top bar", "P0"),
    ("Glossary term card", "Reference", "Simple meaning, detailed meaning, example, related terms, category", "Full page, inline popover", "Default", "Glossary, inline explanations", "P0"),
    ("Exercise panel", "Labs", "Task statement, answer input, instant explanatory feedback", "Numeric, multiple-choice, code, canvas", "Checking, correct, incorrect-with-explanation, hint-gated", "Practical labs", "P0"),
    ("Code editor pane", "Labs", "Starter code editing with run and reset", "Read-only, editable", "Running, error highlighted, output shown", "Coding, database, API, AI labs", "P1"),
    ("Output pane", "Labs", "Program output / test results, monospaced", "Standard", "Empty, success, failure", "Coding and AI labs", "P1"),
    ("Quiz question card", "Assessment", "One question at a time with options and flag-for-review", "Single choice, multi-select, numeric, short text", "Selected, flagged, submitted", "Assessment centre", "P0"),
    ("Quiz result card", "Assessment", "Score with follow-up action (retry booked, badge earned)", "Pass, fail-with-plan", "Default", "Assessment centre, dashboard", "P0"),
    ("Timer chip", "Assessment", "Time remaining on timed tests", "Standard", "Normal, under-5-minutes warning", "Topic/subject tests, mock exams", "P1"),
    ("Project brief header", "Projects", "Level, stage link, business story, honest time estimate", "Standard", "Default", "Project detail", "P0"),
    ("Step checklist", "Projects", "Implementation steps as tickable rows", "Standard", "Done, current, todo", "Project detail, lab workflows", "P0"),
    ("Rubric panel", "Projects", "Six-dimension rubric with pass rule (16/24, none below 2)", "Preview, scored", "Auto-checked, mentor-reviewed", "Project detail, submissions", "P0"),
    ("Submission uploader", "Projects", "Evidence upload against the demonstration checklist", "Files, screenshots, links", "Uploading, submitted, returned-for-fix, accepted", "Project detail", "P0"),
    ("KPI stat card", "Dashboard", "Single number with caption (streak, average, counts)", "Standard", "Default, delta-highlighted", "Dashboard, admin", "P0"),
    ("Recommended-next card", "Dashboard", "Exactly one recommended activity with an escape hatch", "Standard", "Default, completed (rotates)", "Dashboard", "P0"),
    ("Streak indicator", "Dashboard", "Current and longest study streak", "Chip, KPI", "Active day, at-risk (evening reminder)", "Dashboard", "P1"),
    ("Toast / notification", "Feedback", "Non-blocking confirmations (saved, published, badge)", "Success, info, warning", "Enter, auto-dismiss", "Everywhere", "P0"),
    ("Empty-state block", "Feedback", "Friendly explanation + first action when a list is empty", "Standard", "Default", "Library, dashboard, submissions", "P0"),
    ("Accordion (FAQ)", "Content", "Question with expandable answer", "Single-open, multi-open", "Expanded, collapsed", "Home FAQ, help", "P1"),
    ("Modal dialog", "Overlay", "Focused confirmations (publish, delete, download start)", "Confirm, form", "Open, focus-trapped, closed", "Admin, downloads", "P0"),
    ("Admin data table", "Admin", "Content lists with inline actions and health signals", "Standard, with filters", "Row hover, selected, loading", "Admin dashboard", "P0"),
    ("Content editor", "Admin", "Lesson authoring: rich text, mathematics, code, diagrams", "Full editor", "Draft, preview-as-student, versioned", "Admin", "P0"),
    ("Version note dialog", "Admin", "Mandatory change note before publishing", "Standard", "Required, saved", "Admin publishing flow", "P1"),
    ("Analytics chart card", "Admin", "Pass rates, completion, time-on-task trends", "Line, bar, table fallback", "Loading, empty", "Admin analytics", "P1"),
    ("Role gate wrapper", "Admin", "Hides/gates admin surfaces for non-admin roles", "Route-level, component-level", "Allowed, denied page", "Admin section", "P0"),
    ("Plain-language tooltip", "Help", "Inline explanation of technical terms", "Hover/focus popover", "Shown, dismissed", "Wherever jargon appears", "P0"),
]

wb = Workbook()
ws = wb.active
ws.title = "Component inventory"
ws["A1"] = "FDE Academy Website \u2014 Component Inventory"
ws["A1"].font = TITLE_FONT
ws["A2"] = ("45 components in 17 categories. Priority: P0 = build in Phase 1 (MVP), P1 = Phase 2, "
            "P2 = later. States list what must be designed and tested, not only the default. "
            "Full specifications live in the design document, chapter 7.")
ws["A2"].font = Font(italic=True, size=10, name="Calibri", color="68727E")
ws["A2"].alignment = WRAP
ws.row_dimensions[2].height = 30

headers = ["Component", "Category", "Purpose", "Variants", "States", "Used in", "Priority"]
for i, h in enumerate(headers, 1):
    ws.cell(row=4, column=i, value=h)
    c = ws.cell(row=4, column=i)
    c.fill = HDR_FILL; c.font = HDR_FONT; c.alignment = CENTER

r = 5
for row in ROWS:
    for i, v in enumerate(row, 1):
        cell = ws.cell(row=r, column=i, value=v)
        cell.font = BODY
        cell.alignment = WRAP if i in (3, 4, 5, 6) else (CENTER if i == 7 else WRAP)
    ws.row_dimensions[r].height = 44
    r += 1

widths = [26, 14, 40, 30, 34, 24, 9]
for i, w in enumerate(widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "A5"
ws.auto_filter.ref = f"A4:G{r-1}"

wb.save(OUT)
print("written:", OUT, "| components:", len(ROWS))
