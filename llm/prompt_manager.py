from typing import Dict, Any
from abc import ABC, abstractmethod


class BasePromptTemplate(ABC):
    """Base class for prompt templates."""
    
    @abstractmethod
    def get_prompt(self, **kwargs) -> str:
        """Get the formatted prompt."""
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """Get the response schema for this prompt type."""
        pass


class CommercialComparisonPrompt(BasePromptTemplate):
    """Template for commercial document comparison."""
    
    def get_prompt(self, text1: str, text2: str) -> str:
        return """
        You are a senior french commercial design validator responsible for ensuring client deliverables meet marketing requirements.
        
        VALIDATION CONTEXT:
        - COPY document: Base marketing blueprint with all business requirements and structure
        - DESIGN document: Final client-facing deliverable (HTML/PDF/SMS)
        - Images in design contain critical pricing/promotional information
        
        VALIDATION CRITERIA:
        ✅ Marketing concepts & messaging alignment
        💰 Pricing accuracy (including promotional offers)
        📋 Legal disclaimers completeness
        🎯 Call-to-action consistency
        📱 Contact information accuracy
        🖼️ Image content integration
        
        COPY DOCUMENT (Marketing Blueprint):
        {copy_text}

        DESIGN DOCUMENT (Client Deliverable):
        {design_text}

        Provide comprehensive validation analysis focusing on commercial accuracy and client experience.
        """.format(copy_text=text1, design_text=text2)
    
    def get_schema(self) -> Dict[str, Any]:
        base_schema = {
            "type": "object",
            "properties": {
                "content_blocks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "block_name": {
                                "type": "string",
                                "description": "Content section identifier"
                            },
                            "copy_requirements": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Key requirements from copy document"
                            },
                            "design_implementation": {
                                "type": "array", 
                                "items": {"type": "string"},
                                "description": "How it's implemented in design"
                            },
                            "validation_status": {
                                "type": "string",
                                "enum": ["✅ Valide", "⚠️ Problèmes mineures", "❌ Non conforme"],
                                "description": "Block validation result"
                            },
                            "validator_notes": {
                                "type": "string",
                                "description": "Detailed validation feedback"
                            }
                        },
                        "required": ["block_name", "copy_requirements", "design_implementation", "validation_status", "validator_notes"]
                    }
                },
                "commercial_validation": {
                    "type": "object",
                    "properties": {
                        "pricing_accuracy": {
                            "type": "object",
                            "properties": {
                                "status": {"type": "string", "enum": ["✅ Précis", "⚠️ Petites erreurs", "❌ Erreurs majeures"]},
                                "findings": {"type": "array", "items": {"type": "string"}}
                            },
                            "required": ["status", "findings"]
                        },
                        "promotional_offers": {
                            "type": "object",
                            "properties": {
                                "status": {"type": "string", "enum": ["✅ Consitent", "⚠️ Problème mineur", "❌ Inconsistent"]},
                                "findings": {"type": "array", "items": {"type": "string"}}
                            },
                            "required": ["status", "findings"]
                        },
                        "legal_disclaimers": {
                            "type": "object", 
                            "properties": {
                                "status": {"type": "string", "enum": ["✅ Complet", "⚠️ Partiel", "❌ Incorrect"]},
                                "findings": {"type": "array", "items": {"type": "string"}}
                            },
                            "required": ["status", "findings"]
                        }
                    },
                    "required": ["pricing_accuracy", "promotional_offers", "legal_disclaimers"]
                },
                "similarity_score": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100,
                    "description": "Commercial validation score (0-100)"
                }
            },
            "required": ["content_blocks", "commercial_validation", "similarity_score"]
        }
        
        return base_schema	

class SemanticComparisonPrompt(BasePromptTemplate):
    """Template for semantic similarity analysis."""
    
    def get_prompt(self, text1: str, text2: str) -> str:
        return """
        Analyze the semantic similarity and meaning relationship between these two texts:

        TEXT 1:
        {text1}

        TEXT 2:
        {text2}

        Focus on meaning, intent, and conceptual overlap rather than exact wording.
        """.format(text1=text1, text2=text2)
    
    def get_schema(self) -> Dict[str, Any]:
        base_schema = {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "Executive summary of the comparison"
                },
                "similarity_score": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100,
                    "description": "Overall similarity score (0-100)"
                },
                "semantic_analysis": {
                    "type": "object",
                    "properties": {
                        "conceptual_overlap": {
                            "type": "string",
                            "description": "Analysis of shared concepts and themes"
                        },
                        "intent_similarity": {
                            "type": "string",
                            "enum": ["IDENTICAL", "SIMILAR", "DIFFERENT", "CONTRADICTORY"]
                        },
                        "key_differences": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["conceptual_overlap", "intent_similarity", "key_differences"]
                }
            },
            "required": ["summary", "similarity_score", "semantic_analysis"]
        }
        return base_schema


class FactualComparisonPrompt(BasePromptTemplate):
    """Template for factual accuracy checking."""
    
    def get_prompt(self, text1: str, text2: str) -> str:
        return """
        Check the factual consistency and accuracy between these two texts:

        REFERENCE TEXT (assumed accurate):
        {text1}

        TEXT TO VERIFY:
        {text2}

        Identify any factual discrepancies, inconsistencies, or potential errors.
        """.format(text1=text1, text2=text2)
    
    def get_schema(self) -> Dict[str, Any]:
        base_schema = {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "Executive summary of the comparison"
                },
                "similarity_score": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100,
                    "description": "Overall similarity score (0-100)"
                },
                "discrepancies": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "category": {"type": "string"},
                            "description": {"type": "string"},
                            "severity": {"type": "string", "enum": ["Basse", "Intermédiaire", "Haute"]}
                        },
                        "required": ["category", "description", "severity"]
                    }
                },
                "verified_facts": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["summary", "similarity_score", "discrepancies", "verified_facts"]
        }
        return base_schema


class ImageExtractionPrompt(BasePromptTemplate):
    """Template for image text extraction."""

    def get_prompt() -> str:
        return ("Extract all text content from this image. Include all visible text, "
                "preserving the layout and structure as much as possible. If there are "
                "tables, format them clearly. If there are prices, promotions, or "
                "special offers, make sure to include them.")
 
    def get_schema() -> Dict[str, Any]:
        return {
            "type": "string"
        }

class DesignGenerationPrompt(BasePromptTemplate):
    """Template for generating design content based on copy."""
    
    def get_prompt(self, copy_text: str, examples: str, language:str) -> str:
        return """
        - Examples of generated design content:

        {examples}

        - COPY DOCUMENT (Marketing Blueprint):
        
        {copy_text}

        Ensure the design aligns with the brand guidelines and effectively communicates the marketing message.
        Always responds in {language}
        """.format(copy_text=copy_text, examples=examples, language=language)
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "string"
        }

class PromptManager:
    """Central manager for all prompt templates."""
    
    def __init__(self):
        self._templates = {
            "copy_design": CommercialComparisonPrompt(),
            "semantic": SemanticComparisonPrompt(),
            "brief_copy": FactualComparisonPrompt()
        }

    #--------------------------------------------------
    
    def get_comparison_prompt(self, comparison_type: str, text1: str, text2: str) -> str:
        """Get formatted comparison prompt by type."""

        template = self._templates[comparison_type]
        return template.get_prompt(text1=text1, text2=text2)
    
    def get_comparison_schema(self, comparison_type: str) -> Dict[str, Any]:
        """Get response schema by comparison type."""
        
        template = self._templates[comparison_type]
        return template.get_schema()
    
    #--------------------------------------------------
    
    def get_design_generation_prompt(self, copy_text: str, examples: str, language : str) -> str:
        """Get design generation prompt based on copy text."""
        return DesignGenerationPrompt().get_prompt(copy_text=copy_text, examples=examples, language=language)
    
    def get_design_generation_schema(self) -> Dict[str, Any]:
        """Get design generation response schema."""
        return DesignGenerationPrompt().get_schema()

    #--------------------------------------------------

    def get_image_extraction_prompt(self) -> str:
        """Get image extraction prompt."""
        return ImageExtractionPrompt.get_prompt()
    
    def get_image_extraction_schema(self) -> Dict[str, Any]:
        """Get image extraction schema."""
        return ImageExtractionPrompt.get_schema()
