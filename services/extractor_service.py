from typing import List

from llm.gemini_client import ImageExtractionClient
from services.parser import FileParser
from services.elsa import anonymize_text, deanonymize_dict


SPLITTER = "---|#SPLITTER#|---"  # Used to split text from different documents

class ExtractorService:
    """Service class to handle file upload and comparison logic"""

    def __init__(self, api_key: str):
        self.parser = FileParser(ImageExtractionClient(api_key))

        self.allowed_mime_types = {
            'image/png',
            'image/jpeg', 
            'image/jpg',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
            'application/html',
            'text/html',
            'application/pdf'
        }
        
    def _allowed_file(self, file) -> bool:
        """Check if the file type is allowed based on MIME type"""
        if not file or not file.content_type:
            return False
        return file.content_type in self.allowed_mime_types
    
    def extract_anonymized(self, *docs: List, parse_html=True,
                           words_to_anonymize: List[str] = []) -> dict:
        """
        Process the uploaded files and return comparison results
        
        Args:
            *docs (List): List of file objects for the documents.
            words_to_anonymize (List[str], optional): List of words to anonymize, or None for default anonymization.
        
        Returns:
            dict: JSON with the result of the comparison.
        """
        docs = [item if isinstance(item, list) else [item] for item in docs]
        if not docs or any(not doc for doc in docs):
            return {
                'success': False,
                'error': 'No files selected',
                'status_code': 400
            }
        
        #-------- Process and parse the uploaded files --------#

        texts = []
        for doc in docs:
            result = self._extract(doc, parse_html=parse_html)
            if not result['success']:
                return result
            texts.append(result['result'])

        # -------- Assemble texts together (needs to be anonymized at once..) -------- #
        text_to_anon = SPLITTER.join(texts)

        # -------- Anonymize the text -------- #
        extracted_text, mapping = anonymize_text(text_to_anon, words_to_anonymize)
        
        # -------- Split the anonymized text -------- #
        extracted_texts = extracted_text.split(SPLITTER)

        return {
            'success': True,
            'docs': extracted_texts,
            'mapping': mapping
        }
    
    def _extract(self, doc: List, parse_html=True) -> dict:
        """
        Process the uploaded files and return extracted text
        
        Args:
            doc (List): List of file objects to be processed.
            words_to_anonymize (List[str], optional): List of words to anonymize, or None for default anonymization.
        
        Returns:
            dict: Dictionary with success status and extracted text or error message.
        """
        
        if not doc or all(file.filename == '' for file in doc):
            return {
                'success': False,
                'error': 'No files selected',
                'status_code': 400
            }
        
        extracted_text = ""
        
        for file in doc:
            if file and file.filename != '':
                if self._allowed_file(file):
                    if file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                        # Parse DOCX file
                        extracted_text += self.parser.parse_docx(file) + "\n\n"
                    elif file.content_type in {'application/html', 'text/html'}:
                        # Process HTML: either parse tags or keep raw markup
                        raw_html = file.stream.read().decode('utf-8')
                        content = self.parser.parse_html(file) if parse_html else raw_html
                        extracted_text += f"{content}\n\n"
                    elif file.content_type == 'application/pdf':
                        # Parse PDF file
                        extracted_text += self.parser.parse_pdf(file) + "\n\n"
                    elif file.content_type in {'image/png', 'image/jpeg', 'image/jpg'}:
                        # Parse image file
                        extracted_text += "{ image : " + self.parser.parse_image(file) + '}\n\n'
                    else:
                        return {
                            'success': False,
                            'error': f'Unsupported file type: {file.filename} (MIME type: {file.content_type})',
                            'status_code': 400
                        }
                else:
                    return {
                        'success': False,
                        'error': f'File type not allowed: {file.filename} (MIME type: {file.content_type})',
                        'status_code': 400
                    }
        
        return {
            'success': True,
            'result': extracted_text.strip()
        }