/**
 * File Comparison & Generation JavaScript
 * Handles multi-format file comparison (.docx, .pdf, .html, .png, .jpg, .jpeg)
 * Generates copy or design based on user choice
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // ========================================================================
  // DOM ELEMENT REFERENCES
  // ========================================================================
  
  // File inputs
  const file1Input = document.getElementById('file1Input');
  const file2Input = document.getElementById('file2Input');
  const compareFilesBtn = document.getElementById('compareFilesBtn');
  
  // File info displays
  const file1Info = document.getElementById('file1Info');
  const file2Info = document.getElementById('file2Info');
  const file1Name = document.getElementById('file1Name');
  const file2Name = document.getElementById('file2Name');
  const file1Type = document.getElementById('file1Type');
  const file2Type = document.getElementById('file2Type');
  
  // Content display
  const contentDisplay = document.getElementById('contentDisplay');
  const comparisonMode = document.getElementById('comparisonMode');
  const file1Title = document.getElementById('file1Title');
  const file2Title = document.getElementById('file2Title');
  const file1Content = document.getElementById('file1Content');
  const file2Content = document.getElementById('file2Content');
  const file1ImagePreview = document.getElementById('file1ImagePreview');
  const file2ImagePreview = document.getElementById('file2ImagePreview');
  const file1Image = document.getElementById('file1Image');
  const file2Image = document.getElementById('file2Image');
  
  // Comparison metrics
  const comparisonMetricsSection = document.getElementById('comparisonMetricsSection');
  const similarityScore = document.getElementById('similarityScore');
  const contentMatch = document.getElementById('contentMatch');
  const structureScore = document.getElementById('structureScore');
  const formatCompatibility = document.getElementById('formatCompatibility');
  
  // Generation options
  const generationOptions = document.getElementById('generationOptions');
  const generateCopyRadio = document.getElementById('generateCopy');
  const generateDesignRadio = document.getElementById('generateDesign');
  const generateContentBtn = document.getElementById('generateContentBtn');
  
  // Generated content display
  const generatedContentSection = document.getElementById('generatedContentSection');
  const generatedContentTitle = document.getElementById('generatedContentTitle');
  const generatedContentArea = document.getElementById('generatedContentArea');
  const generatedDesignPreview = document.getElementById('generatedDesignPreview');
  
  // Action buttons
  const resetBtn = document.getElementById('resetBtn');
  const backBtn = document.getElementById('backBtn');
  const downloadGeneratedBtn = document.getElementById('downloadGeneratedBtn');
  const saveToWorkflowBtn = document.getElementById('saveToWorkflowBtn');

  // ========================================================================
  // STATE MANAGEMENT VARIABLES
  // ========================================================================
  
  let file1Data = null;
  let file2Data = null;
  let file1ProcessedContent = '';
  let file2ProcessedContent = '';
  let comparisonComplete = false;
  let generatedContent = '';
  let generationType = '';

  // ========================================================================
  // EVENT LISTENERS SETUP
  // ========================================================================
  
  file1Input.addEventListener('change', (e) => handleFileUpload(e, 1));
  file2Input.addEventListener('change', (e) => handleFileUpload(e, 2));
  compareFilesBtn.addEventListener('click', compareFiles);
  generateCopyRadio.addEventListener('change', onGenerationTypeChange);
  generateDesignRadio.addEventListener('change', onGenerationTypeChange);
  generateContentBtn.addEventListener('click', generateContent);
  resetBtn.addEventListener('click', resetAll);
  backBtn.addEventListener('click', goBack);
  downloadGeneratedBtn.addEventListener('click', downloadGenerated);
  saveToWorkflowBtn.addEventListener('click', saveToWorkflow);

  // ========================================================================
  // FILE PROCESSING FUNCTIONS
  // ========================================================================

  /**
   * Handles file upload for either file input
   */
  async function handleFileUpload(event, fileNumber) {
    const file = event.target.files[0];
    if (!file) return;

    const fileData = {
      file: file,
      name: file.name,
      type: getFileType(file.name),
      size: file.size
    };

    try {
      // Process file based on type
      const content = await processFile(file);
      fileData.content = content;

      // Store file data
      if (fileNumber === 1) {
        file1Data = fileData;
        updateFileInfo(1, fileData);
      } else {
        file2Data = fileData;
        updateFileInfo(2, fileData);
      }

      // Enable compare button if both files loaded
      if (file1Data && file2Data) {
        compareFilesBtn.disabled = false;
      }

    } catch (error) {
      console.error(`Error processing file ${fileNumber}:`, error);
      alert(`Error reading file ${fileNumber}. Please try again.`);
    }
  }

  /**
   * Processes file based on its type
   */
  async function processFile(file) {
    const extension = getFileExtension(file.name);
    
    switch (extension) {
      case 'docx':
        return await processDocxFile(file);
      case 'pdf':
        return await processPdfFile(file);
      case 'html':
        return await processHtmlFile(file);
      case 'png':
      case 'jpg':
      case 'jpeg':
        return await processImageFile(file);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  /**
   * Processes DOCX files using Mammoth
   */
  async function processDocxFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        mammoth.extractRawText({arrayBuffer: event.target.result})
          .then(result => resolve(result.value))
          .catch(reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Processes PDF files using PDF.js
   */
  async function processPdfFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function(event) {
        try {
          const pdf = await pdfjsLib.getDocument({data: event.target.result}).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText.trim());
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Processes HTML files
   */
  async function processHtmlFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(event.target.result, 'text/html');
        
        // Remove script and style elements
        const scripts = doc.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        // Extract text content
        const textContent = doc.body ? doc.body.textContent : doc.textContent;
        resolve(textContent.trim());
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Processes image files (returns base64 data URL)
   */
  async function processImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        resolve(event.target.result); // Base64 data URL
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ========================================================================
  // UI UPDATE FUNCTIONS
  // ========================================================================

  /**
   * Updates file info display
   */
  function updateFileInfo(fileNumber, fileData) {
    const infoElement = fileNumber === 1 ? file1Info : file2Info;
    const nameElement = fileNumber === 1 ? file1Name : file2Name;
    const typeElement = fileNumber === 1 ? file1Type : file2Type;

    nameElement.textContent = fileData.name;
    typeElement.textContent = fileData.type.toUpperCase();
    infoElement.style.display = 'block';
  }

  /**
   * Displays comparison results
   */
  function displayComparison() {
    contentDisplay.style.display = 'flex';
    
    // Update titles
    file1Title.textContent = `${file1Data.name} (${file1Data.type.toUpperCase()})`;
    file2Title.textContent = `${file2Data.name} (${file2Data.type.toUpperCase()})`;

    // Display content based on file type
    displayFileContent(1, file1Data);
    displayFileContent(2, file2Data);

    // Show metrics and generation options
    comparisonMetricsSection.style.display = 'block';
    generationOptions.style.display = 'block';
  }

  /**
   * Displays file content (text or image)
   */
  function displayFileContent(fileNumber, fileData) {
    const contentTextarea = fileNumber === 1 ? file1Content : file2Content;
    const imagePreview = fileNumber === 1 ? file1ImagePreview : file2ImagePreview;
    const imageElement = fileNumber === 1 ? file1Image : file2Image;

    if (isImageFile(fileData.type)) {
      // Display image
      contentTextarea.style.display = 'none';
      imageElement.src = fileData.content;
      imagePreview.style.display = 'block';
      
      // Store processed content for comparison
      if (fileNumber === 1) {
        file1ProcessedContent = `[Image: ${fileData.name}]`;
      } else {
        file2ProcessedContent = `[Image: ${fileData.name}]`;
      }
    } else {
      // Display text content
      imagePreview.style.display = 'none';
      contentTextarea.value = fileData.content;
      contentTextarea.style.display = 'block';
      
      // Store processed content
      if (fileNumber === 1) {
        file1ProcessedContent = fileData.content;
      } else {
        file2ProcessedContent = fileData.content;
      }
    }
  }

  // ========================================================================
  // COMPARISON FUNCTIONS
  // ========================================================================

  /**
   * Compares the two uploaded files
   */
  async function compareFiles() {
    if (!file1Data || !file2Data) {
      alert('Please upload both files first.');
      return;
    }

    compareFilesBtn.textContent = 'Comparing...';
    compareFilesBtn.disabled = true;

    try {
      // Display comparison
      displayComparison();

      // Calculate comparison metrics
      await calculateComparisonMetrics();
      
      comparisonComplete = true;

    } catch (error) {
      console.error('Error comparing files:', error);
      alert('Error comparing files. Please try again.');
    } finally {
      compareFilesBtn.textContent = 'Compare Files';
      compareFilesBtn.disabled = false;
    }
  }

  /**
   * Calculates and displays comparison metrics
   */
  async function calculateComparisonMetrics() {
    try {
      const response = await fetch('/api/compare-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file1: {
            content: file1ProcessedContent,
            type: file1Data.type,
            name: file1Data.name
          },
          file2: {
            content: file2ProcessedContent,
            type: file2Data.type,
            name: file2Data.name
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        updateMetricsDisplay(data);
      } else {
        // Use fallback metrics
        updateMetricsDisplay(generateFallbackMetrics());
      }
    } catch (error) {
      console.error('Error calculating metrics:', error);
      updateMetricsDisplay(generateFallbackMetrics());
    }
  }

  /**
   * Updates metrics display
   */
  function updateMetricsDisplay(metrics) {
    if (similarityScore) similarityScore.textContent = `${metrics.similarity || 0}%`;
    if (contentMatch) contentMatch.textContent = `${metrics.contentMatch || 0}%`;
    if (structureScore) structureScore.textContent = `${metrics.structure || 0}%`;
    if (formatCompatibility) formatCompatibility.textContent = `${metrics.compatibility || 0}%`;
  }

  /**
   * Generates fallback metrics when API unavailable
   */
  function generateFallbackMetrics() {
    const sameType = file1Data.type === file2Data.type;
    const baseScore = sameType ? 70 : 45;
    
    return {
      similarity: baseScore + Math.floor(Math.random() * 20),
      contentMatch: baseScore + Math.floor(Math.random() * 15),
      structure: baseScore + Math.floor(Math.random() * 25),
      compatibility: sameType ? 95 : Math.floor(Math.random() * 30) + 40
    };
  }

  // ========================================================================
  // GENERATION FUNCTIONS
  // ========================================================================

  /**
   * Handles generation type radio button changes
   */
  function onGenerationTypeChange() {
    if (generateCopyRadio.checked || generateDesignRadio.checked) {
      generateContentBtn.disabled = false;
      generationType = generateCopyRadio.checked ? 'copy' : 'design';
    }
  }

  /**
   * Generates content based on selected type
   */
  async function generateContent() {
    if (!comparisonComplete) {
      alert('Please compare files first.');
      return;
    }

    if (!generationType) {
      alert('Please select generation type.');
      return;
    }

    const originalBtnText = generateContentBtn.textContent;
    generateContentBtn.textContent = 'Generating...';
    generateContentBtn.disabled = true;

    try {
      const response = await fetch(`/api/generate-from-comparison`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file1Content: file1ProcessedContent,
          file2Content: file2ProcessedContent,
          generationType: generationType,
          file1Type: file1Data.type,
          file2Type: file2Data.type
        })
      });

      if (response.ok) {
        const data = await response.json();
        displayGeneratedContent(data.content || generateFallbackContent());
      } else {
        displayGeneratedContent(generateFallbackContent());
      }

    } catch (error) {
      console.error('Error generating content:', error);
      displayGeneratedContent(generateFallbackContent());
    } finally {
      generateContentBtn.textContent = originalBtnText;
      generateContentBtn.disabled = false;
    }
  }

  /**
   * Displays generated content
   */
  function displayGeneratedContent(content) {
    generatedContent = content;
    generatedContentTitle.textContent = `Generated ${generationType === 'copy' ? 'Copy' : 'Design'}`;
    
    if (generationType === 'design') {
      // Display as HTML design
      generatedContentArea.style.display = 'none';
      generatedDesignPreview.innerHTML = content;
      generatedDesignPreview.style.display = 'block';
    } else {
      // Display as text copy
      generatedDesignPreview.style.display = 'none';
      generatedContentArea.value = content;
      generatedContentArea.style.display = 'block';
    }

    // Show generated content section and action buttons
    generatedContentSection.style.display = 'flex';
    downloadGeneratedBtn.style.display = 'inline-flex';
    saveToWorkflowBtn.style.display = 'inline-flex';
    
    // Hide generation options
    generationOptions.style.display = 'none';
  }

  /**
   * Generates fallback content when API unavailable
   */
  function generateFallbackContent() {
    const combinedContent = `${file1ProcessedContent}\n\n${file2ProcessedContent}`;
    
    if (generationType === 'copy') {
      return `Based on the comparison of ${file1Data.name} and ${file2Data.name}:

${combinedContent.substring(0, 500)}...

This generated copy combines elements from both files to create compelling marketing content.`;
    } else {
      return `
        <div class="generated-design">
          <header class="design-header">
            <h1>Combined Marketing Content</h1>
            <p>Generated from: ${file1Data.name} + ${file2Data.name}</p>
          </header>
          
          <main class="design-content">
            <div class="content-section">
              <h2>From ${file1Data.name}:</h2>
              <p>${file1ProcessedContent.substring(0, 200)}...</p>
            </div>
            
            <div class="content-section">
              <h2>From ${file2Data.name}:</h2>
              <p>${file2ProcessedContent.substring(0, 200)}...</p>
            </div>
            
            <div class="cta-section">
              <button class="cta-button">Learn More</button>
            </div>
          </main>
          
          <style>
            .generated-design {
              font-family: 'Roboto', sans-serif;
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
            }
            .design-content {
              padding: 2rem;
            }
            .content-section {
              margin-bottom: 2rem;
              padding: 1rem;
              background: rgba(255,108,0,0.05);
              border-radius: 8px;
            }
            .cta-section {
              text-align: center;
              margin-top: 2rem;
            }
            .cta-button {
              background: #28a745;
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
            }
          </style>
        </div>
      `;
    }
  }

  // ========================================================================
  // ACTION FUNCTIONS
  // ========================================================================

  /**
   * Downloads generated content
   */
  async function downloadGenerated() {
    if (!generatedContent) {
      alert('No content to download.');
      return;
    }

    try {
      const endpoint = generationType === 'design' ? '/api/download-design' : '/api/download-copy';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [generationType === 'design' ? 'designed_copy' : 'copy']: generatedContent
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-${generationType}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading content:', error);
      alert('Failed to download content.');
    }
  }

  /**
   * Saves generated content to workflow
   */
  function saveToWorkflow() {
    if (!generatedContent) {
      alert('No content to save.');
      return;
    }

    if (generationType === 'copy') {
      localStorage.setItem('confirmedCopy', generatedContent);
      alert('Copy saved to workflow! You can now go to Generate Design.');
      window.location.href = '/copyfile';
    } else {
      localStorage.setItem('confirmedDesign', generatedContent);
      localStorage.setItem('originalCopy', `${file1ProcessedContent}\n\n${file2ProcessedContent}`);
      alert('Design saved to workflow!');
    }
  }

  /**
   * Navigates back to previous page
   */
  function goBack() {
    window.location.href = '/copyfile';
  }

  /**
   * Resets all form elements and state
   */
  function resetAll() {
    // Clear file inputs
    file1Input.value = '';
    file2Input.value = '';
    
    // Hide file info
    file1Info.style.display = 'none';
    file2Info.style.display = 'none';
    
    // Clear content displays
    file1Content.value = '';
    file2Content.value = '';
    file1ImagePreview.style.display = 'none';
    file2ImagePreview.style.display = 'none';
    generatedContentArea.value = '';
    generatedDesignPreview.innerHTML = '';
    
    // Hide sections
    contentDisplay.style.display = 'none';
    comparisonMetricsSection.style.display = 'none';
    generationOptions.style.display = 'none';
    generatedContentSection.style.display = 'none';
    
    // Reset buttons and states
    compareFilesBtn.disabled = true;
    generateContentBtn.disabled = true;
    downloadGeneratedBtn.style.display = 'none';
    saveToWorkflowBtn.style.display = 'none';
    
    // Clear radio selections
    generateCopyRadio.checked = false;
    generateDesignRadio.checked = false;
    
    // Reset state variables
    file1Data = null;
    file2Data = null;
    file1ProcessedContent = '';
    file2ProcessedContent = '';
    comparisonComplete = false;
    generatedContent = '';
    generationType = '';
    
    // Reset metrics
    if (similarityScore) similarityScore.textContent = '0%';
    if (contentMatch) contentMatch.textContent = '0%';
    if (structureScore) structureScore.textContent = '0%';
    if (formatCompatibility) formatCompatibility.textContent = '0%';
  }

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

  /**
   * Gets file extension from filename
   */
  function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Gets file type category
   */
  function getFileType(filename) {
    const extension = getFileExtension(filename);
    const imageTypes = ['png', 'jpg', 'jpeg'];
    const documentTypes = ['docx', 'pdf', 'html'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (documentTypes.includes(extension)) return 'document';
    return extension;
  }

  /**
   * Checks if file is an image
   */
  function isImageFile(type) {
    return type === 'image';
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  function initializeApp() {
    console.log('File Comparison application initialized');
    
    // Check if user came from previous workflow steps
    const hasWorkflowData = localStorage.getItem('confirmedCopy') || localStorage.getItem('confirmedDesign');
    if (hasWorkflowData) {
      console.log('Workflow data detected in localStorage');
    }
  }

  initializeApp();
});