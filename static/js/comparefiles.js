/**
 * JavaScript for comparefiles.html - File Comparison Workflow
 * Compares files and generates content using JSON endpoints
 */

let file1Content = '';
let file2Content = '';
let comparisonResults = null;
let isComparing = false;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeComparefilesEventListeners();
    initializeComparefilesUI();
});

// ========================================================================
// EVENT LISTENERS
// ========================================================================

function initializeComparefilesEventListeners() {
    // File input handling
    const file1Input = document.getElementById('file1Input');
    const file2Input = document.getElementById('file2Input');
    
    if (file1Input) {
        file1Input.addEventListener('change', (e) => handleFileInput(e, 1));
    }
    if (file2Input) {
        file2Input.addEventListener('change', (e) => handleFileInput(e, 2));
    }

    // Text area handling for direct input
    const file1Textarea = document.getElementById('file1Textarea');
    const file2Textarea = document.getElementById('file2Textarea');
    
    if (file1Textarea) {
        file1Textarea.addEventListener('input', (e) => handleTextInput(e, 1));
    }
    if (file2Textarea) {
        file2Textarea.addEventListener('input', (e) => handleTextInput(e, 2));
    }

    // Compare button
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.addEventListener('click', handleCompareFiles);
    }

    // Generate content buttons
    const generateCopyBtn = document.getElementById('generateCopyBtn');
    const generateDesignBtn = document.getElementById('generateDesignBtn');
    
    if (generateCopyBtn) {
        generateCopyBtn.addEventListener('click', () => handleGenerateFromComparison('copy'));
    }
    if (generateDesignBtn) {
        generateDesignBtn.addEventListener('click', () => handleGenerateFromComparison('design'));
    }

    // Clear button
    const clearCompareBtn = document.getElementById('clearCompareBtn');
    if (clearCompareBtn) {
        clearCompareBtn.addEventListener('click', handleClearComparison);
    }
}

// ========================================================================
// FILE INPUT HANDLING (NEW APPROACH - TEXT EXTRACTION)
// ========================================================================

function handleFileInput(event, fileNumber) {
    const file = event.target.files[0];
    if (!file) return;

    // Read file content as text (simplified approach)
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        if (fileNumber === 1) {
            file1Content = content;
            document.getElementById('file1Textarea').value = content;
            document.getElementById('file1Name').textContent = file.name;
        } else {
            file2Content = content;
            document.getElementById('file2Textarea').value = content;
            document.getElementById('file2Name').textContent = file.name;
        }
        
        updateComparefilesUIState();
        showAlert(`File ${fileNumber} loaded successfully!`, 'success');
    };
    
    reader.onerror = function() {
        showAlert(`Error reading file ${fileNumber}`, 'error');
    };
    
    reader.readAsText(file);
}

function handleTextInput(event, fileNumber) {
    const content = event.target.value;
    
    if (fileNumber === 1) {
        file1Content = content;
    } else {
        file2Content = content;
    }
    
    updateComparefilesUIState();
}

// ========================================================================
// FILE COMPARISON (NEW JSON APPROACH)
// ========================================================================

function handleCompareFiles() {
    if (!file1Content.trim() || !file2Content.trim()) {
        showAlert('Please provide content for both files before comparing.', 'warning');
        return;
    }

    if (isComparing) {
        return;
    }

    compareFilesWithJSON();
}

function compareFilesWithJSON() {
    setCompareLoadingState(true);

    // NEW APPROACH: Send JSON payload
    fetch('/api/compare-files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            file1: {
                content: file1Content,
                type: 'text',
                name: 'file1.txt'
            },
            file2: {
                content: file2Content,
                type: 'text',
                name: 'file2.txt'
            }
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Store and display comparison results
        comparisonResults = data;
        displayComparisonResults(data);
        
        showAlert('File comparison completed successfully!', 'success');
        
    })
    .catch(error => {
        console.error('Comparison error:', error);
        showAlert('Failed to compare files: ' + error.message, 'error');
    })
    .finally(() => {
        setCompareLoadingState(false);
    });
}

function displayComparisonResults(results) {
    // Update metric displays
    updateComparisonMetric('similarityScore', results.similarity);
    updateComparisonMetric('contentMatchScore', results.contentMatch);
    updateComparisonMetric('structureScore', results.structure);
    updateComparisonMetric('compatibilityScore', results.compatibility);

    // Update progress bars
    animateComparisonProgressBar('similarityBar', results.similarity);
    animateComparisonProgressBar('contentMatchBar', results.contentMatch);
    animateComparisonProgressBar('structureBar', results.structure);
    animateComparisonProgressBar('compatibilityBar', results.compatibility);

    // Show results section
    const resultsSection = document.getElementById('comparisonResults');
    if (resultsSection) {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Enable generation buttons
    document.getElementById('generateCopyBtn').disabled = false;
    document.getElementById('generateDesignBtn').disabled = false;
}

// ========================================================================
// CONTENT GENERATION FROM COMPARISON (NEW JSON APPROACH)
// ========================================================================

function handleGenerateFromComparison(type) {
    if (!comparisonResults) {
        showAlert('Please compare files first before generating content.', 'warning');
        return;
    }

    generateContentFromComparison(type);
}

function generateContentFromComparison(generationType) {
    const generateBtn = document.getElementById(generationType === 'copy' ? 'generateCopyBtn' : 'generateDesignBtn');
    const originalText = generateBtn.textContent;
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    // NEW APPROACH: Send JSON payload
    fetch('/api/generate-from-comparison', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            file1Content: file1Content,
            file2Content: file2Content,
            generationType: generationType
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Display generated content
        displayGeneratedContent(data.content, generationType);
        
        showAlert(`${generationType.charAt(0).toUpperCase() + generationType.slice(1)} generated successfully!`, 'success');
        
    })
    .catch(error => {
        console.error('Generation error:', error);
        showAlert(`Failed to generate ${generationType}: ` + error.message, 'error');
    })
    .finally(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
    });
}

function displayGeneratedContent(content, type) {
    if (type === 'design') {
        // Display HTML design
        const designPreview = document.getElementById('generatedDesignPreview');
        const designCode = document.getElementById('generatedDesignCode');
        
        if (designPreview) {
            designPreview.innerHTML = content;
            designPreview.style.display = 'block';
        }
        if (designCode) {
            designCode.value = content;
        }
    } else {
        // Display copy text
        const copyResult = document.getElementById('generatedCopyResult');
        if (copyResult) {
            copyResult.value = content;
        }
    }

    // Show generated content section
    const generatedSection = document.getElementById('generatedContent');
    if (generatedSection) {
        generatedSection.style.display = 'block';
        generatedSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// ========================================================================
// UI HELPER FUNCTIONS
// ========================================================================

function updateComparisonMetric(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value + '%';
        element.classList.add('metric-updated');
        setTimeout(() => {
            element.classList.remove('metric-updated');
        }, 1000);
    }
}

function animateComparisonProgressBar(barId, value) {
    const bar = document.getElementById(barId);
    if (bar) {
        let currentValue = 0;
        const targetValue = Math.min(100, Math.max(0, value));
        const increment = targetValue / 20;
        
        const animation = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(animation);
            }
            
            bar.style.width = currentValue + '%';
            bar.setAttribute('aria-valuenow', Math.round(currentValue));
        }, 50);
        
        // Add color class based on value
        bar.className = bar.className.replace(/\bbg-\w+/g, '');
        if (targetValue >= 80) {
            bar.classList.add('bg-success');
        } else if (targetValue >= 60) {
            bar.classList.add('bg-warning');
        } else {
            bar.classList.add('bg-danger');
        }
    }
}

// ========================================================================
// EVENT HANDLERS
// ========================================================================

function handleClearComparison() {
    if (confirm('Are you sure you want to clear all content?')) {
        // Clear file inputs
        document.getElementById('file1Input').value = '';
        document.getElementById('file2Input').value = '';
        
        // Clear textareas
        document.getElementById('file1Textarea').value = '';
        document.getElementById('file2Textarea').value = '';
        
        // Clear generated content
        document.getElementById('generatedCopyResult').value = '';
        document.getElementById('generatedDesignCode').value = '';
        
        const designPreview = document.getElementById('generatedDesignPreview');
        if (designPreview) {
            designPreview.innerHTML = '';
            designPreview.style.display = 'none';
        }
        
        // Clear file names
        document.getElementById('file1Name').textContent = 'No file selected';
        document.getElementById('file2Name').textContent = 'No file selected';
        
        // Reset variables
        file1Content = '';
        file2Content = '';
        comparisonResults = null;
        
        // Hide results sections
        document.getElementById('comparisonResults').style.display = 'none';
        document.getElementById('generatedContent').style.display = 'none';
        
        updateComparefilesUIState();
        showAlert('All content cleared.', 'info');
    }
}

// ========================================================================
// UI STATE MANAGEMENT
// ========================================================================

function updateComparefilesUIState() {
    const hasContent = file1Content.trim().length > 0 && file2Content.trim().length > 0;
    const hasResults = comparisonResults !== null;
    
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.disabled = !hasContent || isComparing;
    }
    
    const generateCopyBtn = document.getElementById('generateCopyBtn');
    const generateDesignBtn = document.getElementById('generateDesignBtn');
    
    if (generateCopyBtn) {
        generateCopyBtn.disabled = !hasResults;
    }
    if (generateDesignBtn) {
        generateDesignBtn.disabled = !hasResults;
    }
    
    const clearBtn = document.getElementById('clearCompareBtn');
    if (clearBtn) {
        clearBtn.disabled = !hasContent && !hasResults;
    }
}

function setCompareLoadingState(loading) {
    isComparing = loading;
    
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn) {
        compareBtn.disabled = loading;
        compareBtn.textContent = loading ? 'Comparing...' : 'Compare Files';
        
        if (loading) {
            compareBtn.classList.add('loading');
        } else {
            compareBtn.classList.remove('loading');
        }
    }
}

function initializeComparefilesUI() {
    updateComparefilesUIState();
    
    // Hide results sections initially
    document.getElementById('comparisonResults').style.display = 'none';
    document.getElementById('generatedContent').style.display = 'none';
    document.getElementById('generatedDesignPreview').style.display = 'none';
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function showAlert(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${getBootstrapAlertClass(type)} alert-dismissible fade show custom-alert`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const mainContent = document.querySelector('.container') || document.body;
    mainContent.insertBefore(alert, mainContent.firstChild);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function getBootstrapAlertClass(type) {
    const classMap = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return classMap[type] || 'info';
}

console.log('✅ Comparefiles JavaScript loaded successfully');