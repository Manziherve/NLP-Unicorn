/**
 * Copy File Management JavaScript
 * Handles copy content selection, design generation, and content comparison
 * Part of the NLP Copy Generation workflow (Step 2/3)
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // ========================================================================
  // DOM ELEMENT REFERENCES
  // ========================================================================
  
  // Content source selection
  const copyChoiceSection = document.getElementById('copyChoiceSection');
  const copyFileInput = document.getElementById('copyFileInput');
  
  // Content display areas
  const storedCopyContent = document.getElementById('storedCopyContent');
  const copyContent = document.getElementById('copyContent');
  const contentDisplay = document.getElementById('contentDisplay');
  
  // Comparison section elements
  const comparisonSection = document.getElementById('comparisonSection');
  const generalComparison = document.getElementById('generalComparison');
  const semanticComparison = document.getElementById('semanticComparison');
  const factualComparison = document.getElementById('factualComparison');
  
  // Action buttons and UI elements
  const generateDesignBtn = document.getElementById('generateDesignBtn');
  const saveDesignBtn = document.getElementById('saveDesignBtn');
  const downloadDesignBtn = document.getElementById('downloadDesignBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const saveWarning = document.getElementById('saveWarning');

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  // Get previously saved copy content from localStorage
  const storedCopy = localStorage.getItem('copyContent');
  
  // Application state variables
  let isModified = false;        // Track if content has been modified
  let designGenerated = false;   // Track if design has been generated
  let originalCopyText = '';     // Store original copy text for comparison

  // ========================================================================
  // INITIAL UI STATE SETUP
  // ========================================================================
  
  /**
   * Initialize UI to show only copy source selection
   * Hide all other elements until user makes a choice
   */
  function initializeUI() {
    contentDisplay.style.display = 'none';
    comparisonSection.style.display = 'none';
    generateDesignBtn.disabled = true;
    saveDesignBtn.style.display = 'none';
    downloadDesignBtn.style.display = 'none';
    nextPageBtn.disabled = true;
    saveWarning.style.display = 'none';
  }

  // ========================================================================
  // COPY SOURCE SELECTION UI
  // ========================================================================

  /**
   * Renders the copy source selection interface
   * Shows different options based on whether stored copy exists
   */
  function renderCopyChoice() {
    copyChoiceSection.innerHTML = '';

    if (storedCopy) {
      // User has previously generated copy - offer both options
      copyChoiceSection.innerHTML = `
        <p>Choisissez la source du contenu Copy :</p>
        <button id="useStoredCopyBtn" class="btn btn-orange">Utiliser la copy générée</button>
        <span>ou</span>
        <button id="triggerFileInput" class="btn btn-secondary">Télécharger un fichier Copy (.docx)</button>
      `;

      // Event listeners for stored copy option
      document.getElementById('useStoredCopyBtn').addEventListener('click', () => {
        originalCopyText = storedCopy;
        showSingleTextarea(originalCopyText);
        resetStateAfterLoad();
      });

      // Event listener for file upload option
      document.getElementById('triggerFileInput').addEventListener('click', () => {
        copyFileInput.click();
      });

      copyFileInput.addEventListener('change', handleFileUpload);

    } else {
      // No stored copy - only file upload option
      copyChoiceSection.innerHTML = `
        <p>Veuillez télécharger un fichier Copy :</p>
        <button id="triggerFileInput" class="btn btn-secondary">Télécharger un fichier Copy (.docx)</button>
      `;

      document.getElementById('triggerFileInput').addEventListener('click', () => {
        copyFileInput.click();
      });

      copyFileInput.addEventListener('change', handleFileUpload);
    }
  }

  // ========================================================================
  // FILE HANDLING
  // ========================================================================

  /**
   * Handles DOCX file upload and text extraction
   * Uses Mammoth.js to extract raw text from Word documents
   * @param {Event} event - File input change event
   */
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Veuillez sélectionner un fichier DOCX valide.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function() {
      const arrayBuffer = reader.result;
      
      // Extract text using Mammoth.js library
      mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then(result => {
          originalCopyText = result.value;
          showSingleTextarea(originalCopyText);
          resetStateAfterLoad();
        })
        .catch(err => {
          console.error('Error reading DOCX file:', err);
          alert('Erreur lors de la lecture du fichier DOCX');
        });
    };
    
    reader.readAsArrayBuffer(file);
  }

  // ========================================================================
  // UI DISPLAY MODES
  // ========================================================================

  /**
   * Shows single editable textarea with copy content
   * Used when user first selects a copy source (before design generation)
   * @param {string} text - Copy text to display
   */
  function showSingleTextarea(text) {
    contentDisplay.style.display = 'flex';
    
    // Hide readonly textarea, show editable one
    storedCopyContent.parentElement.style.display = 'none';
    copyContent.parentElement.style.display = 'block';
    
    // Set content and make it editable
    copyContent.value = text;
    copyContent.readOnly = false;

    // Update UI state for editing mode
    comparisonSection.style.display = 'none';
    generateDesignBtn.disabled = false;
    saveDesignBtn.style.display = 'none';
    downloadDesignBtn.style.display = 'none';
    nextPageBtn.disabled = true;
    saveWarning.style.display = 'none';
  }

  /**
   * Shows dual textarea layout (original + editable)
   * Used after design generation to show comparison
   */
  function showDualTextareas() {
    contentDisplay.style.display = 'flex';

    // Show original copy (readonly)
    storedCopyContent.parentElement.style.display = 'block';
    storedCopyContent.value = originalCopyText;
    storedCopyContent.readOnly = true;

    // Show editable copy (maintains current content)
    copyContent.parentElement.style.display = 'block';
    copyContent.readOnly = false;

    // Show post-generation UI elements
    comparisonSection.style.display = 'block';
    generateDesignBtn.disabled = true;
    saveDesignBtn.style.display = 'inline-flex';
    downloadDesignBtn.style.display = 'inline-flex';
    nextPageBtn.disabled = false;
    saveWarning.style.display = 'none';
  }

  // ========================================================================
  // STATE MANAGEMENT FUNCTIONS
  // ========================================================================

  /**
   * Resets application state after loading new content
   * Clears modification flags and warnings
   */
  function resetStateAfterLoad() {
    isModified = false;
    designGenerated = false;
    saveWarning.style.display = 'none';
  }

  /**
   * Updates comparison metrics between original and current copy
   * Currently shows dummy values - replace with actual comparison logic
   */
  function updateComparisons() {
    // TODO: Implement actual comparison algorithm or API call
    // Currently showing dummy comparison percentages
    generalComparison.textContent = '95 %';
    semanticComparison.textContent = '90 %';
    factualComparison.textContent = '92 %';
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  /**
   * Tracks modifications to copy content after design generation
   * Shows save warning and disables navigation when content is modified
   */
  copyContent.addEventListener('input', () => {
    // Only track changes after design has been generated
    if (!designGenerated) return;
    
    // Mark as modified on first change
    if (!isModified) {
      isModified = true;
      nextPageBtn.disabled = true;
      saveWarning.style.display = 'block';
      saveDesignBtn.style.display = 'inline-flex';
    }
  });

  /**
   * Handles design generation process
   * Creates design content based on current copy and switches to dual view
   */
  generateDesignBtn.addEventListener('click', () => {
    // Validate copy content exists
    if (!copyContent.value.trim()) {
      alert('Le contenu copy est vide.');
      return;
    }

    // Update original text with current edited version for comparison
    originalCopyText = copyContent.value;

    // Switch to dual textarea layout
    showDualTextareas();

    // Generate and save design content
    // TODO: Replace with actual design generation API call
    const designText = `Design généré à partir du copy :\n\n${copyContent.value}`;
    localStorage.setItem('designContent', designText);

    // Update comparison metrics
    updateComparisons();

    // Update state flags
    designGenerated = true;
    isModified = false;
    saveWarning.style.display = 'none';
  });

  /**
   * Saves current design state and enables navigation
   * Resets modification tracking
   */
  saveDesignBtn.addEventListener('click', () => {
    // Save current copy content to localStorage
    localStorage.setItem('copyContent', copyContent.value);
    
    // Reset modification state
    isModified = false;
    nextPageBtn.disabled = false;
    saveWarning.style.display = 'none';
    
    // User feedback
    alert('Design enregistré');
  });

  /**
   * Downloads generated design content as text file
   * Creates temporary blob and triggers download
   */
  downloadDesignBtn.addEventListener('click', () => {
    const designText = localStorage.getItem('designContent') || '';
    
    if (!designText) {
      alert('Aucun design à télécharger.');
      return;
    }
    
    // Create blob and download link
    const blob = new Blob([designText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.txt';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  /**
   * Handles navigation to compare files page
   * Prevents navigation if there are unsaved changes
   */
  nextPageBtn.addEventListener('click', () => {
    // Check for unsaved modifications
    if (isModified) {
      alert('Veuillez enregistrer vos modifications avant de continuer.');
      return;
    }
    
    // Navigate to comparison page (since designfile.html was removed)
    window.location.href = 'comparefiles.html';
  });

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  // Initialize UI and render copy source selection
  initializeUI();
  renderCopyChoice();
});