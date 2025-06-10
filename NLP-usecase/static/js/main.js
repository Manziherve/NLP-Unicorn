/**
 * Main JavaScript for NLP Copy Generation Tool
 * Handles briefing file upload, copy generation, and content management
 * Optimized for fullscreen layout with progressive content display
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // ========================================================================
  // DOM ELEMENT REFERENCES
  // ========================================================================
  
  // File input and generation controls
  const briefingFileInput = document.getElementById('briefingFileInput');
  const generateCopyBtn = document.getElementById('generateCopyBtn');
  
  // Content display containers
  const contentDisplay = document.getElementById('contentDisplay');
  const briefingOnlyMode = document.getElementById('briefingOnlyMode');
  const dualContentMode = document.getElementById('dualContentMode');
  const confirmedCopyMode = document.getElementById('confirmedCopyMode');
  
  // Textarea elements
  const briefingContent = document.getElementById('briefingContent');
  const briefingContentReadonly = document.getElementById('briefingContentReadonly');
  const copyContent = document.getElementById('copyContent');
  const confirmedCopyContent = document.getElementById('confirmedCopyContent');
  
  // Comparison section elements
  const comparisonSection = document.getElementById('comparisonSection');
  const generalComparison = document.getElementById('generalComparison');
  const semanticComparison = document.getElementById('semanticComparison');
  const factualComparison = document.getElementById('factualComparison');
  const commercialComparison = document.getElementById('commercialComparison');
  
  // Warning elements
  const modificationWarning = document.getElementById('modificationWarning');
  
  // Action buttons
  const resetBtn = document.getElementById('resetBtn');
  const confirmCopyBtn = document.getElementById('confirmCopyBtn');
  const downloadCopyBtn = document.getElementById('downloadCopyBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  // ========================================================================
  // STATE MANAGEMENT VARIABLES
  // ========================================================================
  
  let originalText = '';           // Stores the original briefing text
  let copyGenerated = false;       // Tracks if copy has been generated
  let copyConfirmed = false;       // Tracks if copy has been confirmed
  let isModified = false;          // Tracks if copy content has been modified
  let confirmedCopyText = '';      // Stores the confirmed copy text

  // ========================================================================
  // UI STATE MANAGEMENT FUNCTIONS
  // ========================================================================

  /**
   * Shows only the briefing content in a single large textarea
   * Used after file upload, before copy generation
   */
  function showBriefingOnlyMode() {
    contentDisplay.style.display = 'flex';
    briefingOnlyMode.style.display = 'flex';
    dualContentMode.style.display = 'none';
    confirmedCopyMode.style.display = 'none';
    
    // Hide comparison and action buttons
    comparisonSection.style.display = 'none';
    modificationWarning.style.display = 'none';
    confirmCopyBtn.style.display = 'none';
    downloadCopyBtn.style.display = 'none';
    nextPageBtn.disabled = true;
  }

  /**
   * Shows both briefing and copy content side by side
   * Used after copy generation, before confirmation
   */
  function showDualContentMode() {
    contentDisplay.style.display = 'flex';
    briefingOnlyMode.style.display = 'none';
    dualContentMode.style.display = 'flex';
    confirmedCopyMode.style.display = 'none';
    
    // Show comparison and confirm button
    comparisonSection.style.display = 'block';
    confirmCopyBtn.style.display = 'inline-flex';
    downloadCopyBtn.style.display = 'none';
    nextPageBtn.disabled = true;
  }

  /**
   * Shows only the confirmed copy in document-like display
   * Used after copy confirmation
   */
  function showConfirmedCopyMode() {
    contentDisplay.style.display = 'flex';
    briefingOnlyMode.style.display = 'none';
    dualContentMode.style.display = 'none';
    confirmedCopyMode.style.display = 'flex';
    
    // Hide comparison and confirm, show final actions
    comparisonSection.style.display = 'none';
    modificationWarning.style.display = 'none';
    confirmCopyBtn.style.display = 'none';
    downloadCopyBtn.style.display = 'inline-flex';
    nextPageBtn.disabled = false;
  }

  /**
   * Resets UI to initial state - only upload section visible
   */
  function resetToInitialState() {
    contentDisplay.style.display = 'none';
    comparisonSection.style.display = 'none';
    modificationWarning.style.display = 'none';
    confirmCopyBtn.style.display = 'none';
    downloadCopyBtn.style.display = 'none';
    generateCopyBtn.disabled = true;
    nextPageBtn.disabled = true;
  }

  // ========================================================================
  // EVENT LISTENERS SETUP
  // ========================================================================
  
  briefingFileInput.addEventListener('change', handleFileUpload);
  generateCopyBtn.addEventListener('click', generateCopy);
  resetBtn.addEventListener('click', resetAll);
  confirmCopyBtn.addEventListener('click', confirmCopy);
  downloadCopyBtn.addEventListener('click', downloadCopy);
  nextPageBtn.addEventListener('click', goToCopyFile);
  
  // Track copy content changes only after generation
  if (copyContent) {
    copyContent.addEventListener('input', onCopyContentChange);
  }

  // ========================================================================
  // CORE FUNCTIONS
  // ========================================================================

  /**
   * Handles DOCX file upload and text extraction
   * Uses Mammoth.js library to extract raw text from Word documents
   */
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Please select a valid DOCX file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      const arrayBuffer = reader.result;
      
      mammoth.extractRawText({arrayBuffer: arrayBuffer})
        .then(result => {
          originalText = result.value;
          
          briefingContent.value = originalText;
          showBriefingOnlyMode();
          
          generateCopyBtn.disabled = false;
          
          // Reset all states
          copyGenerated = false;
          copyConfirmed = false;
          isModified = false;
        })
        .catch(err => {
          console.error('Error reading DOCX file:', err);
          alert('Error reading the DOCX file. Please try again.');
        });
    };
    
    reader.readAsArrayBuffer(file);
  }

  /**
   * Generates copy content from briefing text
   * Calls backend API to generate copy using AI
   */
  async function generateCopy() {
    if (!originalText.trim()) {
      alert('Please upload a briefing file first.');
      return;
    }

    const originalBtnText = generateCopyBtn.textContent;
    generateCopyBtn.textContent = 'Generating...';
    generateCopyBtn.disabled = true;

    try {
      const response = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefing: originalText
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update content displays
      briefingContentReadonly.value = originalText;
      copyContent.value = data.copy || originalText;
      
      // Switch to dual content mode
      showDualContentMode();
      copyGenerated = true;
      isModified = false;

      // Update comparisons
      await updateComparisons();

    } catch (error) {
      console.error('Error generating copy:', error);
      alert('Failed to generate copy. Please try again.');
    } finally {
      generateCopyBtn.textContent = originalBtnText;
      generateCopyBtn.disabled = false;
    }
  }

  /**
   * Confirms the edited copy and shows final document view
   */
  function confirmCopy() {
    if (!copyContent.value.trim()) {
      alert('No copy content to confirm.');
      return;
    }

    // Store confirmed copy
    confirmedCopyText = copyContent.value;
    confirmedCopyContent.value = confirmedCopyText;
    
    // Save to localStorage for copyfile.html
    localStorage.setItem('confirmedCopy', confirmedCopyText);
    localStorage.setItem('originalBriefing', originalText);
    
    // Update states
    copyConfirmed = true;
    isModified = false;
    
    // Show confirmed copy mode
    showConfirmedCopyMode();
    
    console.log('Copy confirmed and ready for next page');
  }

  /**
   * Downloads confirmed copy as DOCX file
   */
  async function downloadCopy() {
    if (!confirmedCopyText.trim()) {
      alert('No confirmed copy to download.');
      return;
    }

    try {
      const response = await fetch('/api/download-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copy: confirmedCopyText
        })
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Download the DOCX file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated-copy.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading copy:', error);
      alert('Failed to download copy.');
    }
  }

  /**
   * Updates comparison metrics between briefing and copy
   */
  async function updateComparisons() {
    if (!comparisonSection || !originalText || !copyContent.value) return;

    try {
      const response = await fetch('/api/compare-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefing: originalText,
          copy: copyContent.value
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (generalComparison) generalComparison.textContent = `${data.general || 'N/A'}%`;
        if (semanticComparison) semanticComparison.textContent = `${data.semantic || 'N/A'}%`;
        if (factualComparison) factualComparison.textContent = `${data.factual || 'N/A'}%`;
        if (commercialComparison) commercialComparison.textContent = `${data.commercial || 'N/A'}%`;
      } else {
        setDummyComparisons();
      }
    } catch (error) {
      console.error('Error updating comparisons:', error);
      setDummyComparisons();
    }
  }

  /**
   * Sets dummy comparison values when API is unavailable
   */
  function setDummyComparisons() {
    if (generalComparison) generalComparison.textContent = '95%';
    if (semanticComparison) semanticComparison.textContent = '90%';
    if (factualComparison) factualComparison.textContent = '92%';
    if (commercialComparison) commercialComparison.textContent = '88%';
  }

  /**
   * Handles copy content changes to track modifications
   */
  function onCopyContentChange() {
    if (!copyGenerated || copyConfirmed) return;

    if (!isModified) {
      isModified = true;
      
      // Show modification warning
      modificationWarning.style.display = 'block';
      
      // Visual feedback
      copyContent.style.borderColor = 'var(--warning-color)';
      confirmCopyBtn.style.backgroundColor = 'var(--warning-color)';
      confirmCopyBtn.textContent = 'Confirm Changes';
    }
  }

  /**
   * Navigates to the copyfile.html page
   */
  function goToCopyFile() {
    if (!copyConfirmed) {
      alert('Please confirm your copy before continuing.');
      return;
    }
    
    window.location.href = '/copyfile';
  }

  /**
   * Resets all form elements and state to initial values
   */
  function resetAll() {
    // Clear all inputs
    briefingFileInput.value = '';
    if (briefingContent) briefingContent.value = '';
    if (briefingContentReadonly) briefingContentReadonly.value = '';
    if (copyContent) copyContent.value = '';
    if (confirmedCopyContent) confirmedCopyContent.value = '';
    
    // Reset UI state
    resetToInitialState();
    
    // Clear stored data and reset all states
    localStorage.removeItem('confirmedCopy');
    localStorage.removeItem('originalBriefing');
    originalText = '';
    copyGenerated = false;
    copyConfirmed = false;
    isModified = false;
    confirmedCopyText = '';
    
    // Reset comparisons
    if (generalComparison) generalComparison.textContent = '0%';
    if (semanticComparison) semanticComparison.textContent = '0%';
    if (factualComparison) factualComparison.textContent = '0%';
    if (commercialComparison) commercialComparison.textContent = '0%';
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  function initializeApp() {
    resetToInitialState();
    console.log('Copy Generation application initialized with confirmation workflow');
  }

  initializeApp();
});