import os
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request, send_file
import json
from io import BytesIO
from docx import Document
from services.comparator_service import ComparatorService
from services.extractor_service import ExtractorService
from services.generate_content import generate_copy

# Initialize Flask application
app = Flask(__name__)

# Load environment variables and initialize services
try: 
    load_dotenv()
    
    # Initialize AI services with API keys from environment
    comparator_service = ComparatorService(api_key=os.getenv('GEMINI_API_KEY'))
    extractor_service = ExtractorService(api_key=os.getenv('GEMINI_API_KEY'))
except Exception as e:
    print(f"Error loading environment variables: {e}")
    pass

# ========================================================================
# HTML ROUTE HANDLERS
# ========================================================================

@app.route('/')
def home():
    """Render the main index page for copy generation"""
    return render_template('index.html')

@app.route('/index.html')
def index_alias():
    """Legacy route for index.html compatibility"""
    return render_template('index.html')

@app.route('/copyfile.html')
def copy_file():
    """Render the copyfile page for design generation"""
    return render_template('copyfile.html')

@app.route('/comparefiles.html')
def compare_files():
    """Render the comparefiles page for document comparison"""
    return render_template('comparefiles.html')

# ========================================================================
# API ENDPOINTS - COPY GENERATION
# ========================================================================

@app.route('/api/generate_copy', methods=['POST'])
def generate_copy_route():
    """
    Generate marketing copy from uploaded briefing document
    
    Expected: DOCX file upload via 'doc1' form field
    Returns: JSON with generated copy content
    """
    if 'doc1' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    doc1 = request.files['doc1']
    
    try:
        # Process document and generate copy using AI service
        decoded_output, _ = generate_copy(doc1)
        
        # Return standardized response format for frontend compatibility
        return jsonify({'copy': decoded_output})
    
    except Exception as e:
        return jsonify({'error': f'Failed to generate copy: {str(e)}'}), 500

@app.route('/api/download-copy', methods=['POST'])
def download_copy():
    """
    Download generated copy as DOCX file
    
    Expected: JSON with 'copy' field containing text content
    Returns: DOCX file download
    """
    try:
        data = request.get_json()
        copy_text = data.get('copy', '')
        
        if not copy_text:
            return jsonify({'error': 'No copy content provided'}), 400
        
        # Create Word document with proper formatting
        doc = Document()
        doc.add_heading('Generated Marketing Copy', 0)
        
        # Split content into paragraphs and add to document
        paragraphs = copy_text.split('\n\n')
        for paragraph in paragraphs:
            if paragraph.strip():
                doc.add_paragraph(paragraph.strip())
        
        # Save document to memory buffer for download
        doc_buffer = BytesIO()
        doc.save(doc_buffer)
        doc_buffer.seek(0)
        
        return send_file(
            doc_buffer,
            as_attachment=True,
            download_name='generated-copy.docx',
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        
    except Exception as e:
        return jsonify({'error': f'Error creating DOCX: {str(e)}'}), 500

# ========================================================================
# API ENDPOINTS - DOCUMENT PROCESSING
# ========================================================================

@app.route('/api/extract', methods=['POST'])
def extract():
    """
    Extract and anonymize content from uploaded documents
    
    Expected: Two document files (doc1, doc2) and optional anonymization words
    Returns: JSON with extracted document content and anonymization mapping
    """
    if 'doc1' not in request.files or 'doc2' not in request.files:
        return jsonify({'error': 'Two files required for extraction'}), 400
    
    doc1 = request.files.getlist('doc1')
    doc2 = request.files.getlist('doc2')
    
    # Parse anonymization parameters from form data
    words_to_anonymize = request.form.get('words_to_anonymize', '[]')

    try:
        # Parse JSON string to list, fallback to empty list if invalid
        if isinstance(words_to_anonymize, str):
            words_to_anonymize = json.loads(words_to_anonymize)
    except (json.JSONDecodeError, TypeError):
        words_to_anonymize = []
    
    # Process documents through extraction service
    result = extractor_service.extract_anonymized(
        doc1, doc2, 
        words_to_anonymize=words_to_anonymize
    )
    
    if result['success']:
        return jsonify({
            'docs': result['docs'],
            'mapping': result['mapping']
        })
    else:
        return jsonify({'error': result['error']}), result.get('status_code', 500)

@app.route('/api/compare', methods=['POST'])
def compare():
    """
    Compare two documents with anonymization support
    
    Expected: Two document files, optional anonymization words, and comparison type
    Returns: JSON with comparison results and metrics
    """
    if 'doc1' not in request.files or 'doc2' not in request.files:
        return jsonify({'error': 'Two files required for comparison'}), 400
    
    doc1 = request.files.getlist('doc1')
    doc2 = request.files.getlist('doc2')
    
    # Parse request parameters with defaults
    words_to_anonymize = request.form.get('words_to_anonymize', '[]')  
    comparison_type = request.form.get('comparison_type', 'copy_design')  
    
    try:
        # Safely parse anonymization words list
        if isinstance(words_to_anonymize, str):
            words_to_anonymize = json.loads(words_to_anonymize)
    except (json.JSONDecodeError, TypeError):
        words_to_anonymize = []

    # First, extract anonymized content from both documents
    result = extractor_service.extract_anonymized(
        doc1, doc2, 
        words_to_anonymize=words_to_anonymize
    )

    if result['success']:
        # Then compare the extracted documents using AI comparator service
        comp_result = comparator_service.compare(
            result['docs'][0], 
            result['docs'][1], 
            mapping=result['mapping'],
            comparison_type=comparison_type
        )

        if comp_result['success']:
            return jsonify({
                'result': comp_result['result']
            })
        else:
            return jsonify({'error': comp_result['error']}), comp_result.get('status_code', 500)

    else:
        return jsonify({'error': result['error']}), result.get('status_code', 500)

# ========================================================================
# APPLICATION CONFIGURATION
# ========================================================================

if __name__ == '__main__':
    # Configure application settings
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file upload size
    
    # Run development server
    app.run(debug=True, port=5000)
    # For production deployment, use: app.run(debug=False, host='0.0.0.0', port=5000)