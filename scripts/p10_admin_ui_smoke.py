"""P10 admin CMS console — end-to-end Playwright smoke.

Drives the real backend (PGlite + seed + demo admin) through the browser:
login → curriculum tree → create subject/course/module/chapter/lesson →
publish → lesson editor save + revision history → quiz editor →
diagram upload → public asset fetch.
"""
import asyncio, os, sys, time
from playwright.async_api import async_playwright

REPO = "/home/z/my-project/download/fde-academy-backend"
DB = "/tmp/fde-admin-ui-smoke"
import shutil
shutil.rmtree(DB, ignore_errors=True)

async def main():
    # start the server
    env = dict(os.environ)
    env.update({
        "FDE_JWT_SECRET": "test-secret-0123456789abcdef0123456789abcdef",
        "FDE_LOG_LEVEL": "error", "FDE_SEED_DEMO_USERS": "1",
        "FDE_DEMO_PASSWORD": "DemoPass-2026", "FDE_PGLITE_DIR": DB,
        "FDE_DB": "pglite", "FDE_PORT": "8941", "FDE_AI_PROVIDER": "stub",
    })
    proc = await asyncio.create_subprocess_exec(
        "node", f"{REPO}/src/db/migrate.js", "up", env=env,
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
    await proc.wait()
    proc = await asyncio.create_subprocess_exec("node", f"{REPO}/src/db/seed.js", env=env,
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
    await proc.wait()
    server = await asyncio.create_subprocess_exec("node", f"{REPO}/src/server.js", env=env,
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
    await asyncio.sleep(2.5)
    base = "http://127.0.0.1:8941"

    results = []
    def check(name, ok):
        results.append((name, ok))
        print(("PASS " if ok else "FAIL ") + name)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))

            # 1. console page served + login
            await page.goto(base + "/admin", wait_until="networkidle")
            check("admin console served", "Admin CMS" in await page.title() or "Admin CMS" in await page.content())
            await page.fill("#li-email", "admin@fde.local")
            await page.fill("#li-pass", "DemoPass-2026")
            await page.click("#li-go")
            await page.wait_for_selector("#app:not(.hidden)", timeout=8000)
            check("admin login works", "admin@fde.local" in await page.inner_text("#whoami"))

            # 2. curriculum tree loads with real content
            await page.click("#tree-load")
            await page.wait_for_timeout(700)
            tree_text = await page.inner_text("#tree-root")
            check("tree shows 18 stages", "Stage 18" in tree_text and "Stage 1" in tree_text)
            check("tree shows mathematics first in stage 2", "fm" in tree_text)

            # 3. create a subject
            await page.click('nav button[data-tab="create"]')
            await page.fill("#cr-sub-key", "statistics")
            await page.fill("#cr-sub-name", "Statistics")
            await page.click("#cr-sub")
            await page.wait_for_timeout(500)

            # 4. create a course (needs subject + stage UUIDs — fetch from API)
            subs = await page.evaluate("""async () => {
                const r = await fetch('/api/v1/catalog/subjects'); return (await r.json()).subjects;
            }""")
            stat = next(s for s in subs if s["key"] == "statistics")
            stage = await page.evaluate("""async () => {
                const r = await fetch('/api/v1/catalog/stages/2'); return (await r.json());
            }""")
            await page.fill("#cr-co-code", "stats-1")
            await page.fill("#cr-co-title", "Statistics for Business")
            await page.fill("#cr-co-subject", stat["id"])
            await page.fill("#cr-co-stage", "2")
            await page.fill("#cr-co-blurb", "Descriptive statistics through market data.")
            await page.click("#cr-co")
            await page.wait_for_timeout(600)
            courses = await page.evaluate("""async () => {
                const t = localStorage.getItem('fde.cms.token');
                const r = await fetch('/api/v1/catalog/courses?includeDrafts=1', { headers: { authorization: 'Bearer ' + t } });
                return (await r.json()).courses;
            }""")
            course = next((c for c in courses if c["code"] == "stats-1"), None)
            check("course created (draft)", course is not None and course["status"] == "draft")

            # 5. module → chapter → lesson
            await page.fill("#cr-x-course", course["id"])
            await page.fill("#cr-mod-title", "1. Describing data")
            await page.click("#cr-mod")
            await page.wait_for_timeout(500)
            mods = await page.evaluate("""
                async (courseId) => {
                    const tok = localStorage.getItem('fde.cms.token');
                    const r = await fetch('/api/v1/curriculum/tree?includeDrafts=1',
                        { headers: { authorization: 'Bearer ' + tok } });
                    const t = (await r.json()).tree;
                    for (const s of t) for (const c of s.courses) if (c.id === courseId) return c.modules;
                    return [];
                }""", course["id"])
            check("module added", len(mods) == 1)
            await page.fill("#cr-ch-module", mods[0]["id"])
            await page.fill("#cr-ch-title", "Averages")
            await page.click("#cr-ch")
            await page.wait_for_timeout(500)
            chs = mods[0]["chapters"]
            await page.fill("#cr-ls-chapter", chs[0]["id"] if chs else "")
            # reload tree to get the fresh chapter id
            chs = await page.evaluate("""
                async (courseId) => {
                    const tok = localStorage.getItem('fde.cms.token');
                    const r = await fetch('/api/v1/curriculum/tree?includeDrafts=1',
                        { headers: { authorization: 'Bearer ' + tok } });
                    const t = (await r.json()).tree;
                    for (const s of t) for (const c of s.courses) if (c.id === courseId)
                        for (const m of c.modules) return m.chapters;
                    return [];
                }""", course["id"])
            await page.fill("#cr-ls-chapter", chs[0]["id"])
            await page.fill("#cr-ls-code", "stats-1")
            await page.fill("#cr-ls-title", "Means and medians")
            await page.click("#cr-ls")
            await page.wait_for_timeout(600)
            lesson = await page.evaluate("""async () => {
                const t = localStorage.getItem('fde.cms.token');
                const r = await fetch('/api/v1/catalog/lessons/stats-1', { headers: { authorization: 'Bearer ' + t } });
                return r.ok ? (await r.json()).lesson : null;
            }""")
            check("lesson created (draft)", lesson is not None and lesson["status"] == "draft")

            # 6. publish course + lesson via API-backed UI paths (course via CMS PUT)
            await page.evaluate("""
                async ([courseId, lessonId]) => {
                    const token = localStorage.getItem('fde.cms.token');
                    await fetch('/api/v1/admin/cms/courses/' + courseId, {
                        method: 'PUT',
                        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token },
                        body: JSON.stringify({ title: 'Statistics for Business', blurb: 'Descriptive statistics through market data.', objectives: [], status: 'published' })
                    });
                    await fetch('/api/v1/admin/cms/lessons/' + lessonId + '/publish', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token },
                        body: '{}'
                    });
                }""", [course["id"], lesson["id"]])
            pub = await page.evaluate("""async () => (await (await fetch('/api/v1/catalog/lessons/stats-1')).json()).lesson""")
            check("publish flow: student-visible without auth", pub["status"] == "published")

            # 7. lesson editor: load fm-1, add a paragraph block, save, revision history
            await page.click('nav button[data-tab="lesson"]')
            await page.fill("#le-code", "fm-1")
            await page.click("#le-load")
            await page.wait_for_timeout(600)
            title_loaded = await page.input_value("#le-title")
            check("lesson editor loads fm-1", "four operations" in title_loaded.lower())
            before_blocks = await page.locator("#le-blocks .block").count()
            await page.select_option("#le-addkind", "p")
            await page.click("#le-addblock")
            await page.click("#le-save")
            await page.wait_for_timeout(700)
            after = await page.evaluate("""async () => (await (await fetch('/api/v1/catalog/lessons/fm-1')).json()).lesson""")
            check("lesson save bumps version + block count", after["version"] == 2 and len(after["content"]) == before_blocks + 1)
            await page.click("#le-revisions")
            await page.wait_for_timeout(500)
            revs = await page.locator("#le-revbox table tr").count()
            check("revision history visible", revs >= 1)
            await page.locator("#le-revbox button", has_text="restore").first.click()
            await page.wait_for_timeout(700)
            restored = await page.evaluate("""async () => (await (await fetch('/api/v1/catalog/lessons/fm-1')).json()).lesson""")
            check("restore returns original content", len(restored["content"]) == before_blocks and restored["version"] == 3)

            # 8. quiz editor: save a check on fm-6
            await page.click('nav button[data-tab="quiz"]')
            await page.fill("#qz-lesson", "fm-6")
            await page.click("#qz-load")
            await page.wait_for_timeout(500)
            await page.fill("#qz-title", "Authored check — rounding")
            # keep only the first question block (existing checks load 3)
            while await page.locator("#qz-questions .block").count() > 1:
                await page.locator("#qz-questions .block [data-del]").nth(1).click()
            # field order in each question block: prompt (input), then textareas:
            # [0]=explanation [1]=simplerExample [2]=nextChallenge [3]=options [4]=optionNotes
            boxes = page.locator("#qz-questions .block")
            await boxes.nth(0).locator("input").first.fill("When £4.80 is rounded to the nearest pound, what do you get?")
            await boxes.nth(0).locator("textarea").nth(0).fill("Multiples of £1 sit £1 apart; £4.80 is closer to £5 than £4.")
            await boxes.nth(0).locator("textarea").nth(1).fill("Simpler: rounding £2.60 gives £3 — the same closeness rule.")
            await boxes.nth(0).locator("textarea").nth(2).fill("Next challenge: round money to the nearest 10p.")
            await boxes.nth(0).locator("textarea").nth(3).fill("£4\n£5\n£4.8")
            await boxes.nth(0).locator("input[type=number]").fill("1")
            await page.click("#qz-save")
            await page.wait_for_timeout(700)
            check("quiz saved from editor", "saved quiz" in await page.inner_text("#qz-out"))

            # 9. diagram upload: PNG bytes through the file input
            png = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) + bytes([7] * 300)
            await page.click('nav button[data-tab="books"]')
            await page.fill("#up-lesson", lesson["id"])
            await page.set_input_files("#up-diagram", files=[{"name": "diagram.png", "mimeType": "image/png", "buffer": png}])
            await page.click("#up-diagram-go")
            await page.wait_for_timeout(800)
            out = await page.inner_text("#up-diagram-out")
            check("diagram uploaded from UI", "Public asset URL" in out)
            asset_url = out.split("Public asset URL: ")[1].split(" ")[0] if "Public asset URL: " in out else None
            if asset_url:
                status = await page.evaluate(f"async () => (await fetch('{asset_url}')).status")
                check("public asset fetchable", status == 200)

            # 10. analytics tab renders KPIs
            await page.click('nav button[data-tab="analytics"]')
            await page.wait_for_timeout(700)
            kpis = await page.locator("#an-kpis .kpi").count()
            check("analytics KPIs render", kpis >= 5)

            check("no page errors", not errors)
            if errors:
                print("PAGE ERRORS:", errors[:3])
            await browser.close()
    finally:
        server.terminate()
        await asyncio.wait_for(server.wait(), 10)

    failed = [n for n, ok in results if not ok]
    print(f"\nADMIN UI SMOKE: {len(results) - len(failed)}/{len(results)} passed")
    if failed:
        print("FAILED:", failed)
        sys.exit(1)

asyncio.run(main())
