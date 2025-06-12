/**
 * Main JavaScript file for NLP Copy Generation Application
 * Handles copy generation, file upload, content display, and UI interactions
 */

// ========================================================================
// GLOBAL VARIABLES AND INITIALIZATION
// ========================================================================

let currentBriefing = '';
let currentCopy = '';
let originalGeneratedCopy = ''; // Copy originale générée
let isGenerating = false;
let hasUnsavedChanges = false; // État des modifications

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeUI();
});

// ========================================================================
// EVENT LISTENERS INITIALIZATION
// ========================================================================

function initializeEventListeners() {
    // File upload handling
    const briefingFileInput = document.getElementById('briefingFileInput');
    if (briefingFileInput) {
        briefingFileInput.addEventListener('change', handleFileUpload);
    }

    // Copy generation button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateCopy);
    }

    // Copy textarea changes
    const generatedCopy = document.getElementById('generatedCopy');
    if (generatedCopy) {
        generatedCopy.addEventListener('input', handleCopyChange);
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
    }

    // Save copy button
    const saveCopyBtn = document.getElementById('saveCopyBtn');
    if (saveCopyBtn) {
        saveCopyBtn.addEventListener('click', handleSaveCopy);
    }

    // Next page button
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', handleNextPage);
    }
}

// ========================================================================
// UI INITIALIZATION
// ========================================================================

function initializeUI() {
    updateButtonStates();
    
    const contentDisplay = document.getElementById('contentDisplay');
    if (contentDisplay) {
        contentDisplay.style.display = 'none';
    }

    const comparisonSection = document.getElementById('comparisonSection');
    if (comparisonSection) {
        comparisonSection.style.display = 'none';
    }
}

// ========================================================================
// FILE UPLOAD HANDLING
// ========================================================================

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        updateButtonStates();
        return;
    }

    console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    const fileName = file.name.toLowerCase();
    const validExtensions = ['.docx'];

    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
        showAlert('Please upload a DOCX file only.', 'error');
        event.target.value = '';
        updateButtonStates();
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showAlert('File is too large. Please upload a file smaller than 10MB.', 'error');
        event.target.value = '';
        updateButtonStates();
        return;
    }

    window.currentFile = file;
    setFileLoadingState(true);

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        
        if (typeof mammoth === 'undefined') {
            showAlert('Document reader not available. Please refresh the page.', 'error');
            setFileLoadingState(false);
            event.target.value = '';
            updateButtonStates();
            return;
        }

        mammoth.extractRawText({
            arrayBuffer: arrayBuffer
        })
        .then(function(result) {
            const text = result.value.trim();
            
            if (text.length === 0) {
                throw new Error('The document appears to be empty or contains no readable text.');
            }

            currentBriefing = text;
            displayBriefingContent(currentBriefing);
            showAlert('Briefing file loaded successfully!', 'success');
        })
        .catch(function(error) {
            console.error('❌ Error reading DOCX file:', error);
            showAlert('Failed to read the DOCX file. Please try another file.', 'error');
            event.target.value = '';
        })
        .finally(function() {
            setFileLoadingState(false);
            updateButtonStates();
        });
    };
    
    reader.onerror = function(error) {
        console.error('❌ FileReader error:', error);
        showAlert('Failed to read the file. Please try again.', 'error');
        setFileLoadingState(false);
        event.target.value = '';
        updateButtonStates();
    };
    
    try {
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('❌ Error starting file read:', error);
        showAlert('Failed to start reading the file. Please try again.', 'error');
        setFileLoadingState(false);
        event.target.value = '';
        updateButtonStates();
    }
}

function displayBriefingContent(content) {
    console.log('🖥️ Displaying briefing content, length:', content.length);
    
    const contentDisplay = document.getElementById('contentDisplay');
    if (contentDisplay) {
        contentDisplay.style.display = 'block';
    }

    const briefingOnlyMode = document.getElementById('briefingOnlyMode');
    const dualContentMode = document.getElementById('dualContentMode');
    
    if (briefingOnlyMode) {
        briefingOnlyMode.style.display = 'block';
        
        const briefingContent = document.getElementById('briefingContent');
        if (briefingContent) {
            briefingContent.value = content;
        }
    }
    
    if (dualContentMode) {
        dualContentMode.style.display = 'none';
    }
}

function setFileLoadingState(loading) {
    const fileInput = document.getElementById('briefingFileInput');
    const generateBtn = document.getElementById('generateBtn');
    
    if (fileInput) {
        fileInput.disabled = loading;
    }
    
    if (generateBtn) {
        generateBtn.disabled = loading;
        generateBtn.textContent = loading ? 'Loading file...' : 'Generate Copy';
    }
}

// ========================================================================
// COPY GENERATION FUNCTIONS
// ========================================================================

function handleGenerateCopy() {
    if (!window.currentFile) {
        showAlert('Please upload a briefing file first.', 'warning');
        return;
    }

    if (isGenerating) {
        return;
    }

    generateCopyFromFile(window.currentFile);
}

function generateCopyFromFile(file) {
    console.log('🚀 Starting copy generation via API...');
    setLoadingState(true);

    const formData = new FormData();
    formData.append('doc1', file);

    fetch('/api/generate_copy', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('📡 API Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Copy generation successful');
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Stocker la copy originale
        originalGeneratedCopy = data.output;
        currentCopy = data.output;
        hasUnsavedChanges = false; // Reset état modifications
        
        displayGeneratedCopy(data.output);
        calculateAndDisplayMetrics(currentBriefing, data.output);
        showAlert('Copy generated successfully!', 'success');
        
    })
    .catch(error => {
        console.error('❌ Generation error:', error);
        showAlert('Failed to generate copy: ' + error.message, 'error');
    })
    .finally(() => {
        setLoadingState(false);
    });
}

function displayGeneratedCopy(copyText) {
    console.log('📄 Displaying generated copy, length:', copyText.length);
    
    const briefingOnlyMode = document.getElementById('briefingOnlyMode');
    const dualContentMode = document.getElementById('dualContentMode');
    
    if (briefingOnlyMode) {
        briefingOnlyMode.style.display = 'none';
    }
    
    if (dualContentMode) {
        dualContentMode.style.display = 'block';
        
        const briefingContentReadonly = document.getElementById('briefingContentReadonly');
        const generatedCopy = document.getElementById('generatedCopy');
        
        if (briefingContentReadonly) {
            briefingContentReadonly.value = currentBriefing;
        }
        
        if (generatedCopy) {
            generatedCopy.value = copyText;
        }
    }
    
    const saveCopyBtn = document.getElementById('saveCopyBtn');
    
    if (saveCopyBtn) {
        saveCopyBtn.style.display = 'inline-flex';
    }
    
    updateButtonStates();
}

// ========================================================================
// BUTTON STATE MANAGEMENT
// ========================================================================

function updateButtonStates() {
    const hasContent = currentBriefing.trim().length > 0;
    const hasCopy = currentCopy.trim().length > 0;
    
    // Generate button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.disabled = !hasContent || isGenerating;
    }
    
    // Save button - actif seulement si modifications non sauvées
    const saveCopyBtn = document.getElementById('saveCopyBtn');
    if (saveCopyBtn) {
        const shouldShowSave = hasCopy && hasUnsavedChanges;
        saveCopyBtn.disabled = !shouldShowSave;
        saveCopyBtn.textContent = hasUnsavedChanges ? 'Save Changes' : 'Saved';
        
        // Classes CSS pour l'état visuel
        if (hasUnsavedChanges) {
            saveCopyBtn.classList.add('btn--has-changes');
            saveCopyBtn.classList.remove('btn--saved');
        } else {
            saveCopyBtn.classList.remove('btn--has-changes');
            saveCopyBtn.classList.add('btn--saved');
        }
    }
    
    // Next page button - désactivé si modifications non sauvées
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        const canGoNext = hasCopy && !hasUnsavedChanges;
        nextPageBtn.disabled = !canGoNext;
        
        if (hasUnsavedChanges) {
            nextPageBtn.title = 'Please save your changes before proceeding';
        } else {
            nextPageBtn.title = '';
        }
    }
}

function setLoadingState(loading) {
    isGenerating = loading;
    
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.disabled = loading;
        generateBtn.textContent = loading ? 'Generating...' : 'Generate Copy';
        
        if (loading) {
            generateBtn.classList.add('loading');
        } else {
            generateBtn.classList.remove('loading');
        }
    }
    
    updateButtonStates();
}

// ========================================================================
// EVENT HANDLERS
// ========================================================================

function handleCopyChange(event) {
    const newContent = event.target.value;
    currentCopy = newContent;
    
    // Détecter les modifications
    hasUnsavedChanges = (newContent !== originalGeneratedCopy);
    
    console.log('📝 Copy modified, has unsaved changes:', hasUnsavedChanges);
    
    updateButtonStates();
}

function handleSaveCopy() {
    const copyText = document.getElementById('generatedCopy').value;
    
    if (!copyText.trim()) {
        showAlert('No copy content to save.', 'warning');
        return;
    }
    
    if (!hasUnsavedChanges) {
        showAlert('No changes to save.', 'info');
        return;
    }
    
    try {
        localStorage.setItem('savedCopy', copyText);
        localStorage.setItem('savedCopyDate', new Date().toISOString());
        
        // Mettre à jour l'état après sauvegarde
        originalGeneratedCopy = copyText;
        hasUnsavedChanges = false;
        
        showAlert('Copy saved successfully!', 'success');
        updateButtonStates();
        
    } catch (error) {
        console.error('❌ Save error:', error);
        showAlert('Failed to save copy.', 'error');
    }
}

function handleReset() {
    if (hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Are you sure you want to reset?')) {
            return;
        }
    }
    
    if (confirm('Are you sure you want to reset all content?')) {
        console.log('🔄 Resetting application state...');
        
        const fileInput = document.getElementById('briefingFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        window.currentFile = null;
        
        const textareas = ['briefingContent', 'briefingContentReadonly', 'generatedCopy'];
        textareas.forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.value = '';
            }
        });
        
        // Reset variables
        currentBriefing = '';
        currentCopy = '';
        originalGeneratedCopy = '';
        hasUnsavedChanges = false;
        
        const contentDisplay = document.getElementById('contentDisplay');
        const comparisonSection = document.getElementById('comparisonSection');
        const docxPreviewSection = document.getElementById('docxPreviewSection');
        
        if (contentDisplay) {
            contentDisplay.style.display = 'none';
        }
        
        if (comparisonSection) {
            comparisonSection.style.display = 'none';
        }
        
        // Cacher le preview DOCX
        if (docxPreviewSection) {
            docxPreviewSection.style.display = 'none';
        }
        
        // Nettoyer le sessionStorage
        sessionStorage.removeItem('docxCopyText');
        
        const saveCopyBtn = document.getElementById('saveCopyBtn');
        
        if (saveCopyBtn) {
            saveCopyBtn.style.display = 'none';
        }
        
        updateButtonStates();
        showAlert('All content has been reset.', 'info');
    }
}

function handleNextPage() {
    console.log('🚀 Generating DOCX preview...');
    
    const copyText = document.getElementById('generatedCopy').value;
    
    if (!copyText.trim()) {
        showAlert('No copy content to preview.', 'warning');
        return;
    }

    // Générer et afficher le DOCX sur la même page
    generateAndShowDocxPreview(copyText);
}

function generateAndShowDocxPreview(copyText) {
    // Afficher le loading
    showDocxLoadingState(true);
    
    fetch('/api/generate_docx_preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            copy: copyText
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to generate DOCX preview');
        }
        return response.blob();
    })
    .then(blob => {
        // Convertir le blob en ArrayBuffer pour Mammoth
        return blob.arrayBuffer();
    })
    .then(arrayBuffer => {
        // Utiliser Mammoth pour convertir en HTML
        return mammoth.convertToHtml({arrayBuffer: arrayBuffer}, {
            styleMap: [
                "p[style-name='Title'] => h1.document-title",
                "p[style-name='Heading 1'] => h2.document-heading",
                "b => strong",
                "i => em"
            ]
        });
    })
    .then(result => {
        console.log('✅ DOCX preview generated successfully');
        
        // Afficher le preview DOCX
        showDocxPreview(result.value);
        
        // Stocker pour téléchargement
        storeDocxForDownload(copyText);
        
        showAlert('DOCX preview generated successfully!', 'success');
    })
    .catch(error => {
        console.error('❌ DOCX preview error:', error);
        showAlert('Failed to generate DOCX preview: ' + error.message, 'error');
    })
    .finally(() => {
        showDocxLoadingState(false);
    });
}

function showDocxPreview(htmlContent) {
    // Créer ou afficher la section preview
    let previewSection = document.getElementById('docxPreviewSection');
    
    if (!previewSection) {
        previewSection = document.createElement('section');
        previewSection.id = 'docxPreviewSection';
        previewSection.className = 'docx-preview-section card';
        
        previewSection.innerHTML = `
            <div class="preview-header">
                <h3>📄 DOCX Preview</h3>
                <div class="preview-controls">
                    <button id="downloadDocxBtn" class="btn btn--secondary">📥 Download DOCX</button>
                    <button id="generateDesignBtn" class="btn btn--primary">🎨 Generate Design</button>
                    <button id="closePreviewBtn" class="btn btn--secondary">✖ Close Preview</button>
                </div>
            </div>
            <div id="docxPreviewContent" class="docx-preview-content">
                <!-- Le contenu sera inséré ici -->
            </div>
        `;
        
        // Insérer après la section actions
        const actionsSection = document.querySelector('.actions-section');
        if (actionsSection) {
            actionsSection.parentNode.insertBefore(previewSection, actionsSection.nextSibling);
        } else {
            document.querySelector('.main-container').appendChild(previewSection);
        }
        
        // Ajouter les event listeners
        document.getElementById('closePreviewBtn').addEventListener('click', hideDocxPreview);
        document.getElementById('downloadDocxBtn').addEventListener('click', downloadStoredDocx);
        document.getElementById('generateDesignBtn').addEventListener('click', handleGenerateDesign);
    }
    
    // Insérer le contenu HTML
    document.getElementById('docxPreviewContent').innerHTML = htmlContent;
    
    // Afficher la section
    previewSection.style.display = 'block';
    
    // Scroll vers le preview
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Ajouter les styles Word
    addDocxPreviewStyles();
}

function addDocxPreviewStyles() {
    // Vérifier si les styles existent déjà
    if (document.getElementById('docxPreviewStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'docxPreviewStyles';
    style.textContent = `
        .docx-preview-section {
            margin-top: 30px;
        }
        
        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e55a00;
        }
        
        .preview-header h3 {
            margin: 0;
            color: #e55a00;
        }
        
        .preview-controls {
            display: flex;
            gap: 10px;
        }
        
        .docx-preview-content {
            background: white;
            border: 1px solid #ddd;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
            margin: 20px 0;
            max-width: 8.5in;
            min-height: 400px;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
        }
        
        .docx-preview-content h1.document-title {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 24pt;
            color: #000;
        }
        
        .docx-preview-content h2.document-heading {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 18pt;
            margin-bottom: 12pt;
            color: #000;
        }
        
        .docx-preview-content p {
            margin-bottom: 12pt;
            text-align: justify;
        }
        
        .docx-preview-content strong {
            font-weight: bold;
        }
        
        .docx-preview-content em {
            font-style: italic;
        }
        
        @media (max-width: 768px) {
            .preview-header {
                flex-direction: column;
                gap: 15px;
                align-items: flex-start;
            }
            
            .docx-preview-content {
                padding: 20px;
                font-size: 11pt;
            }
        }
    `;
    document.head.appendChild(style);
}

function hideDocxPreview() {
    const previewSection = document.getElementById('docxPreviewSection');
    if (previewSection) {
        previewSection.style.display = 'none';
    }
}

function showDocxLoadingState(loading) {
    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn) {
        nextBtn.disabled = loading;
        nextBtn.textContent = loading ? 'Generating Preview...' : 'Next';
    }
}

function storeDocxForDownload(copyText) {
    // Stocker le texte pour regénérer le DOCX lors du téléchargement
    sessionStorage.setItem('docxCopyText', copyText);
}

function downloadStoredDocx() {
    const copyText = sessionStorage.getItem('docxCopyText');
    
    if (!copyText) {
        showAlert('No DOCX available for download.', 'warning');
        return;
    }
    
    const downloadBtn = document.getElementById('downloadDocxBtn');
    const originalText = downloadBtn.textContent;
    downloadBtn.disabled = true;
    downloadBtn.textContent = '📥 Downloading...';
    
    fetch('/api/generate_docx_preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            copy: copyText
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Download failed');
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-copy.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showAlert('DOCX downloaded successfully!', 'success');
    })
    .catch(error => {
        console.error('❌ Download error:', error);
        showAlert('Failed to download DOCX.', 'error');
    })
    .finally(() => {
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
    });
}

function handleGenerateDesign() {
    const copyText = sessionStorage.getItem('docxCopyText');
    
    if (!copyText) {
        showAlert('No copy available for design generation.', 'warning');
        return;
    }
    
    console.log('🎨 Redirecting to design generation with copy...');
    
    // Stocker le copy pour copyfile.html
    sessionStorage.setItem('generatedCopyForDesign', copyText);
    sessionStorage.setItem('hasGeneratedCopy', 'true');
    
    // Rediriger vers copyfile.html
    window.location.href = '/copyfile';
}

// ========================================================================
// METRICS CALCULATION
// ========================================================================

function calculateAndDisplayMetrics(briefing, copy) {
    console.log('📊 Calculating factual comparison...');
    console.log('Briefing length:', briefing.length);
    console.log('Copy length:', copy.length);
    
    const formData = new FormData();
    
    // Envoyer directement le texte au lieu de fichiers
    formData.append('text1', briefing);
    formData.append('text2', copy);
    formData.append('words_to_anonymize', JSON.stringify([]));
    formData.append('comparison_type', 'brief_copy');
    
    console.log('📤 Sending text data');
    
    fetch('/api/compare', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('📡 API Response status:', response.status);
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Complete API Response:', JSON.stringify(data, null, 2));
        
        let factualScore = -1;
        if (data.result && data.result.similarity_score !== undefined) {
            factualScore = data.result.similarity_score;
        }
        
        console.log('📊 Final factual score:', factualScore);
        updateFactualDisplay(factualScore);
        showComparisonSection();
    })
    .catch(error => {
        console.error('❌ Error:', error);
        updateFactualDisplay(-1);
        showComparisonSection();
    });
}
function updateFactualDisplay(accuracy) {
    console.log('📈 Updating factual accuracy display:', accuracy);
    
    const element = document.getElementById('factualComparison');
    if (element) {
        element.textContent = accuracy + '%';
        element.style.color = '#e55a00';
    }
}

function showComparisonSection() {
    const comparisonSection = document.getElementById('comparisonSection');
    if (comparisonSection) {
        comparisonSection.style.display = 'block';
        comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function showAlert(message, type = 'info') {
    console.log(`📢 Alert [${type}]:`, message);
    
    const existingAlerts = document.querySelectorAll('.temp-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${getAlertClass(type)} temp-alert`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1050;
        min-width: 300px;
        max-width: 500px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    alert.innerHTML = `
        <strong>${getAlertTitle(type)}</strong>
        <p style="margin: 5px 0 0 0;">${message}</p>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

function getAlertClass(type) {
    const classMap = {
        'success': 'success',
        'error': 'danger', 
        'warning': 'warning',
        'info': 'info'
    };
    return classMap[type] || 'info';
}

function getAlertTitle(type) {
    const titleMap = {
        'success': 'Success!',
        'error': 'Error!',
        'warning': 'Warning!',
        'info': 'Info'
    };
    return titleMap[type] || 'Notice';
}

// ========================================================================
// CSS ANIMATIONS
// ========================================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .alert {
        color: #721c24;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
    }
    
    .alert-success {
        color: #155724;
        background-color: #d4edda;
        border-color: #c3e6cb;
    }
    
    .alert-warning {
        color: #856404;
        background-color: #fff3cd;
        border-color: #ffeaa7;
    }
    
    .alert-info {
        color: #0c5460;
        background-color: #d1ecf1;
        border-color: #bee5eb;
    }
    
    .alert-danger {
        color: #721c24;
        background-color: #f8d7da;
        border-color: #f5c6cb;
    }
`;
document.head.appendChild(style);

// ========================================================================
// ERROR HANDLING
// ========================================================================

window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    showAlert('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showAlert('An unexpected error occurred. Please try again.', 'error');
});

window.addEventListener('load', function() {
    if (typeof mammoth === 'undefined') {
        console.error('❌ Mammoth.js library failed to load');
        showAlert('Document reader library failed to load. Please refresh the page.', 'error');
    } else {
        console.log('✅ Mammoth.js library loaded successfully');
    }
});

console.log('✅ NLP Copy Generation JavaScript loaded successfully');