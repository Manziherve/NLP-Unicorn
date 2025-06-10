from bs4 import BeautifulSoup
import re
import hashlib

#--------------------------------------------
#--------------- Elsa Function --------------
#--------------------------------------------

# "ID" FOR ANONYMIZED WORDS
def make_placeholder(label, value):
    hx = hashlib.md5(value.lower().encode()).hexdigest()[:6]
    return f"[{label}_{hx}]"

# ANONYMIZATION
def anonymize_text(text, keywords=[]):
    mapping = {}
    
    keywords = keywords + ["Smart Data", "VOO", "Orange Mobile",
        "Go Light", "Go Plus", "Go Intense", "Go Extreme",
        "Avenue", "Diane Ickowicz", "d'Orange",
        "0800 35 757", "0800 355 32", "5000", "0800", 
        "Fiber", "Start Fiber", "Zen Fiber", "Giga Fiber",
        "Sosh", "Telenet", "Proximus", "Zen", "Giga",
        "hey!", "B2B", "Love & Home", "Home", "Love", 
        "Orange Satellite", "Nordnet", "satellite", 
        "IT Roumanie", "Flybox", "Soho",
        "terminaison coaxiale", "coaxiale",
        "Orange SA", "MyOrange", "ORANGE Belgium", 
        "My Orange", "Orange Thank You", "Orange", "ORANGE",]
    
    if keywords:
        variants = sorted(keywords, key=len, reverse=True)

        for word in variants:
            escaped = re.escape(word)
            pattern = rf'(?<![A-Za-z]){escaped}(?![A-Za-z])'

            def repl_keyword(match):
                found = match.group(0)
                token = make_placeholder("MOTCLE", found)
                mapping[token] = found
                return token

            text = re.sub(pattern, repl_keyword, text, flags=re.IGNORECASE)


    # ADRESS
    address_pattern = r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,?\s+\d+\s*,\s*\d{4}\s+[A-Z][a-z]+)\b'
    
    def repl_addr(match):
        value = match.group(0).strip()

        token = make_placeholder("ADRESSE", value)
        mapping[token] = value

        return token
    
    text = re.sub(address_pattern, repl_addr, text, flags=re.IGNORECASE)
    
    # TELEPHONE NUMBER
    def repl_phone(match):
        value = match.group(0)
        token = make_placeholder("TEL", value)
        mapping[token] = value
        return token
    
    phone_pattern = r'(?:\+|00)\d{1,3}[\s\-]?(?:\d{1,2}[\s\-]?){4,6}\d{2,4}|\b0\d([ \-]?\d{2}){4,5}'
    text = re.sub(phone_pattern, repl_phone, text)    
    
    # -----------------------------------
    # DATE anonymization (format dd/mm/yyyy or dd-mm-yyyy or d/m/yy, etc.)
    def repl_date(match):
        value = match.group(0)

        token = make_placeholder("DATE", value)
        mapping[token] = value

        return token
    
    date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    text = re.sub(date_pattern, repl_date, text)    
    
    # -----------------------------------
    # NUMBER anonymization (any standalone integer)
    def repl_number(match):
        value = match.group(0)

        token = make_placeholder("NUMERO", value)
        mapping[token] = value

        return token
    
    number_pattern = r'\b\d+\b'
    text = re.sub(number_pattern, repl_number, text)

    # COMPANY SUFFIX
    def repl_company(match):
            value = match.group(0).strip(", ")

            token = make_placeholder("ENTR", value)
            mapping[token] = value

            return token + ("," if match.group(0).strip().endswith(",") else "")
    
    company_pattern = r'\b[A-Z][\w\s\'\-\.&]*\s+(?:s\.a\.|sas|sarl|inc|ltd|llc|sprl|asbl|gmbh|nv|bvba)\b[,]?'
    text = re.sub(company_pattern, repl_company, text, flags=re.IGNORECASE)

    return text, mapping

# De-anonymisation 
def deanonymize_text(anon_text, mapping):
    """
    Remplace tous les tokens anonymisés dans le texte par leur valeur d'origine via le mapping.
    """
    deanonymized = anon_text
    for token in sorted(mapping, key=len, reverse=True):
        deanonymized = deanonymized.replace(token, mapping[token])
    return deanonymized

def deanonymize_dict(obj, mapping):
    """
    Recursive function to deanonymize a dictionary with strings in nested elements.
    """
    
    if isinstance(obj, dict):
        return {key: deanonymize_dict(value, mapping) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [deanonymize_dict(item, mapping) for item in obj]
    elif isinstance(obj, str):
        return deanonymize_text(obj, mapping)
    else:
        return obj

#--------------------------------------------
#----------------- Elsa Main ----------------
#--------------------------------------------

if __name__ == "__main__":

    # HTML IMPORT
    fichier_html = "index-fr-OG-contest.html"
    with open(fichier_html, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")
        all_text = soup.get_text(separator=" ", strip=True)

    # Anonymisation
    anon, mapping = anonymize_text(all_text, keywords=["Samsung"])

    with open("anon.txt", "w", encoding="utf-8") as f:
        f.write(anon)
    deano = deanonymize_text(anon, mapping)

    with open("deanon.txt", "w", encoding="utf-8") as f:
        f.write(deano)


