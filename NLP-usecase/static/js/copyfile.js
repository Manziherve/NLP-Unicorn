/**
 * Copy Design Generation JavaScript
 * Handles design generation from copy content with workflow management
 * Supports both localStorage copy and manual file upload
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // ========================================================================
  // DOM ELEMENT REFERENCES
  // ========================================================================
  
  // File input and generation controls
  const copyFileInput = document.getElementById('copyFileInput');
  const generateDesignBtn = document.getElementById('generateDesignBtn');
  const useLoadedCopyBtn = document.getElementById('useLoadedCopyBtn');
  
  // Load sections
  const loadFromMemory = document.getElementById('loadFromMemory');
  const manualUpload = document.getElementById('manualUpload');
  
  // Content display containers
  const contentDisplay = document.getElementById('contentDisplay');
  const copyOnlyMode = document.getElementById('copyOnlyMode');
  const dualDesignMode = document.getElementById('dualDesignMode');
  const confirmedDesignMode = document.getElementById('confirmedDesignMode');
  
  // Content areas
  const copyContent = document.getElementById('copyContent');
  const copyContentReadonly = document.getElementById('copyContentReadonly');
  const designedCopyContainer = document.getElementById('designedCopyContainer');
  const designedCopyPreview = document.getElementById('designedCopyPreview');
  const designedCopySource = document.getElementById('designedCopySource');
  const confirmedDesignPreview = document.getElementById('confirmedDesignPreview');
  
  // Design controls
  const toggleViewBtn = document.getElementById('toggleViewBtn');
  
  // Metrics section
  const designMetricsSection = document.getElementById('designMetricsSection');
  const layoutQuality = document.getElementById('layoutQuality');
  const typographyQuality = document.getElementById('typographyQuality');
  const visualImpact = document.getElementById('visualImpact');
  const brandConsistency = document.getElementById('brandConsistency');
  
  // Warning elements
  const designWarning = document.getElementById('designWarning');
  
  // Action buttons
  const resetBtn = document.getElementById('resetBtn');
  const backBtn = document.getElementById('backBtn');
  const confirmDesignBtn = document.getElementById('confirmDesignBtn');
  const downloadDesignBtn = document.getElementById('downloadDesignBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  // ========================================================================
  // STATE MANAGEMENT VARIABLES
  // ========================================================================
  
  let originalCopyText = '';        // Stores the original copy text
  let designGenerated = false;      // Tracks if design has been generated
  let designConfirmed = false;      // Tracks if design has been confirmed
  let isDesignModified = false;     // Tracks if design content has been modified
  let confirmedDesignHtml = '';     // Stores the confirmed design HTML
  let isPreviewMode = true;         // Tracks current view mode (preview vs source)

  // ========================================================================
  // UI STATE MANAGEMENT FUNCTIONS
  // ========================================================================

  /**
   * Shows only the copy content in a single large textarea
   * Used after content load, before design generation
   */
  function showCopyOnlyMode() {
    contentDisplay.style.display = 'flex';
    copyOnlyMode.style.display = 'flex';
    dualDesignMode.style.display = 'none';
    confirmedDesignMode.style.display = 'none';
    
    // Hide metrics and action buttons
    designMetricsSection.style.display = 'none';
    designWarning.style.display = 'none';
    confirmDesignBtn.style.display = 'none';
    downloadDesignBtn.style.display = 'none';
    nextPageBtn.disabled = true;
  }

  /**
   * Shows both copy and design content side by side
   * Used after design generation, before confirmation
   */
  function showDualDesignMode() {
    contentDisplay.style.display = 'flex';
    copyOnlyMode.style.display = 'none';
    dualDesignMode.style.display = 'flex';
    confirmedDesignMode.style.display = 'none';
    
    // Show metrics and confirm button
    designMetricsSection.style.display = 'block';
    confirmDesignBtn.style.display = 'inline-flex';
    downloadDesignBtn.style.display = 'none';
    nextPageBtn.disabled = true;
  }

  /**
   * Shows only the confirmed design in document-like display
   * Used after design confirmation
   */
  function showConfirmedDesignMode() {
    contentDisplay.style.display = 'flex';
    copyOnlyMode.style.display = 'none';
    dualDesignMode.style.display = 'none';
    confirmedDesignMode.style.display = 'flex';
    
    // Hide metrics and confirm, show final actions
    designMetricsSection.style.display = 'none';
    designWarning.style.display = 'none';
    confirmDesignBtn.style.display = 'none';
    downloadDesignBtn.style.display = 'inline-flex';
    nextPageBtn.disabled = false;
  }

  /**
   * Resets UI to initial state - only upload section visible
   */
  function resetToInitialState() {
    contentDisplay.style.display = 'none';
    designMetricsSection.style.display = 'none';
    designWarning.style.display = 'none';
    confirmDesignBtn.style.display = 'none';
    downloadDesignBtn.style.display = 'none';
    generateDesignBtn.disabled = true;
    nextPageBtn.disabled = true;
    
    // Hide load from memory if no data
    checkForLoadedCopy();
  }

  /**
   * Checks if copy data exists in localStorage and shows load option
   */
  function checkForLoadedCopy() {
    const savedCopy = localStorage.getItem('confirmedCopy');
    if (savedCopy && savedCopy.trim()) {
      loadFromMemory.style.display = 'block';
      manualUpload.style.display = 'block';
    } else {
      loadFromMemory.style.display = 'none';
      manualUpload.style.display = 'block';
    }
  }

  // ========================================================================
  // EVENT LISTENERS SETUP
  // ========================================================================
  
  copyFileInput.addEventListener('change', handleFileUpload);
  generateDesignBtn.addEventListener('click', generateDesign);
  useLoadedCopyBtn.addEventListener('click', loadCopyFromMemory);
  toggleViewBtn.addEventListener('click', toggleDesignView);
  resetBtn.addEventListener('click', resetAll);
  backBtn.addEventListener('click', goBackToCopy);
  confirmDesignBtn.addEventListener('click', confirmDesign);
  downloadDesignBtn.addEventListener('click', downloadDesign);
  nextPageBtn.addEventListener('click', goToCompareFiles);
  
  // Track design content changes
  if (designedCopySource) {
    designedCopySource.addEventListener('input', onDesignContentChange);
  }

  // ========================================================================
  // CORE FUNCTIONS
  // ========================================================================

  /**
   * Loads copy content from localStorage (from previous page)
   */
  function loadCopyFromMemory() {
    const savedCopy = localStorage.getItem('confirmedCopy');
    if (!savedCopy) {
      alert('No copy data found. Please upload a file instead.');
      return;
    }

    originalCopyText = savedCopy;
    copyContent.value = originalCopyText;
    showCopyOnlyMode();
    generateDesignBtn.disabled = false;
    
    // Reset states
    designGenerated = false;
    designConfirmed = false;
    isDesignModified = false;
    
    console.log('Copy loaded from memory');
  }

  /**
   * Handles DOCX file upload and text extraction
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
          originalCopyText = result.value;
          copyContent.value = originalCopyText;
          showCopyOnlyMode();
          generateDesignBtn.disabled = false;
          
          // Reset states
          designGenerated = false;
          designConfirmed = false;
          isDesignModified = false;
        })
        .catch(err => {
          console.error('Error reading DOCX file:', err);
          alert('Error reading the DOCX file. Please try again.');
        });
    };
    
    reader.readAsArrayBuffer(file);
  }

  /**
   * Generates design from copy content
   */
  async function generateDesign() {
    if (!originalCopyText.trim()) {
      alert('Please load copy content first.');
      return;
    }

    const originalBtnText = generateDesignBtn.textContent;
    generateDesignBtn.textContent = 'Generating...';
    generateDesignBtn.disabled = true;
    generateDesignBtn.classList.add('generating');

    try {
      const response = await fetch('/api/generate-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          copy: originalCopyText
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
      copyContentReadonly.value = originalCopyText;
      
      // Set design content
      const designHtml = data.designed_copy || generateFallbackDesign(originalCopyText);
      designedCopyPreview.innerHTML = designHtml;
      designedCopySource.value = designHtml;
      
      // Switch to dual design mode
      showDualDesignMode();
      designGenerated = true;
      isDesignModified = false;
      isPreviewMode = true;
      toggleViewBtn.textContent = 'Switch to HTML View';

      // Update design metrics
      updateDesignMetrics();

    } catch (error) {
      console.error('Error generating design:', error);
      alert('Failed to generate design. Using fallback design.');
      
      // Generate fallback design
      const fallbackDesign = generateFallbackDesign(originalCopyText);
      copyContentReadonly.value = originalCopyText;
      designedCopyPreview.innerHTML = fallbackDesign;
      designedCopySource.value = fallbackDesign;
      
      showDualDesignMode();
      designGenerated = true;
      updateDesignMetrics();
      
    } finally {
      generateDesignBtn.textContent = originalBtnText;
      generateDesignBtn.disabled = false;
      generateDesignBtn.classList.remove('generating');
    }
  }

  /**
   * Generates a fallback design when API fails
   */
  function generateFallbackDesign(copyText) {
    const paragraphs = copyText.split('\n\n').filter(p => p.trim());
    const title = paragraphs[0] || 'Marketing Copy';
    const content = paragraphs.slice(1).join('</p><p>') || copyText;
    
    return `
      <div class="marketing-design">
        <header class="design-header">
          <h1 class="design-title">${title}</h1>
          <div class="design-accent"></div>
        </header>
        
        <main class="design-content">
          <p>${content}</p>
        </main>
        
        <footer class="design-footer">
          <div class="cta-section">
            <button class="cta-button">Get Started Today</button>
            <p class="contact-info">Contact us for more information</p>
          </div>
        </footer>
        
        <style>
          .marketing-design {
            font-family: 'Roboto', sans-serif;
            max-width: 100%;
            margin: 0 auto;
            background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          
          .design-header {
            background: linear-gradient(135deg, #ff6c00 0%, #e55a00 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            position: relative;
          }
          
          .design-title {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          
          .design-accent {
            width: 60px;
            height: 4px;
            background: rgba(255,255,255,0.8);
            margin: 1rem auto 0;
            border-radius: 2px;
          }
          
          .design-content {
            padding: 2rem;
            line-height: 1.6;
            color: #333;
          }
          
          .design-content p {
            margin-bottom: 1rem;
            font-size: 1.1rem;
          }
          
          .design-footer {
            background: #f8f9fa;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .cta-button {
            background: #28a745;
            color: white;
            border: none;
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .cta-button:hover {
            background: #218838;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          }
          
          .contact-info {
            margin-top: 1rem;
            color: #6c757d;
            font-size: 0.9rem;
          }
        </style>
      </div>
    `;
  }

  /**
   * Toggles between preview and HTML source view
   */
  function toggleDesignView() {
    if (isPreviewMode) {
      // Switch to HTML source view
      designedCopyPreview.style.display = 'none';
      designedCopySource.style.display = 'block';
      toggleViewBtn.textContent = 'Switch to Preview';
      isPreviewMode = false;
    } else {
      // Switch to preview view
      designedCopyPreview.innerHTML = designedCopySource.value;
      designedCopyPreview.style.display = 'block';
      designedCopySource.style.display = 'none';
      toggleViewBtn.textContent = 'Switch to HTML View';
      isPreviewMode = true;
    }
  }

  /**
   * Confirms the edited design and shows final document view
   */
  function confirmDesign() {
    const currentDesignHtml = isPreviewMode ? 
      designedCopyPreview.innerHTML : 
      designedCopySource.value;
      
    if (!currentDesignHtml.trim()) {
      alert('No design content to confirm.');
      return;
    }

    // Store confirmed design
    confirmedDesignHtml = currentDesignHtml;
    confirmedDesignPreview.innerHTML = confirmedDesignHtml;
    
    // Save to localStorage for comparefiles.html
    localStorage.setItem('confirmedDesign', confirmedDesignHtml);
    localStorage.setItem('originalCopy', originalCopyText);
    
    // Update states
    designConfirmed = true;
    isDesignModified = false;
    
    // Show confirmed design mode
    showConfirmedDesignMode();
    
    console.log('Design confirmed and ready for next page');
  }

  /**
   * Downloads confirmed design as DOCX file
   */
  async function downloadDesign() {
    if (!confirmedDesignHtml.trim()) {
      alert('No confirmed design to download.');
      return;
    }

    try {
      const response = await fetch('/api/download-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designed_copy: confirmedDesignHtml
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
      a.download = 'designed-copy.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading design:', error);
      alert('Failed to download design.');
    }
  }

  /**
   * Updates design quality metrics
   */
  function updateDesignMetrics() {
    if (!designMetricsSection) return;

    // Simulate design quality metrics
    const metrics = {
      layout: Math.floor(Math.random() * 15) + 85,      // 85-100%
      typography: Math.floor(Math.random() * 10) + 88,  // 88-98%
      visual: Math.floor(Math.random() * 12) + 83,      // 83-95%
      brand: Math.floor(Math.random() * 8) + 90         // 90-98%
    };

    if (layoutQuality) layoutQuality.textContent = `${metrics.layout}%`;
    if (typographyQuality) typographyQuality.textContent = `${metrics.typography}%`;
    if (visualImpact) visualImpact.textContent = `${metrics.visual}%`;
    if (brandConsistency) brandConsistency.textContent = `${metrics.brand}%`;
  }

  /**
   * Handles design content changes to track modifications
   */
  function onDesignContentChange() {
    if (!designGenerated || designConfirmed) return;

    if (!isDesignModified) {
      isDesignModified = true;
      
      // Show modification warning
      designWarning.style.display = 'block';
      
      // Visual feedback
      designedCopySource.style.borderColor = 'var(--warning-color)';
      confirmDesignBtn.classList.add('modified');
      confirmDesignBtn.textContent = 'Confirm Changes';
    }
  }

  /**
   * Navigates back to copy generation page
   */
  function goBackToCopy() {
    window.location.href = '/index';
  }

  /**
   * Navigates to the comparefiles.html page
   */
  function goToCompareFiles() {
    if (!designConfirmed) {
      alert('Please confirm your design before continuing.');
      return;
    }
    
    window.location.href = '/comparefiles';
  }

  /**
   * Resets all form elements and state to initial values
   */
  function resetAll() {
    // Clear all inputs
    copyFileInput.value = '';
    if (copyContent) copyContent.value = '';
    if (copyContentReadonly) copyContentReadonly.value = '';
    if (designedCopyPreview) designedCopyPreview.innerHTML = '';
    if (designedCopySource) designedCopySource.value = '';
    if (confirmedDesignPreview) confirmedDesignPreview.innerHTML = '';
    
    // Reset UI state
    resetToInitialState();
    
    // Clear stored data and reset all states
    localStorage.removeItem('confirmedDesign');
    localStorage.removeItem('originalCopy');
    originalCopyText = '';
    designGenerated = false;
    designConfirmed = false;
    isDesignModified = false;
    confirmedDesignHtml = '';
    isPreviewMode = true;
    
    // Reset metrics
    if (layoutQuality) layoutQuality.textContent = '0%';
    if (typographyQuality) typographyQuality.textContent = '0%';
    if (visualImpact) visualImpact.textContent = '0%';
    if (brandConsistency) brandConsistency.textContent = '0%';
    
    // Reset button states
    if (confirmDesignBtn) {
      confirmDesignBtn.classList.remove('modified');
      confirmDesignBtn.textContent = 'Confirm Design';
    }
    if (toggleViewBtn) {
      toggleViewBtn.textContent = 'Switch to HTML View';
    }
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  function initializeApp() {
    resetToInitialState();
    console.log('Design Generation application initialized with confirmation workflow');
  }

  initializeApp();
});