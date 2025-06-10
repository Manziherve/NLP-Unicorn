
from services.elsa import deanonymize_text
from llm.gemini_client import GeminiClient
from services.extractor_service import ExtractorService

import io, os, mimetypes
from werkzeug.datastructures import FileStorage
from pathlib import Path
from dotenv import load_dotenv

#--------------------------------------------
#--------------------------------------------
#--------------------------------------------

def make_filestorage_from(path):

    with open(path, "rb") as f:
        data = f.read()

    stream = io.BytesIO(data)

    filename = os.path.basename(path)
    content_type, _ = mimetypes.guess_type(path)
    content_type = content_type or "application/octet-stream"

    return FileStorage(stream=stream,
                       filename=filename,
                       content_type=content_type)

#--------------------------------------------
#--------------------------------------------
#--------------------------------------------

def generate_copy(user_file_path=None):

    if user_file_path is None:
        raise ValueError("Vous devez fournir le chemin vers un fichier DOCX à generate_copy().")

    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')

    config = { # CONFIG PAR DEFAUT DE GEMINI
        'system_instruction': 
            'Generate content based on the provided input.',
        'temperature': 1.0,
        'top_p': 0.95,
        'top_k': 40,
        'max_output_tokens': 8192,
        'response_mime_type': 'text/plain',
        'response_schema': None
        }
    
    model = GeminiClient(api_key, **config)

    extractor = ExtractorService(api_key)

    #--------------------------------------------
    #--------------------------------------------
    #--------------------------------------------

    example_fs = [make_filestorage_from(str(p)) 
                  for p in Path("model_templates/copy").glob("*.docx")]

    user_fs = make_filestorage_from(user_file_path)

    result = extractor.extract_anonymized(
        *example_fs, user_fs, parse_html=False)
    
    if not result['success']:
        raise RuntimeError(f"Extraction error: {result['error']}")

    docs = result['docs']
    mapping = result['mapping']

    #--------------------------------------------
    #--------------------------------------------
    #--------------------------------------------

    prompt = "Basé sur les exemples suivants :\n"
    for idx, example in enumerate(docs[:-1], start=1):
        prompt += f"Exemple {idx} :\n{example}\n---\n"
    prompt += f"À partir du rapport de briefing suivant :\n{docs[-1]}\n"
    prompt += "Génère un template pour l'équipe graphique équivalent aux exemples fournis, uniquement pour le public francophone."

    generated_output = model.generate_content(prompt)

    #--------------------------------------------
    #--------------------------------------------
    #--------------------------------------------

    generated_output = generated_output.replace('KEYWORD_', 'MOTCLE_')
    decode_output = deanonymize_text(generated_output, mapping)
    return decode_output, generated_output


if __name__ == "__main__":

    docx_file = "brief_test.docx"
    if not os.path.isfile(docx_file):
        print(f"❌ Le fichier '{docx_file}' n'existe pas.")
        exit(1)
        
    decode_output, generated_output = generate_copy(docx_file)

    with open('generated_output.txt', 'w', encoding='utf-8') as f:
        f.write(generated_output)

    # Vérifier si la désanonymisation a fonctionné
    if decode_output != generated_output:
        print("✅ Désanonymisation réussie")
        with open('decoded_output.txt', 'w', encoding='utf-8') as f:
            f.write(decode_output)
    else:
        print("❌ Aucun changement lors de la désanonymisation")