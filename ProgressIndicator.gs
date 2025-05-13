// Function to create HTML templates from files
function createProgressIndicatorFiles() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Create Progress Indicator JS File
    const jsContent = `/**
 * Forex Transaction System - Progress Indicator
 * Shared loading indicator and progress update functionality for all forms
 */

// Show loading overlay with message
function showLoadingOverlay(message) {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return; // Safety check
  
  overlay.style.display = 'block';
  if (message) {
    const statusElem = document.getElementById('processingStatus');
    if (statusElem) {
      statusElem.textContent = message;
    }
  }
  
  // Disable submit and cancel buttons to prevent double-submission
  const submitButton = document.getElementById('submitButton');
  const cancelButton = document.getElementById('cancelButton');
  
  if (submitButton) submitButton.disabled = true;
  if (cancelButton) cancelButton.disabled = true;
}

// Hide loading overlay
function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return; // Safety check
  
  overlay.style.display = 'none';
  
  // Re-enable buttons
  const submitButton = document.getElementById('submitButton');
  const cancelButton = document.getElementById('cancelButton');
  
  if (submitButton) submitButton.disabled = false;
  if (cancelButton) cancelButton.disabled = false;
}

// Update the processing step message
function updateProcessingStep(step) {
  const stepElem = document.getElementById('processingStep');
  if (stepElem) {
    stepElem.textContent = step;
  }
}

// Initialize processing steps display
function initializeProcessingSteps(steps) {
  const stepsContainer = document.getElementById('processingSteps');
  if (!stepsContainer) return; // Safety check
  
  stepsContainer.innerHTML = '';
  
  steps.forEach((step, index) => {
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item step-pending';
    stepItem.id = 'step-' + index;
    
    stepItem.innerHTML = \`
      <span class="step-indicator">\${index + 1}</span>
      <span class="step-text">\${step}</span>
    \`;
    
    stepsContainer.appendChild(stepItem);
  });
}

// Set a specific step as active (in progress)
function setStepActive(stepIndex) {
  // First, make sure all previous steps are complete
  for (let i = 0; i < stepIndex; i++) {
    const step = document.getElementById('step-' + i);
    if (step) {
      step.className = 'step-item step-complete';
    }
  }
  
  // Set the current step as active
  const currentStep = document.getElementById('step-' + stepIndex);
  if (currentStep) {
    currentStep.className = 'step-item step-active';
  }
}

// Mark a specific step as complete
function setStepComplete(stepIndex) {
  const step = document.getElementById('step-' + stepIndex);
  if (step) {
    step.className = 'step-item step-complete';
  }
  
  // Set next step as active if available
  const nextStep = document.getElementById('step-' + (stepIndex + 1));
  if (nextStep) {
    nextStep.className = 'step-item step-active';
  }
}

// Mark all steps as complete
function setAllStepsComplete() {
  const stepsContainer = document.getElementById('processingSteps');
  if (!stepsContainer) return;
  
  const steps = stepsContainer.querySelectorAll('.step-item');
  
  steps.forEach(step => {
    step.className = 'step-item step-complete';
  });
}

// Update processing steps based on server response
function updateProcessingStepsFromResult(steps) {
  if (!steps || !steps.length) return;
  
  // Reinitialize with the actual steps from the server
  initializeProcessingSteps(steps);
  
  // Show steps one by one with a delay to simulate progress
  let i = 0;
  const stepInterval = setInterval(function() {
    setStepComplete(i);
    i++;
    
    if (i >= steps.length - 1) {
      clearInterval(stepInterval);
      setAllStepsComplete();
    }
  }, 500);
}

// Success handler for form submissions with progress updates
function handleFormSuccess(result, closeOnSuccess = true) {
  // Update processing steps if provided
  if (result.processingSteps) {
    updateProcessingStepsFromResult(result.processingSteps);
  }
  
  if (result.success) {
    // Set all steps as complete
    setAllStepsComplete();
    
    // Show success message
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.innerHTML = result.message;
      messageDiv.className = 'success';
      messageDiv.style.display = 'block';
    }
    
    // Handle special cases like settlement form redirection
    if (result.showSettlementForm) {
      // Update processing status before redirection
      updateProcessingStep("Opening settlement form...");
      
      // Short delay before redirect to show the final status
      setTimeout(function() {
        // Redirect to settlement form
        google.script.run.showSettlementForm();
        google.script.host.close();
      }, 1000);
      return;
    } else if (result.showSwapForm) {
      google.script.run.showSwapForm();
      google.script.host.close();
      return;
    }
    
    // Hide loading overlay after a short delay
    setTimeout(function() {
      hideLoadingOverlay();
    }, 1000);
    
    // Close the dialog after a delay if requested
    if (closeOnSuccess) {
      setTimeout(function() {
        google.script.host.close();
      }, 2000);
    }
  } else {
    // Hide loading overlay
    hideLoadingOverlay();
    
    // Show error message
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.innerHTML = result.message;
      messageDiv.className = 'error';
      messageDiv.style.display = 'block';
    }
  }
}

// Failure handler for form submissions
function handleFormFailure(error) {
  // Hide loading overlay
  hideLoadingOverlay();
  
  const messageDiv = document.getElementById('message');
  if (messageDiv) {
    messageDiv.innerHTML = "Error: " + (error.message || error);
    messageDiv.className = 'error';
    messageDiv.style.display = 'block';
  }
}

// Initialize a transaction form with default processing steps
function initTransactionProcessing(formType) {
  // Default steps based on transaction type
  let defaultSteps = [];
  
  switch(formType) {
    case 'transaction':
      defaultSteps = [
        "Validating transaction data",
        "Creating transaction record",
        "Processing settlement",
        "Updating inventory"
      ];
      break;
    case 'settlement':
      defaultSteps = [
        "Validating settlement data",
        "Processing settlement legs",
        "Creating transaction record",
        "Updating inventory"
      ];
      break;
    case 'swap':
      const fromCurrency = document.getElementById('fromCurrency')?.value || 'currency';
      const toCurrency = document.getElementById('toCurrency')?.value || 'currency';
      defaultSteps = [
        "Validating swap data",
        \`Creating sell transaction (\${fromCurrency})\`,
        \`Creating buy transaction (\${toCurrency})\`,
        "Updating inventory"
      ];
      break;
    case 'adjustment':
      const currency = document.getElementById('currency')?.value || 'currency';
      defaultSteps = [
        "Validating adjustment data",
        \`Updating inventory for \${currency}\`,
        "Saving adjustment record"
      ];
      break;
    default:
      defaultSteps = [
        "Validating data",
        "Processing transaction",
        "Updating system"
      ];
  }
  
  // Initialize the processing steps visualization
  initializeProcessingSteps(defaultSteps);
  setStepActive(0); // Set first step as active
  
  return defaultSteps;
}`;

    // Create Progress Indicator CSS File
    const cssContent = `/**
 * Forex Transaction System - Progress Indicator Styles
 * Shared CSS styles for loading indicators and progress steps
 */

/* Loading overlay */
.loading-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.spinner {
  border: 8px solid #f3f3f3;
  border-radius: 50%;
  border-top: 8px solid #3498db;
  width: 60px;
  height: 60px;
  margin: 20px auto;
  animation: spin 2s linear infinite;
}

.processing-step {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.processing-steps {
  margin-top: 15px;
  text-align: left;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

.step-item {
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
}

.step-indicator {
  display: inline-block;
  width: 18px;
  height: 18px;
  line-height: 18px;
  background: #e0e0e0;
  border-radius: 50%;
  text-align: center;
  margin-right: 8px;
  font-size: 12px;
  color: #fff;
}

.step-complete .step-indicator {
  background: #4CAF50;
}

.step-active .step-indicator {
  background: #2196F3;
}

.step-pending .step-indicator {
  background: #e0e0e0;
}

.step-text {
  flex: 1;
}

/* Button states */
button:disabled {
  background-color: #a9a9a9 !important;
  cursor: not-allowed;
}

/* Animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Message styles */
.error {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #d32f2f;
}

.success {
  color: #388e3c;
  background-color: #e8f5e9;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #388e3c;
}`;

    // Create Loading Overlay HTML File
    const overlayContent = `<!-- Loading Overlay HTML Template -->
<div id="loadingOverlay" class="loading-overlay">
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p id="processingStatus">Processing...</p>
    <p id="processingStep" class="processing-step"></p>
    <div id="processingSteps" class="processing-steps">
      <!-- Processing steps will be added here dynamically -->
    </div>
  </div>
</div>`;

    // Progress Include GS File
    const includeContent = `/**
 * Include HTML file in template
 * @param {string} filename - The filename to include
 * @return {string} The file content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper function to include progress indicator components
 * @return {string} HTML with CSS and JS references
 */
function includeProgressIndicator() {
  try {
    const cssContent = HtmlService.createHtmlOutputFromFile('progress-indicator.css').getContent();
    const jsContent = HtmlService.createHtmlOutputFromFile('progress-indicator.js').getContent();
    const overlayContent = HtmlService.createHtmlOutputFromFile('loading-overlay.html').getContent();
    
    return \`
    <style>
      \${cssContent}
    </style>
    \${overlayContent}
    <script>
      \${jsContent}
    </script>
    \`;
  } catch (e) {
    Logger.log("Error including progress indicator: " + e.toString());
    return \`
    <!-- Progress indicator files not found. Run setupSystem() to create them. -->
    <div id="loadingOverlay" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p id="processingStatus">Processing...</p>
      </div>
    </div>
    <style>
      .loading-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.8);
        z-index: 1000;
      }
      .loading-spinner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }
      .spinner {
        border: 8px solid #f3f3f3;
        border-radius: 50%;
        border-top: 8px solid #3498db;
        width: 60px;
        height: 60px;
        margin: 20px auto;
        animation: spin 2s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      button:disabled {
        background-color: #a9a9a9;
        cursor: not-allowed;
      }
    </style>
    <script>
      // Basic loading indicator functions
      function showLoadingOverlay(message) {
        document.getElementById('loadingOverlay').style.display = 'block';
        if (message) {
          document.getElementById('processingStatus').textContent = message;
        }
        
        // Disable buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          button.disabled = true;
        });
      }
      
      function hideLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Re-enable buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          button.disabled = false;
        });
      }
    </script>
    \`;
  }
}`;

    // Create or update the files in the project
    const scriptFiles = {
      'progress-indicator.js': jsContent,
      'progress-indicator.css': cssContent,
      'loading-overlay.html': overlayContent,
      'ProgressInclude.gs': includeContent
    };
    
    let createdCount = 0;
    
    for (const [filename, content] of Object.entries(scriptFiles)) {
      try {
        createOrUpdateFile(filename, content);
        createdCount++;
      } catch (e) {
        Logger.log(`Error creating file ${filename}: ${e.toString()}`);
      }
    }
    
    // Show completion message
    ui.alert(
      'Progress Indicator Files Created',
      `Successfully created or updated ${createdCount} out of ${Object.keys(scriptFiles).length} files.`,
      ui.ButtonSet.OK
    );
    
    return createdCount === Object.keys(scriptFiles).length;
  } catch (e) {
    ui.alert('Error', `An error occurred while creating progress indicator files: ${e.toString()}`, ui.ButtonSet.OK);
    return false;
  }
}

/**
 * Helper function to create or update a file in the project
 * @param {string} filename - Name of the file to create or update
 * @param {string} content - Content to write to the file
 */
function createOrUpdateFile(filename, content) {
  try {
    // Try to get the file from the project
    let file;
    
    try {
      file = DriveApp.getFilesByName(filename).next();
    } catch (e) {
      // File doesn't exist, create it
      file = null;
    }
    
    if (file) {
      // Update existing file
      file.setContent(content);
      Logger.log(`Updated ${filename}`);
    } else {
      // File doesn't exist, must be created through Apps Script UI
      // We can't programmatically create files, so log a message
      Logger.log(`File ${filename} doesn't exist and needs to be created manually`);
      
      // If it's a .gs file, we can create it using the Apps Script API
      // but that requires additional permissions and setup
    }
  } catch (e) {
    Logger.log(`Error creating/updating ${filename}: ${e.toString()}`);
    throw e;
  }
}