"""Render the ER diagram HTML to docs/ER.png (per charts skill Playwright rules)."""
import asyncio, os
from playwright.async_api import async_playwright

HTML = "/home/z/my-project/scripts/p9_er/er.html"
OUT = "/home/z/my-project/download/fde-academy-backend/docs/ER.png"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1460, "height": 900}, device_scale_factor=1.5)
        await page.goto(f"file://{HTML}", wait_until="networkidle")
        await page.wait_for_timeout(400)
        el = page.locator("#root")
        bbox = await el.bounding_box()
        if bbox:
            await page.set_viewport_size({"width": max(1460, int(bbox["width"] + 60)), "height": int(bbox["height"] + 60)})
            await page.wait_for_timeout(200)
        await el.screenshot(path=OUT)
        await browser.close()
    print(f"written {OUT} ({os.path.getsize(OUT)/1024:.0f} KB)")

asyncio.run(main())
