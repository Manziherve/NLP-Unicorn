/**
 * JavaScript for copyfile.html - Design Generation Workflow
 * Handles copy detection from index.html and design generation
 */

let currentCopyText = '';
let currentDesign = '';
let isGeneratingDesign = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCopyfilePage();
    initializeCopyfileEventListeners();
});

// ========================================================================
// PAGE INITIALIZATION
// ========================================================================

function initializeCopyfilePage() {
    // Vérifier s'il y a un copy généré depuis index.html
    const hasGeneratedCopy = sessionStorage.getItem('hasGeneratedCopy');
    const generatedCopy = sessionStorage.getItem('generatedCopyForDesign');
    
    if (hasGeneratedCopy === 'true' && generatedCopy) {
        console.log('✅ Copy disponible depuis index.html');
        
        // OPTION: Proposer d'utiliser le copy existant ou upload nouveau
        showCopyOptions(generatedCopy);
        
        // Nettoyer le sessionStorage
        sessionStorage.removeItem('hasGeneratedCopy');
        sessionStorage.removeItem('generatedCopyForDesign');
    } else {
        console.log('📝 Mode upload normal - workflow comme index.html');
        showUploadMode();
        updateButtonStates();
    }
}

function showCopyOptions(copyText) {
    // Masquer la section upload
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
        uploadSection.style.display = 'none';
    }
    
    // Créer la section d'options
    createCopyOptionsSection(copyText);
    
    // Stocker le copy
    currentCopyText = copyText;
}

function createCopyOptionsSection(copyText) {
    let copySection = document.getElementById('existingCopySection');
    
    if (!copySection) {
        copySection = document.createElement('section');
        copySection.id = 'existingCopySection';
        copySection.className = 'copy-section card';
        
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.insertBefore(copySection, mainContainer.firstChild);
        }
    }
    
    copySection.innerHTML = `
        <h2>📄 Copy Ready for Design Generation</h2>
        <p class="section-description">Choose how to proceed:</p>
        
        <div class="copy-preview">
            <h3>Available Copy:</h3>
            <div class="copy-content">${copyText.substring(0, 300)}${copyText.length > 300 ? '...' : ''}</div>
        </div>
        
        <div class="copy-actions">
            <button id="editCopyBtn" class="btn btn--primary">
                ✏️ Edit Copy & Generate Design
            </button>
            <button id="directGenerateBtn" class="btn btn--success">
                🚀 Generate Design Directly
            </button>
            <button id="uploadNewFileBtn" class="btn btn--secondary">
                📁 Upload New Copy File
            </button>
            <a href="/" class="btn btn--secondary">← Back to Copy Generation</a>
        </div>
    `;
    
    copySection.style.display = 'block';
}

function showUploadMode() {
    console.log('📁 Mode upload activé');
    
    // Masquer la section existante s'il y en a une
    const existingSection = document.getElementById('existingCopySection');
    if (existingSection) {
        existingSection.style.display = 'none';
    }
    
    // Afficher la section upload
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }
}

// ========================================================================
// EVENT LISTENERS
// ========================================================================

function initializeCopyfileEventListeners() {
    // File upload handling
    const copyFileInput = document.getElementById('copyFileInput');
    if (copyFileInput) {
        copyFileInput.addEventListener('change', handleCopyFileUpload);
    }

    // Generate design button
    const generateDesignBtn = document.getElementById('generateDesignBtn');
    if (generateDesignBtn) {
        generateDesignBtn.addEventListener('click', handleGenerateDesign);
    }

    // Copy textarea changes
    const copyContent = document.getElementById('copyContent');
    if (copyContent) {
        copyContent.addEventListener('input', function(e) {
            currentCopyText = e.target.value;
        });
    }

    // Reset button
    const resetBtn = document.getElementById('resetDesignBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
    }

    // Dynamic event listeners pour les boutons d'options
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'editCopyBtn') {
            handleEditCopy();
        }
        
        if (e.target && e.target.id === 'directGenerateBtn') {
            handleDirectGenerate();
        }
        
        if (e.target && e.target.id === 'uploadNewFileBtn') {
            handleUploadNewFile();
        }
        
        if (e.target && e.target.id === 'generateFRBtn') {
            handleGenerateLanguage('FR');
        }
        
        if (e.target && e.target.id === 'generateNLBtn') {
            handleGenerateLanguage('NL');
        }
    });
}

// ========================================================================
// COPY OPTIONS HANDLERS
// ========================================================================

function handleEditCopy() {
    // WORKFLOW COMME INDEX.HTML : Afficher textarea pour édition
    showCopyEditMode();
}

function handleDirectGenerate() {
    // Générer directement le design
    generateDesignFromCopy(currentCopyText);
}

function showCopyEditMode() {
    // Masquer la section d'options
    const copySection = document.getElementById('existingCopySection');
    if (copySection) {
        copySection.style.display = 'none';
    }
    
    // Créer section d'édition comme index.html
    createEditSection();
}

function createEditSection() {
    let editSection = document.getElementById('editCopySection');
    
    if (!editSection) {
        editSection = document.createElement('section');
        editSection.id = 'editCopySection';
        editSection.className = 'content-display card';
        
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.appendChild(editSection);
        }
    }
    
    editSection.innerHTML = `
        <h2>📄 Edit Your Copy</h2>
        <div class="form-field">
            <label for="copyContent" class="form-label">Review and edit your copy before design generation</label>
            <textarea id="copyContent" class="content-textarea" rows="20">${currentCopyText}</textarea>
        </div>
        
        <div class="form-actions">
            <button id="generateDesignBtn" class="btn btn--primary">
                🎨 Generate Design
            </button>
            <button id="resetDesignBtn" class="btn btn--secondary">
                🔄 Reset
            </button>
        </div>
    `;
    
    editSection.style.display = 'block';
    
    // Event listeners pour la nouvelle section
    const textarea = document.getElementById('copyContent');
    if (textarea) {
        textarea.addEventListener('input', function(e) {
            currentCopyText = e.target.value;
        });
    }
    
    const generateBtn = document.getElementById('generateDesignBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateDesign);
    }
    
    const resetBtn = document.getElementById('resetDesignBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleReset);
    }
}

function handleUploadNewFile() {
    // Reset et retour au mode upload
    currentCopyText = '';
    showUploadMode();
}

// ========================================================================
// FILE UPLOAD HANDLING
// ========================================================================

function handleCopyFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        updateButtonStates();
        return;
    }

    console.log('📁 Fichier sélectionné:', file.name);
    
    // Vérifier le type de fichier
    if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.txt')) {
        showAlert('Veuillez télécharger un fichier DOCX ou TXT uniquement.', 'error');
        event.target.value = '';
        updateButtonStates();
        return;
    }

    // Vérifier la taille du fichier (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('Le fichier est trop volumineux. Veuillez télécharger un fichier de moins de 10MB.', 'error');
        event.target.value = '';
        updateButtonStates();
        return;
    }

    window.currentFile = file;
    setFileLoadingState(true);

    if (file.name.toLowerCase().endsWith('.txt')) {
        // Traitement des fichiers TXT
        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result.trim();
            processCopyText(text);
            setFileLoadingState(false);
        };
        reader.onerror = function() {
            showAlert('Erreur lors de la lecture du fichier.', 'error');
            setFileLoadingState(false);
            event.target.value = '';
            updateButtonStates();
        };
        reader.readAsText(file);
    } else {
        // Traitement des fichiers DOCX avec mammoth.js
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            
            if (typeof mammoth === 'undefined') {
                showAlert('Lecteur de document non disponible. Veuillez actualiser la page.', 'error');
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
                processCopyText(text);
            })
            .catch(function(error) {
                console.error('❌ Erreur lecture DOCX:', error);
                showAlert('Impossible de lire le fichier DOCX. Veuillez essayer un autre fichier.', 'error');
                event.target.value = '';
            })
            .finally(function() {
                setFileLoadingState(false);
                updateButtonStates();
            });
        };
        
        reader.onerror = function() {
            showAlert('Erreur lors de la lecture du fichier.', 'error');
            setFileLoadingState(false);
            event.target.value = '';
            updateButtonStates();
        };
        
        reader.readAsArrayBuffer(file);
    }
}

function processCopyText(text) {
    if (text.length === 0) {
        showAlert('Le fichier semble être vide.', 'error');
        return;
    }

    currentCopyText = text;
    // Afficher comme sur index.html: édition du texte avant génération
    displayCopyContent(currentCopyText);
    updateButtonStates();
    
    showAlert('Fichier copy chargé avec succès!', 'success');
}

function displayCopyContent(content) {
    // Masquer les sections d'options et upload
    const optionsSection = document.getElementById('existingCopySection');
    if (optionsSection) {
        optionsSection.style.display = 'none';
    }
    
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
        uploadSection.style.display = 'none';
    }

    // Créer/afficher la section de contenu comme sur index.html
    createEditSection();
}

function setFileLoadingState(loading) {
    const fileInput = document.getElementById('copyFileInput');
    const generateBtn = document.getElementById('generateDesignBtn');
    
    if (fileInput) {
        fileInput.disabled = loading;
    }
    
    if (generateBtn) {
        generateBtn.disabled = loading;
        generateBtn.textContent = loading ? 'Chargement fichier...' : '🎨 Generate Design';
    }
}

// ========================================================================
// DESIGN GENERATION
// ========================================================================

function handleGenerateDesign() {
    // Récupérer le contenu actuel de la textarea
    const copyContentTextarea = document.getElementById('copyContent');
    if (copyContentTextarea) {
        currentCopyText = copyContentTextarea.value;
    }
    
    if (!currentCopyText.trim()) {
        showAlert('Veuillez entrer le contenu du copy d\'abord.', 'warning');
        return;
    }

    if (isGeneratingDesign) {
        return;
    }

    generateDesignFromCopy(currentCopyText);
}

function generateDesignFromCopy(copyText) {
    console.log('🎨 Génération du design...');
    
    setDesignLoadingState(true);
    
    const selectedTemplate = document.getElementById('designTemplate') ? 
        document.getElementById('designTemplate').value : 'modern';

    fetch('/api/generate_design', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            copy: copyText,
            template: selectedTemplate
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('✅ Génération du design réussie');
        if (data.error) {
            throw new Error(data.error);
        }
        
        currentDesign = data.html || data.output || generateFallbackDesign(copyText, selectedTemplate);
        
        displayDesignPreview(currentDesign);
        showAlert('Design généré avec succès!', 'success');
        
    })
    .catch(error => {
        console.error('❌ Erreur génération:', error);
        showAlert('Échec de la génération du design: ' + error.message, 'error');
    })
    .finally(() => {
        setDesignLoadingState(false);
    });
}

function displayDesignPreview(htmlContent) {
    const previewSection = document.getElementById('designPreviewSection');
    const previewContent = document.getElementById('designPreviewContent');
    
    if (previewSection && previewContent) {
        previewContent.innerHTML = htmlContent;
        previewSection.style.display = 'block';
        
        // AJOUTER LES BOUTONS FR/NL APRÈS LE PREVIEW
        addLanguageButtons();
        
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // Créer la section de prévisualisation si elle n'existe pas
        createDesignPreviewSection(htmlContent);
    }
}

function createDesignPreviewSection(htmlContent) {
    // Masquer la section d'édition
    const editSection = document.getElementById('editCopySection');
    if (editSection) {
        editSection.style.display = 'none';
    }
    
    // Créer la section preview
    let previewSection = document.getElementById('designPreviewSection');
    
    if (!previewSection) {
        previewSection = document.createElement('section');
        previewSection.id = 'designPreviewSection';
        previewSection.className = 'design-preview-section card';
        
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.appendChild(previewSection);
        }
    }
    
    previewSection.innerHTML = `
        <div class="preview-header">
            <h3>🎨 Design Preview</h3>
            <div class="preview-controls">
                <button onclick="downloadDesign()" class="btn btn--success">📥 Download HTML</button>
                <button onclick="hideDesignPreview()" class="btn btn--secondary">✖ Close Preview</button>
            </div>
        </div>
        <div id="designPreviewContent" class="design-preview-content">
            ${htmlContent}
        </div>
    `;
    
    previewSection.style.display = 'block';
    
    // Ajouter les boutons de langue
    addLanguageButtons();
    
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function addLanguageButtons() {
    // Vérifier si les boutons existent déjà
    if (document.getElementById('languageButtons')) return;
    
    const previewSection = document.getElementById('designPreviewSection');
    if (previewSection) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.id = 'languageButtons';
        buttonsDiv.className = 'language-buttons';
        buttonsDiv.innerHTML = `
            <h3>🌍 Generate Other Language Versions:</h3>
            <div class="copy-actions">
                <button id="generateFRBtn" class="btn btn--primary">🇫🇷 Generate FR Design</button>
                <button id="generateNLBtn" class="btn btn--primary">🇳🇱 Generate NL Design</button>
                <button id="uploadNewFileBtn" class="btn btn--secondary">📁 Upload New Copy</button>
                <a href="/" class="btn btn--secondary">← Back to Copy Generation</a>
            </div>
        `;
        previewSection.appendChild(buttonsDiv);
    }
}

function generateFallbackDesign(copyText, template) {
    console.log('🔄 Génération du design de secours...');
    
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Marketing Design</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
                .header { background: linear-gradient(135deg, #ff6c00, #e55a00); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
                .content { background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 20px; }
                .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ff6c00; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; background: #343a40; color: white; border-radius: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎨 Marketing Design</h1>
                <p>Template: ${template}</p>
            </div>
            <div class="content">
                ${copyText.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
            </div>
            <div class="highlight">
                <p><strong>✨ Design généré automatiquement</strong></p>
            </div>
            <div class="footer">
                <p>Généré par SantOrange Design System</p>
            </div>
        </body>
        </html>
    `;
}

// ========================================================================
// LANGUAGE DESIGN GENERATION
// ========================================================================

function handleGenerateLanguage(language) {
    if (!currentCopyText.trim()) {
        showAlert('Aucun contenu copy disponible.', 'error');
        return;
    }
    
    console.log(`🌍 Génération version ${language}...`);
    
    setDesignLoadingState(true);
    
    fetch('/api/generate_design', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            copy: currentCopyText,
            template: document.getElementById('designTemplate')?.value || 'modern',
            language: language
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        const languageDesign = data.html || data.output || generateFallbackDesign(currentCopyText, 'modern');
        displayLanguageDesign(languageDesign, language);
        showAlert(`Design ${language} généré avec succès!`, 'success');
    })
    .catch(error => {
        console.error('❌ Erreur génération langue:', error);
        showAlert(`Échec génération design ${language}: ` + error.message, 'error');
    })
    .finally(() => {
        setDesignLoadingState(false);
    });
}

function displayLanguageDesign(designHtml, language) {
    // Ajouter le design en dessous du design principal
    const previewSection = document.getElementById('designPreviewSection');
    if (previewSection) {
        const languageDiv = document.createElement('div');
        languageDiv.className = 'language-design-section';
        languageDiv.innerHTML = `
            <h3>🌍 ${language} Version:</h3>
            <div class="design-preview-content">${designHtml}</div>
            <div class="design-controls">
                <button onclick="downloadLanguageDesign('${language}', \`${designHtml.replace(/`/g, '\\`').replace(/"/g, '\\"')}\`)" class="btn btn--success">
                    📥 Download ${language} Design
                </button>
            </div>
        `;
        previewSection.appendChild(languageDiv);
        languageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function updateButtonStates() {
    const hasContent = currentCopyText.trim().length > 0;
    
    const generateBtn = document.getElementById('generateDesignBtn');
    if (generateBtn) {
        generateBtn.disabled = !hasContent || isGeneratingDesign;
    }
}

function setDesignLoadingState(loading) {
    isGeneratingDesign = loading;
    
    const generateBtns = document.querySelectorAll('#generateDesignBtn, #generateFRBtn, #generateNLBtn');
    generateBtns.forEach(btn => {
        btn.disabled = loading;
        if (btn.id === 'generateDesignBtn') {
            btn.textContent = loading ? '🎨 Génération...' : '🎨 Generate Design';
        } else if (btn.id === 'generateFRBtn') {
            btn.textContent = loading ? '🇫🇷 Génération...' : '🇫🇷 Generate FR Design';
        } else if (btn.id === 'generateNLBtn') {
            btn.textContent = loading ? '🇳🇱 Génération...' : '🇳🇱 Generate NL Design';
        }
        
        if (loading) {
            btn.classList.add('loading');
        } else {
            btn.classList.remove('loading');
        }
    });
    
    updateButtonStates();
}

function handleReset() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tout le contenu?')) {
        // Reset variables
        currentCopyText = '';
        currentDesign = '';
        
        // Reset form
        const fileInput = document.getElementById('copyFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Supprimer toutes les sections dynamiques
        const sectionsToRemove = ['existingCopySection', 'editCopySection', 'designPreviewSection'];
        sectionsToRemove.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.remove();
            }
        });
        
        // Retour au mode upload
        showUploadMode();
        updateButtonStates();
        
        showAlert('Tout le contenu a été réinitialisé.', 'info');
    }
}

function hideDesignPreview() {
    const previewSection = document.getElementById('designPreviewSection');
    if (previewSection) {
        previewSection.style.display = 'none';
    }
    
    // Réafficher la section d'édition
    const editSection = document.getElementById('editCopySection');
    if (editSection) {
        editSection.style.display = 'block';
    }
}

// Global functions for HTML onclick handlers
window.downloadDesign = function() {
    if (!currentDesign.trim()) {
        showAlert('Aucun design disponible pour le téléchargement.', 'warning');
        return;
    }
    
    downloadDesignFile(currentDesign, 'marketing-design.html');
};

window.downloadLanguageDesign = function(language, content) {
    downloadDesignFile(content, `design-${language.toLowerCase()}.html`);
};

window.hideDesignPreview = hideDesignPreview;

function downloadDesignFile(content, filename) {
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showAlert('Design téléchargé avec succès!', 'success');
}

function showAlert(message, type = 'info') {
    // Supprimer les alertes existantes
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
        'success': 'Succès!',
        'error': 'Erreur!',
        'warning': 'Attention!',
        'info': 'Info'
    };
    return titleMap[type] || 'Notice';
}

// ========================================================================
// CSS STYLES
// ========================================================================

const style = document.createElement('style');
style.textContent = `
    .copy-section {
        margin-bottom: 30px;
    }
    
    .section-description {
        color: #666;
        margin-bottom: 25px;
        font-size: 16px;
    }
    
    .copy-preview {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 25px;
    }
    
    .copy-preview h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #e55a00;
        font-size: 18px;
    }
    
    .copy-content {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        max-height: 200px;
        overflow-y: auto;
        font-family: 'Times New Roman', serif;
        line-height: 1.6;
        font-size: 14px;
    }
    
    .copy-actions {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .content-textarea {
        width: 100%;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: 'Times New Roman', serif;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
    }
    
    .language-buttons {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px solid #e55a00;
    }

    .language-design-section {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #ddd;
    }
    
    .design-preview-section {
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
    
    .design-preview-content {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        background: #f8f9fa;
        min-height: 300px;
    }
    
    .design-controls {
        margin-top: 15px;
        text-align: center;
    }
    
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
    
    @media (max-width: 768px) {
        .copy-actions {
            flex-direction: column;
        }
        
        .copy-actions .btn {
            width: 100%;
        }
        
        .preview-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
        }
        
        .preview-controls {
            flex-direction: column;
            width: 100%;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Copyfile JavaScript loaded successfully');