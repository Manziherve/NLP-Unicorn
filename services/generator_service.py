from llm.gemini_client import DesignGeneratorClient
from services.elsa import deanonymize_text

class GeneratorService:
    """Service class to handle file upload and comparison logic"""

    def __init__(self, api_key: str):
        self.design_generator = DesignGeneratorClient(api_key)
        # try:
        #     with open('generate_design_examples.txt', 'r', encoding='utf-8') as file:
        #         self.examples = file.read()
        # except FileNotFoundError:
        #     print("Warning: generate_design_examples.txt not found")
        #     self.examples = ""

    def generate(self, text: str, mapping: dict, examples: str, generation_type: str = "design", language : str = "FR") -> dict:
        """
        Process the uploaded files and return comparison results
        
        Args:
            text (str): document text.
            mapping (dict): Mapping of anonymized tokens to original values.
            generation_type (str): Type of comparison to perform (e.g., "design", "copy").
            language (str): Language response (french or flemmish)
        
        Returns:
            dict: JSON with the result of the comparison.
        """

        if language == "FR":
            language = 'FRENCH'
        else:
            language = "FLEMISH"
    
        # -------- Compare the copy and design content --------#
        anon_generated = self.design_generator.generate(text, examples, language)#, self.examples)
        
        # -------- Deanonymize the llm output -------- #
        return deanonymize_text(anon_generated, mapping)