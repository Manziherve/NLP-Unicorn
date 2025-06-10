import asyncio
from playwright.async_api import async_playwright
import os 

async def html_to_pdf():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        html_path = os.path.abspath('index-fr-B2C.html')
        await page.goto('file://' + html_path, wait_until='networkidle')
        await page.pdf(
            path='output_mono.pdf',
            width='210mm',          # Largeur “A4” classique (peut être adapté)
            height='1000mm',        # Mets une très grande valeur ici !
            print_background=True
        )
        await browser.close()

asyncio.run(html_to_pdf())

