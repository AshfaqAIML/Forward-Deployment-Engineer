"""Smoke-test the FDE Academy single-file frontend with Playwright."""
import asyncio, json
from playwright.async_api import async_playwright

APP = "file:///home/z/my-project/download/FDE_Academy_Frontend.html"
OUT = "/tmp/fde_shots"
import os; os.makedirs(OUT, exist_ok=True)

ROUTES = [
    ("#/", "What is a Forward Deployed Engineer"),
    ("#/roadmap", "Your learning roadmap"),
    ("#/stage/s2", "Stage 2"),
    ("#/courses", "Course library"),
    ("#/course/fm", "Foundation Mathematics"),
    ("#/lesson/fm-1", "The four operations"),
    ("#/books", "Digital book library"),
    ("#/book/fm", "Table of contents"),
    ("#/book/fm/0", "Chapter 1"),
    ("#/maths", "Maths studio"),
    ("#/labs", "Practical labs"),
    ("#/lab/code-c1", "predict"),
    ("#/lab/sql-1", "mini-SQL"),
    ("#/lab/api-1", "orders"),
    ("#/lab/ai-1", "grounded assistant"),
    ("#/projects", "Project centre"),
    ("#/project/p1-1", "Market-Stall Budget"),
    ("#/assessments", "Assessment centre"),
    ("#/assessments/report", "Progress report"),
    ("#/glossary", "Glossary"),
    ("#/dashboard", "Your dashboard"),
    ("#/career", "Career centre"),
    ("#/admin", "Admin console"),
    ("#/search/break-even", "Search results"),
    ("#/nope-404", "does not exist"),
]

async def main():
    errors = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1360, "height": 900})
        page.on("console", lambda m: errors.append(("console:" + m.type, m.text)) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(("pageerror", str(e))))
        await page.goto(APP)
        await page.wait_for_timeout(500)

        failed = []
        for hash_, marker in ROUTES:
            await page.evaluate(f"location.hash = '{hash_}'")
            await page.wait_for_timeout(350)
            body = await page.inner_text("#app")
            ok = marker.lower() in body.lower()
            if not ok: failed.append((hash_, marker))
            print(f"{'OK ' if ok else 'FAIL'} {hash_}  (marker: {marker})")
        await page.screenshot(path=f"{OUT}/home.png")

        # interaction: profile form
        await page.evaluate("location.hash='#/signin'")
        await page.wait_for_timeout(250)
        await page.fill("#pf-name", "Maya")
        await page.click("#pf-save")
        await page.wait_for_timeout(400)
        body = await page.inner_text("#app")
        print("OK  signin->dashboard" if "Good" in body and "Maya" in body else "FAIL signin->dashboard")

        # interaction: lesson quiz — fm-1 answers: q0=2, q1=1, q2=1
        await page.evaluate("location.hash='#/lesson/fm-1'")
        await page.wait_for_timeout(400)
        for q, o in [(0, 2), (1, 1), (2, 1)]:
            await page.click(f".option[data-q='{q}'][data-o='{o}']")
        await page.click("#quiz-submit")
        await page.wait_for_timeout(300)
        body = await page.inner_text("#kcheck")
        print("OK  quiz pass" if "Lesson completed" in body else "FAIL quiz pass: " + body[:80].replace("\n", " "))

        # interaction: code lab run
        await page.evaluate("location.hash='#/lab/code-c1'")
        await page.wait_for_timeout(400)
        await page.click("#lab-run")
        await page.wait_for_timeout(800)
        out = await page.inner_text("#lab-out")
        print("OK  code lab ran" if "576" in out else "FAIL code lab: " + out[:100])

        # interaction: SQL lab
        await page.evaluate("location.hash='#/lab/sql-1'")
        await page.wait_for_timeout(300)
        await page.click("#lab-run")
        await page.wait_for_timeout(500)
        out = await page.inner_text("#lab-out")
        print("OK  sql lab" if "row" in out and "Sat" in out else "FAIL sql lab: " + out[:120])

        # interaction: SQL error state
        await page.fill("#lab-code", "SELECT nope FROM sales;")
        await page.click("#lab-run")
        await page.wait_for_timeout(400)
        out = await page.inner_text("#lab-out")
        print("OK  sql error state" if "Unknown column" in out else "FAIL sql error: " + out[:120])

        # interaction: AI lab
        await page.evaluate("location.hash='#/lab/ai-1'")
        await page.wait_for_timeout(300)
        await page.fill("#ai-q", "What are your opening hours?")
        await page.click("#ai-ask")
        await page.wait_for_timeout(300)
        out = await page.inner_text("#ai-out")
        print("OK  ai grounded answer" if "§1" in out else "FAIL ai: " + out[:120])
        await page.fill("#ai-q", "What was your 2019 revenue?")
        await page.click("#ai-ask")
        await page.wait_for_timeout(300)
        out = await page.inner_text("#ai-out")
        print("OK  ai refusal" if "Refusal" in out else "FAIL ai refusal: " + out[:120])

        # interaction: project step tick + checklist gate
        await page.evaluate("location.hash='#/project/p1-1'")
        await page.wait_for_timeout(300)
        await page.click("[data-step='0']")
        await page.wait_for_timeout(250)
        await page.click("#proj-submit")
        await page.wait_for_timeout(250)
        out = await page.inner_text("#proj-msg")
        print("OK  submission gate" if "checklist" in out else "FAIL gate: " + out[:80])

        # interaction: glossary popover
        await page.evaluate("location.hash='#/lesson/fm-6'")
        await page.wait_for_timeout(350)
        await page.click(".glossterm")
        await page.wait_for_timeout(250)
        pop = await page.inner_text("#gloss-pop")
        print("OK  glossary popover" if "Break-even" in pop else "FAIL popover: " + pop[:80])
        await page.click("#gp-x")

        # interaction: topic test
        await page.evaluate("location.hash='#/assessments'")
        await page.wait_for_timeout(300)
        await page.click("[data-take='tt-fm']")
        await page.wait_for_timeout(300)
        for q in range(5):
            await page.click(f"#tt-body .option[data-q='{q}'][data-o='1']")
        await page.click("#tt-submit")
        await page.wait_for_timeout(300)
        body = await page.inner_text("#app")
        print("OK  topic test" if "Result" in body else "FAIL topic test")

        # admin: load sample journey -> weak quiz signals appear
        await page.evaluate("location.hash='#/dashboard'")
        await page.wait_for_timeout(300)
        await page.click("#load-sample")
        await page.wait_for_timeout(400)
        await page.evaluate("location.hash='#/admin'")
        await page.wait_for_timeout(400)
        body = await page.inner_text("#app")
        print("OK  admin analytics" if "Content health" in body and ("%" in body) else "FAIL admin")

        # bookmarks
        await page.evaluate("location.hash='#/lesson/fm-2'")
        await page.wait_for_timeout(300)
        await page.click("#bm-btn")
        await page.wait_for_timeout(250)
        body = await page.inner_text("#app")
        print("OK  bookmark" if "Bookmarked" in body else "FAIL bookmark")
        # notes
        await page.fill("#lesson-notes", "Sample note from smoke test")
        await page.click("#notes-save")
        await page.wait_for_timeout(250)
        body = await page.inner_text("#app")
        print("OK  notes saved" if "Saved" in body else "FAIL notes")

        # mobile 375px overflow check on key routes
        mob = await browser.new_page(viewport={"width": 375, "height": 800})
        await mob.goto(APP)
        await mob.wait_for_timeout(400)
        mob_fail = []
        for hash_ in ["#/", "#/roadmap", "#/lesson/fm-1", "#/dashboard", "#/courses", "#/assessments", "#/admin", "#/maths"]:
            await mob.evaluate(f"location.hash='{hash_}'")
            await mob.wait_for_timeout(300)
            ov = await mob.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            if ov > 2: mob_fail.append((hash_, ov))
        print("mobile overflow issues:", mob_fail if mob_fail else "none")
        await mob.screenshot(path=f"{OUT}/mobile_home.png")

        await browser.close()
    print("\nCONSOLE/PAGE ERRORS:")
    uniq = [e for e in {json.dumps(e) for e in errors}]
    for e in uniq: print(" ", e)
    if not errors: print("  none")

asyncio.run(main())
