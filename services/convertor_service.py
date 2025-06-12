from playwright.async_api import async_playwright
from pathlib import Path
import zipfile, tempfile, shutil

class ConvertorService:
    """Convertion service class to handle file upload and conversion HTML -> PDF.

    Using this service requires a ZIP FILE from the user containing the HTML and 
    the ‘img’ folder with the images contained in the HTML.
    To do this, the user has to select the HTML and the img folder -> right-click 
    -> 'send to' -> 'compressed folder'.
    """

    def __init__(self):
        self.allowed_mime_types = {'application/zip'}
        
    def _allowed_file(self, file) -> bool:
        """Check if the file type is allowed based on MIME type"""
        if not file or not file.content_type:
            return False
        return file.content_type in self.allowed_mime_types
        
    async def html_to_pdf(self, zip_path : str, output_pdf : str):
        # Dezip the folder 
        temp_directory = tempfile.mkdtemp()
        with zipfile.ZipFile(zip_path, 'r') as z:
            file_names = z.namelist()
            html_file = [n for n in file_names if n.lower().endswith('.html')]
            if len(html_file) != 1:
                shutil.rmtree(temp_directory)
                raise ValueError(f"Le ZIP ne doit contenir qu'un seul fichier HTML, vous en avez rentrés {len(html_file)}")
            
            html_name = html_file[0]
            z.extractall(temp_directory)

        # In the dezipped folder, we search for the html file
        html_path = Path(temp_directory) / html_name
        if not html_path.exists():
            shutil.rmtree(temp_directory)
            raise FileNotFoundError(f"Le fichier {html_name} est introuvable")
        
        URL_file = html_path.resolve().as_uri()

        # Launch playwright with a baseURL pointing to the folder
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            await page.goto(
                URL_file, 
                wait_until='networkidle',
                )

            pdf = await page.pdf(
                path= output_pdf,
                width='210mm',          
                height='1000mm',        
                print_background=True
            )

            await browser.close()

        shutil.rmtree(temp_directory) # Erasing the temporary directory
        return pdf

