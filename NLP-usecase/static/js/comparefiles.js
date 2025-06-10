/**
 * Compare Files JavaScript
 * Handles file comparison between different document types
 * Supports DOCX, HTML, TXT, and image files
 * Part of the NLP Copy Generation workflow (Step 3/3)
 */

// ========================================================================
// DOM ELEMENT REFERENCES
// ========================================================================

// File input elements
const fileInput1 = document.getElementById("file1");
const fileInput2 = document.getElementById("file2");

// Action buttons
const compareBtn = document.getElementById("compareBtn");
const resetBtn = document.getElementById("resetBtn");
const goToCopyGenBtn = document.getElementById("goToCopyGenBtn");
const goToDesignGenBtn = document.getElementById("goToDesignGenBtn");

// Display elements
const loadingDiv = document.getElementById("loading");
const content1 = document.getElementById("content1");
const content2 = document.getElementById("content2");

// ========================================================================
// STATE MANAGEMENT
// ========================================================================

// Store processed file data for comparison and navigation
let fileData1 = null;
let fileData2 = null;

// Supported file types configuration
const SUPPORTED_EXTENSIONS = {
  documents: ['docx', 'html', 'htm', 'txt'],
  images: ['png', 'jpg', 'jpeg']
};

// ========================================================================
// CORE FUNCTIONS
// ========================================================================

/**
 * Resets the entire comparison interface to initial state
 * Clears all inputs, content displays, and disables buttons
 */
function reset() {
  // Clear file inputs
  fileInput1.value = "";
  fileInput2.value = "";
  
  // Clear content displays
  content1.innerHTML = "";
  content2.innerHTML = "";
  
  // Reset button states
  compareBtn.disabled = true;
  resetBtn.disabled = true;
  goToCopyGenBtn.disabled = true;
  goToDesignGenBtn.disabled = true;
  
  // Hide UI elements
  loadingDiv.style.display = "none";
  document.querySelector(".compare-results").style.display = "none";
  
  // Clear stored data
  fileData1 = null;
  fileData2 = null;
}

/**
 * Enables compare button when both files are selected
 * Updates UI state based on file selection status
 */
function enableCompareIfReady() {
  const hasFiles = fileInput1.files.length > 0 && fileInput2.files.length > 0;
  compareBtn.disabled = !hasFiles;
  resetBtn.disabled = false;
}

/**
 * Validates file type against supported extensions
 * @param {File} file - File object to validate
 * @returns {boolean} - True if file type is supported
 */
function isFileTypeSupported(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  const allSupported = [...SUPPORTED_EXTENSIONS.documents, ...SUPPORTED_EXTENSIONS.images];
  return allSupported.includes(extension);
}

// ========================================================================
// FILE PROCESSING FUNCTIONS
// ========================================================================

/**
 * Reads and processes different file types into HTML content
 * Supports DOCX, HTML, TXT files and images (PNG, JPG, JPEG)
 * @param {File} file - File object to process
 * @returns {Promise<string>} - Promise resolving to HTML content
 */
async function readFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();

  try {
    switch (extension) {
      case "docx":
        return await processDocxFile(file);
      
      case "html":
      case "htm":
        return await processHtmlFile(file);
      
      case "txt":
        return await processTextFile(file);
      
      case "png":
      case "jpg":
      case "jpeg":
        return await processImageFile(file);
      
      default:
        return `<p style="color:red;">Unsupported file type: ${extension}</p>`;
    }
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    return `<p style="color:red;">Error processing file: ${error.message}</p>`;
  }
}

/**
 * Processes DOCX files using Mammoth.js library
 * Extracts and converts Word document content to HTML
 * @param {File} file - DOCX file to process
 * @returns {Promise<string>} - HTML content
 */
async function processDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return result.value;
}

/**
 * Processes HTML files by reading raw text content
 * @param {File} file - HTML file to process
 * @returns {Promise<string>} - HTML content
 */
async function processHtmlFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Error reading HTML file"));
    reader.readAsText(file);
  });
}

/**
 * Processes plain text files with HTML escaping and formatting
 * Converts line breaks to <br> tags and escapes HTML entities
 * @param {File} file - Text file to process
 * @returns {Promise<string>} - Formatted HTML content
 */
async function processTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      // Escape HTML entities and convert line breaks
      const escapedText = e.target.result
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      
      resolve(`<div style="white-space: normal; font-family: monospace;">${escapedText}</div>`);
    };
    reader.onerror = () => reject(new Error("Error reading text file"));
    reader.readAsText(file);
  });
}

/**
 * Processes image files by creating blob URLs and img tags
 * @param {File} file - Image file to process
 * @returns {Promise<string>} - HTML img tag with blob URL
 */
async function processImageFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    resolve(`<img src="${url}" alt="Image ${file.name}" style="max-width:100%; height:auto;" />`);
  });
}

// ========================================================================
// COMPARISON WORKFLOW
// ========================================================================

/**
 * Main comparison workflow function
 * Processes both selected files and displays results side by side
 */
async function processFiles() {
  // Validate files are selected
  if (!fileInput1.files[0] || !fileInput2.files[0]) {
    alert("Please select both files before comparing.");
    return;
  }

  // Validate file types
  const file1 = fileInput1.files[0];
  const file2 = fileInput2.files[0];
  
  if (!isFileTypeSupported(file1) || !isFileTypeSupported(file2)) {
    alert("One or both files have unsupported formats.");
    return;
  }

  // Show loading state
  showLoadingState();

  try {
    // Process both files concurrently
    const [html1, html2] = await Promise.all([
      readFile(file1),
      readFile(file2)
    ]);

    // Display processed content
    content1.innerHTML = html1;
    content2.innerHTML = html2;

    // Store file data for navigation
    fileData1 = { 
      name: file1.name, 
      content: html1,
      type: file1.type,
      size: file1.size
    };
    fileData2 = { 
      name: file2.name, 
      content: html2,
      type: file2.type,
      size: file2.size
    };

    // Show results and enable navigation
    showComparisonResults();

  } catch (error) {
    console.error("File processing error:", error);
    alert("Error during file processing: " + error.message);
  } finally {
    hideLoadingState();
  }
}

// ========================================================================
// UI STATE MANAGEMENT
// ========================================================================

/**
 * Shows loading state during file processing
 * Disables buttons and shows loading indicator
 */
function showLoadingState() {
  loadingDiv.style.display = "block";
  compareBtn.disabled = true;
  goToCopyGenBtn.disabled = true;
  goToDesignGenBtn.disabled = true;
}

/**
 * Hides loading state after processing
 * Re-enables compare button
 */
function hideLoadingState() {
  loadingDiv.style.display = "none";
  compareBtn.disabled = false;
}

/**
 * Shows comparison results and enables navigation buttons
 */
function showComparisonResults() {
  document.querySelector(".compare-results").style.display = "block";
  goToCopyGenBtn.disabled = false;
  goToDesignGenBtn.disabled = false;
}

// ========================================================================
// NAVIGATION FUNCTIONS
// ========================================================================

/**
 * Navigates to copy generation page with comparison data
 * Stores comparison data in localStorage for the next page
 */
function goToCopyGeneration() {
  if (!fileData1 || !fileData2) {
    alert("Please compare files first before proceeding.");
    return;
  }
  
  // Store comparison data in localStorage
  localStorage.setItem("compareFile1", JSON.stringify(fileData1));
  localStorage.setItem("compareFile2", JSON.stringify(fileData2));
  localStorage.setItem("fromCompare", "true");
  localStorage.setItem("comparisonTimestamp", Date.now().toString());
  
  // Navigate to copy generation page
  window.location.href = "copyfile.html";
}

/**
 * Navigates to design generation page with comparison data
 * Note: Since designfile.html was removed, this redirects to index.html
 */
function goToDesignGeneration() {
  if (!fileData1 || !fileData2) {
    alert("Please compare files first before proceeding.");
    return;
  }
  
  // Store comparison data in localStorage
  localStorage.setItem("compareFile1", JSON.stringify(fileData1));
  localStorage.setItem("compareFile2", JSON.stringify(fileData2));
  localStorage.setItem("fromCompare", "true");
  localStorage.setItem("comparisonTimestamp", Date.now().toString());
  
  // Navigate to main page (since designfile.html was removed)
  window.location.href = "index.html";
}

// ========================================================================
// EVENT LISTENERS
// ========================================================================

// File selection event listeners
fileInput1.addEventListener("change", enableCompareIfReady);
fileInput2.addEventListener("change", enableCompareIfReady);

// Action button event listeners
compareBtn.addEventListener("click", processFiles);
resetBtn.addEventListener("click", reset);

// Navigation button event listeners
goToCopyGenBtn.addEventListener("click", goToCopyGeneration);
goToDesignGenBtn.addEventListener("click", goToDesignGeneration);

// ========================================================================
// INITIALIZATION
// ========================================================================

/**
 * Initialize the application
 * Sets up initial UI state and clears any previous data
 */
function initializeApp() {
  reset();
  console.log("Compare Files application initialized");
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}