from typing import List

from llm.gemini_client import DocumentComparatorClient
from services.elsa import deanonymize_dict

class ComparatorService:
    """Service class to handle file upload and comparison logic"""

    def __init__(self, api_key: str):
        self.comparator = DocumentComparatorClient(api_key)

    def compare(self, text1: str, text2: str, mapping: dict, comparison_type: str = "copy_design") -> dict:
        """
        Process the uploaded files and return comparison results
        
        Args:
            text1 (str): first document text.
            text2 (str): second document text.
            mapping (dict): Mapping of anonymized tokens to original values.
            comparison_type (str): Type of comparison to perform (e.g., "copy_design", "brief_copy").
        
        Returns:
            dict: JSON with the result of the comparison.
        """

        # -------- Compare the copy and design content --------#
        anon_report = self.comparator.validate_documents(text1, text2, comparison_type)

        # -------- Deanonymize the llm output -------- #
        report = deanonymize_dict(anon_report, mapping)

        return {
            'success': True,
            'result': report
        }