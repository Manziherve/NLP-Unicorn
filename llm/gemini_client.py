from google import genai
from google.genai import types
import json
from typing import Dict, List, Union, Optional
from llm.prompt_manager import PromptManager


class GeminiClient:
    """
    A highly customizable wrapper class for Google Gemini API with support for
    various content types and structured responses.
    """
    
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash", **config):
        """
        Initialize the Gemini client with configuration.
        
        Args:
            api_key (str): Google AI API key
            model (str): Gemini model to use (default: "gemini-2.0-flash")
            **config: Additional configuration options:
                - system_instruction (str): System instruction for the model
                - temperature (float): Temperature for response generation (0.0-1.0)
                - top_p (float): Top-p sampling parameter
                - top_k (int): Top-k sampling parameter
                - max_output_tokens (int): Maximum output tokens
                - response_mime_type (str): Response format ('text/plain', 'application/json')
                - response_schema (dict/object): Schema for structured responses
        """
        self.model_name = model
        self.config = {
            'system_instruction': config.get('system_instruction', ''),
            'temperature': config.get('temperature', 0.0),
            'top_p': config.get('top_p', 0.95),
            'top_k': config.get('top_k', 20),
            'max_output_tokens': config.get('max_output_tokens', 8192),
            'response_mime_type': config.get('response_mime_type', 'text/plain'),
            'response_schema': config.get('response_schema', None)
        }
        
        # Initialize the client and prompt manager
        self.client = genai.Client(api_key=api_key)
        self.prompt_manager = PromptManager()


    def _create_generation_config(self, **overrides) -> types.GenerateContentConfig:
        """
        Create a generation config with optional overrides.
        
        Args:
            **overrides: Configuration parameters to override
            
        Returns:
            types.GenerateContentConfig: Configured generation settings
        """
        config = self.config.copy()
        config.update(overrides)
        
        return types.GenerateContentConfig(
            system_instruction=config.get('system_instruction'),
            temperature=config.get('temperature'),
            top_p=config.get('top_p'),
            top_k=config.get('top_k'),
            max_output_tokens=config.get('max_output_tokens'),
            response_mime_type=config.get('response_mime_type'),
            response_schema=config.get('response_schema')
        )
    
    def generate_content(self, 
                        contents: Union[str, List[Union[str, types.Part]]], 
                        **config_overrides) -> str:
        """
        Generate content using the Gemini model with flexible input types.
        
        Args:
            contents: Content to process - can be:
                - str: Simple text prompt
                - List: Mixed content including text and file parts
            **config_overrides: Override default configuration
            
        Returns:
            str: Generated response text or JSON string
        """
        try:
            config = self._create_generation_config(**config_overrides)
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            
            return response.text if response.text else ""
            
        except Exception as e:
            print(f"Error generating content: {str(e)}")
            return ""    
    
    def extract_text_from_file_storage(self, 
                                      file, 
                                      prompt: Optional[str] = None,
                                      structured: bool = False,
                                      **config_overrides) -> Union[str, Dict]:
        """
        Extract text from an image FileStorage object using Gemini Vision API.
        
        Args:
            file: FileStorage object from Flask file upload
            prompt (str, optional): Custom prompt for text extraction
            structured (bool): Return structured JSON response
            **config_overrides: Override default configuration
            
        Returns:
            Union[str, Dict]: Extracted text or structured response
        """
        try:
            # Default prompt for text extraction
            if prompt is None:
                prompt = self.prompt_manager.get_image_extraction_prompt()
            
            # Read image data from FileStorage
            file.seek(0)  # Ensure we're at the beginning
            image_bytes = file.read()
            
            # Create image part using the file's content type
            mime_type = file.content_type or 'image/png'
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            
            # Configure structured response if requested
            if structured:
                config_overrides.update({
                    'response_mime_type': 'application/json',
                    'response_schema': self.prompt_manager.get_image_extraction_schema()
                })
            
            # Generate content
            result = self.generate_content(
                contents=[prompt, image_part],
                **config_overrides
            )
            
            return json.loads(result) if structured and result else result
            
        except Exception as e:
            print(f"Error extracting text from FileStorage {file.filename}: {str(e)}")
            return {} if structured else ""

    def compare_texts(self, 
                     text1: str, 
                     text2: str,
                     comparison_type: str = "copy_design",
                     structured: bool = True,
                     **config_overrides) -> Union[str, Dict]:
        """
        Compare two texts using customizable comparison criteria.
        
        Args:
            text1 (str): First text to compare
            text2 (str): Second text to compare  
            comparison_type (str): Type of comparison:
                - "copy_design": Commercial document validation
                - "semantic": Semantic similarity analysis
                - "brief_copy": Factual accuracy check
            structured (bool): Return structured JSON response            
            **config_overrides: Override default configuration
            
        Returns:
            Union[str, Dict]: Comparison analysis
        """
        try:
            # Get prompt and schema from prompt manager
            prompt = self.prompt_manager.get_comparison_prompt(comparison_type, text1, text2)

            # Configure structured response if requested
            if structured:
                schema = self.prompt_manager.get_comparison_schema(comparison_type)
                config_overrides.update({
                    'response_mime_type': 'application/json',
                    'response_schema': schema
                })

            # Generate comparison
            result = self.generate_content(
                contents=prompt,
                **config_overrides
            )
            
            return json.loads(result) if structured and result else result
            
        except Exception as e:
            print(f"Error comparing texts: {str(e)}")
            return {} if structured else ""
        
    def generate_design(self, 
                     copy: str, 
                     examples: Optional[str] = None,
                     language : Optional[str] = "FR",
                     structured: bool = True, 
                     **config_overrides) -> Union[str, Dict]:
        """
        Generate HTML design based on a marketing brief.
        
        Args:
            copy (str): Text-based structure file for design generation
            structured (bool): Return structured JSON response
            **config_overrides: Override default configuration
            
        Returns:
            Union[str, Dict]: Generated HTML design or structured response
        """
        try:
            # Get prompt for design generation
            prompt = self.prompt_manager.get_design_generation_prompt(copy, examples=examples, language=language)

            # Generate design content
            result = self.generate_content(
                contents=prompt,
                **config_overrides
            )
            
            return json.loads(result) if structured and result else result
            
        except Exception as e:
            print(f"Error generating design: {str(e)}")
            return {} if structured else ""


#----------------Specialized client classes for specific use cases-------------------#

class ImageExtractionClient(GeminiClient):
    """Specialized client for image text extraction with optimized defaults."""
    
    def __init__(self, api_key: str, **config):
        """Initialize with image extraction optimized settings."""
        default_config = {
            'system_instruction': "Extract only the raw text content visible in images. Return text without explanations or commentary.",
            'temperature': 0.0,
            'response_mime_type': 'application/json'
        }
        default_config.update(config)
        super().__init__(api_key, **default_config)
    
    def extract(self, file, custom_prompt: Optional[str] = None) -> Dict:
        """Simplified extraction method for FileStorage objects with structured output."""
        return self.extract_text_from_file_storage(
            file=file,
            prompt=custom_prompt,
            structured=True
        )


class DocumentComparatorClient(GeminiClient):
    """Specialized client for document comparison with commercial validation focus."""
    
    def __init__(self, api_key: str, **config):
        """Initialize with document comparison optimized settings."""
        default_config = {
            'system_instruction': """You are a senior commercial design validator ensuring client deliverables meet marketing standards. 
                
                Compare copy (marketing blueprint) vs design (client deliverable) and validate:
                - Business messaging alignment
                - Pricing/promotional accuracy 
                - Legal compliance
                - Customer experience consistency
                
                Focus on commercial impact.
                
                Always respond in FRENCH. Répond toujours en FRANÇAIS.
            """,
            'temperature': 0.1,
            'response_mime_type': 'application/json'
        }
        default_config.update(config)
        super().__init__(api_key, **default_config)
    
    def validate_documents(self, text1: str, text2: str, comparison_type: str) -> Dict:
        """Simplified commercial document validation."""
        return self.compare_texts(
            text1=text1,
            text2=text2,
            comparison_type=comparison_type,
            structured=True
        )

class DesignGeneratorClient(GeminiClient):
    """Specialized client for generating design content based on marketing briefs."""
    
    def __init__(self, api_key: str, **config):
        """Initialize with design generation optimized settings."""
        default_config = {
            'system_instruction': """You are an expert HTML designer specializing in commercial layouts. Your task is to transform a provided text-based structure file into a complete, well-structured, and visually appealing HTML commercial design.

                **Design Guidelines:**

                * **Color Palette:**
                    * `#ff7900` (Orange): Use for all titles (`<h1>`, `<h2>`, etc.), button backgrounds, and to highlight important text (e.g., using `<strong>` or a `<span>` with inline style).
                    * `#000000` (Black): Use for section backgrounds (e.g., the disclaimer part) and for default text color on non-black backgrounds.
                    * `#e5e5e5` (Gray): Use for section backgrounds.
                    * `#FFFFFF` (White): Use for section backgrounds.
                * **Text Color on Backgrounds:**
                    * If the background color of a section is black (`#000000`), the text color within that section *must* be white (`#FFFFFF`).
                    * Otherwise, the default text color is black (`#000000`).
                * **Structure Interpretation:**
                    * Pay close attention to the hierarchy and intent implied by the structure file. Use appropriate HTML semantic tags (e.g., `<header>`, `<nav>`, `<section>`, `<footer>`, `<h1>`-`<h6>`, `<p>`, `<a>`, `<img>`, `<button>`, `<ul>`, `<ol>`, `<li>`, `<div>`).
                    * Ensure proper nesting and closing of all HTML tags.
                    * Generate clean, readable, and well-commented HTML code.
                    * Assume all necessary CSS will be embedded within a `<style>` block in the `<head>` of the HTML document. Do not create external CSS files.
                    * For images, use placeholder URLs if specific image paths are not provided in the structure (e.g., `https://via.placeholder.com/X`).

                **Interaction Flow:**

                You will first receive a few example "shots." Each shot will consist of the corresponding "HTML Result" generated from the structure file

                After these examples, you will receive the final "Structure File" from the user for which you need to generate the HTML design.

                **Your response should ONLY be the complete and WORKING HTML code in Plain Text.**
                - AVOID useless '\\n' everywhere in the HTML code, just make it inline.
                - Avoid ```html tags or any other code formatting.
                - Do not include any conversational text or explanations outside of the HTML structure itself.
                
                Please answer in the language requested in the prompt
            """,
            'temperature': 0.3,
            'response_mime_type': 'text/plain'
        }
        default_config.update(config)
        super().__init__(api_key, **default_config)
    
    def generate(self, copy: str, examples: Optional[str] = None, language : Optional[str] = "FR") -> Dict:
        """Simplified design generation method."""
        return self.generate_design(
            copy=copy,
            examples=examples,
            language=language,
            structured=False
        )

# class SemanticAnalyzerClient(GeminiClient):
#     """Specialized client for semantic analysis and similarity checking."""
    
#     def __init__(self, api_key: str, **config):
#         """Initialize with semantic analysis optimized settings."""
#         default_config = {
#             'system_instruction': "Analyze semantic meaning, intent, and conceptual relationships between texts. Focus on understanding rather than surface-level matching.",
#             'temperature': 0.2,
#             'response_mime_type': 'application/json'
#         }
#         default_config.update(config)
#         super().__init__(api_key, **default_config)
    
#     def analyze_similarity(self, text1: str, text2: str) -> Dict:
#         """Simplified semantic similarity analysis."""
#         return self.compare_texts(
#             text1=text1,
#             text2=text2,
#             comparison_type="semantic",
#             structured=True
#         )
