"""Render diagram and wireframe HTML files to PNG via Playwright.

Follows charts skill: device_scale_factor=2, viewport auto-fit to content.
"""
import asyncio
import os
import sys
from playwright.async_api import async_playwright

HTML_DIR = "/home/z/my-project/scripts/fde_design/html"
OUT = "/home/z/my-project/download/fde_design"
os.makedirs(OUT + "/diagrams", exist_ok=True)
os.makedirs(OUT + "/wireframes", exist_ok=True)

JOBS = [
    # (html file, out path, selector, viewport width, scale)
    ("diag_sitemap.html", OUT + "/diagrams/sitemap.png", "#mindmap", 1900, 1.5),
    ("roadmap.html", OUT + "/diagrams/roadmap_18_stages.png", "#root", 1160, 2),
    ("journey_beginner.html", OUT + "/diagrams/journey_beginner.png", "#root", 1040, 2),
    ("journey_daily.html", OUT + "/diagrams/journey_daily.png", "#root", 1040, 2),
    ("journey_book.html", OUT + "/diagrams/journey_book.png", "#root", 1040, 2),
    ("journey_project.html", OUT + "/diagrams/journey_project.png", "#root", 1040, 2),
    ("journey_admin.html", OUT + "/diagrams/journey_admin.png", "#root", 1040, 2),
    ("architecture.html", OUT + "/diagrams/architecture.png", "#root", 1380, 2),
    ("erd.html", OUT + "/diagrams/erd.png", "#root", 1460, 2),
    ("wf_home.html", OUT + "/wireframes/wf_home.png", "#page", 1440, 1),
    ("wf_roadmap.html", OUT + "/wireframes/wf_roadmap.png", "#page", 1440, 1),
    ("wf_courses.html", OUT + "/wireframes/wf_courses.png", "#page", 1440, 1),
    ("wf_course_detail.html", OUT + "/wireframes/wf_course_detail.png", "#page", 1440, 1),
    ("wf_books.html", OUT + "/wireframes/wf_books.png", "#page", 1440, 1),
    ("wf_book_detail.html", OUT + "/wireframes/wf_book_detail.png", "#page", 1440, 1),
    ("wf_lab.html", OUT + "/wireframes/wf_lab.png", "#page", 1440, 1),
    ("wf_project.html", OUT + "/wireframes/wf_project.png", "#page", 1440, 1),
    ("wf_assessment.html", OUT + "/wireframes/wf_assessment.png", "#page", 1440, 1),
    ("wf_glossary.html", OUT + "/wireframes/wf_glossary.png", "#page", 1440, 1),
    ("wf_dashboard.html", OUT + "/wireframes/wf_dashboard.png", "#page", 1440, 1),
    ("wf_career.html", OUT + "/wireframes/wf_career.png", "#page", 1440, 1),
    ("wf_admin.html", OUT + "/wireframes/wf_admin.png", "#page", 1440, 1),
    ("wf_mobile_home.html", OUT + "/wireframes/wf_mobile_home.png", "#page", 420, 2),
    ("wf_mobile_dashboard.html", OUT + "/wireframes/wf_mobile_dashboard.png", "#page", 420, 2),
]


async def render_one(browser, html_file, out_path, selector, width, scale):
    page = await browser.new_page(viewport={"width": width, "height": 900},
                                  device_scale_factor=scale)
    await page.goto(f"file://{HTML_DIR}/{html_file}", wait_until="networkidle")
    await page.wait_for_timeout(400)
    el = page.locator(selector)
    bbox = await el.bounding_box()
    if bbox:
        fit_w = max(width, int(bbox["width"] + 60))
        fit_h = int(bbox["height"] + 60)
        await page.set_viewport_size({"width": fit_w, "height": fit_h})
        await page.wait_for_timeout(250)
        if "drawAllLines" in await page.content():
            await page.evaluate("if (typeof drawAllLines === 'function') drawAllLines()")
            await page.wait_for_timeout(250)
    await el.screenshot(path=out_path)
    await page.close()
    print(f"rendered {os.path.basename(out_path)} "
          f"({os.path.getsize(out_path)/1024:.0f} KB)")


async def main(only=None):
    jobs = [j for j in JOBS if not only or j[0] in only]
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for job in jobs:
            if not os.path.exists(os.path.join(HTML_DIR, job[0])):
                print("MISSING HTML:", job[0])
                continue
            try:
                await render_one(browser, *job)
            except Exception as e:
                print("FAILED", job[0], repr(e))
        await browser.close()


if __name__ == "__main__":
    only = sys.argv[1:] or None
    asyncio.run(main(only))
