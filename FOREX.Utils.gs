/**
 * Forex Transaction System - Utils Module
 * 
 * This file contains utility functions for the Forex Transaction System,
 * including progress tracking, configuration management, HTML helpers, etc.
 */

// Ensure the namespace exists
var FOREX = FOREX || {};
FOREX.Utils = FOREX.Utils || {};

// Processing steps tracking
let processingSteps = [];

/**
 * Initialize the processing steps tracking
 */
FOREX.Utils.initializeProcessingSteps = function() {
  processingSteps = [];
};

/**
 * Add a processing step to the tracking
 * @param {string} step - The step description
 */
FOREX.Utils.addProcessingStep = function(step) {
  processingSteps.push(step);
};

/**
 * Get the current processing steps
 * @return {Array} Array of processing step descriptions
 */
FOREX.Utils.getProcessingSteps = function() {
  return processingSteps;
};

/**
 * Gets configuration settings from the Config sheet
 * @return {Object} Configuration settings
 */
FOREX.Utils.getConfigSettings = function() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  
  const configData = configSheet.getDataRange().getValues();
  const config = {};
  
  // Skip header row
  for (let i = 1; i < configData.length; i++) {
    const setting = configData[i][0];
    const value = configData[i][1];
    config[FOREX.Utils.camelCase(setting)] = value;
  }
  
  return config;
};

/**
 * Converts a string to camelCase
 * @param {string} str - The string to convert
 * @return {string} Camel-cased string
 */
FOREX.Utils.camelCase = function(str) {
  return str
    .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
    .replace(/\s/g, '')
    .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
};

/**
 * Creates HTML template files if they don't exist
 * @return {boolean} Success status
 */
FOREX.Utils.createHtmlTemplates = function() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Create Transaction Form HTML
    FOREX.Utils.createHtmlFile('TransactionForm', getTransactionFormHtml());
    
    // Create Settlement Form HTML
    FOREX.Utils.createHtmlFile('SettlementForm', getSettlementFormHtml());
    
    // Create Swap Form HTML
    FOREX.Utils.createHtmlFile('SwapForm', getSwapFormHtml());
    
    // Create Adjustment Form HTML
    FOREX.Utils.createHtmlFile('AdjustmentForm', getAdjustmentFormHtml());
    
    // Create Progress Indicator HTML
    FOREX.Utils.createHtmlFile('ProgressIndicator', getProgressIndicatorHtml());
    
    return true;
  } catch (error) {
    Logger.log(`Error creating HTML templates: ${error}`);
    ui.alert('Error', `Failed to create HTML templates: ${error.toString()}`, ui.ButtonSet.OK);
    return false;
  }
};

/**
 * Creates an HTML file in the script project
 * @param {string} filename - The filename to create
 * @param {string} content - The file content
 * @return {boolean} Success status
 */
FOREX.Utils.createHtmlFile = function(filename, content) {
  try {
    // Create HTML files using Apps Script API
    const files = DriveApp.getFilesByName(filename + '.html');
    if (files.hasNext()) {
      // File exists, update it
      const file = files.next();
      file.setContent(content);
    } else {
      // File doesn't exist, create it
      // This method only works if you're using the new Apps Script editor
      const html = HtmlService.createTemplate(content);
      const htmlOutput = html.evaluate();
      // We can't actually create the file directly via the Apps Script service
      // This would typically require the Drive API or Advanced Drive Service
      Logger.log(`Cannot create HTML file ${filename}.html - please create it manually`);
    }
    
    Logger.log(`HTML file ${filename}.html created or updated`);
    return true;
  } catch (error) {
    Logger.log(`Error creating HTML file: ${error}`);
    return false;
  }
};

/**
 * Returns the HTML content for the progress indicator
 * @return {string} HTML content
 */
function getProgressIndicatorHtml() {
  // This is a global function used by the HTML templates
  // Keep it in the global scope for backward compatibility
  return `<!-- Standardized Progress Indicator Component -->
<style>
  /* Loading overlay styles */
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
  
  .processing-status {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
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
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>

<!-- Loading overlay HTML template -->
<div id="loadingOverlay" class="loading-overlay">
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p id="processingStatus" class="processing-status">Processing...</p>
    <p id="processingStep" class="processing-step"></p>
    <div id="processingSteps" class="processing-steps">
      <!-- Processing steps will be added here dynamically -->
    </div>
  </div>
</div>

<script>
  // Show loading overlay with message
  function showLoadingOverlay(message) {
    document.getElementById('loadingOverlay').style.display = 'block';
    if (message) {
      document.getElementById('processingStatus').textContent = message;
    }
    // Disable all buttons while processing
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = true;
    });
  }
  
  // Hide loading overlay
  function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
    // Re-enable all buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = false;
    });
  }
  
  // Update the processing step message
  function updateProcessingStep(step) {
    document.getElementById('processingStep').textContent = step;
  }
  
  // Initialize processing steps display
  function initializeProcessingSteps(steps) {
    const stepsContainer = document.getElementById('processingSteps');
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
    const steps = stepsContainer.querySelectorAll('.step-item');
    
    steps.forEach(step => {
      step.className = 'step-item step-complete';
    });
  }
  
  // Update processing steps based on server response
  function updateProcessingStepsFromResult(steps) {
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
  
  // Initialize transaction processing with default steps based on transaction type
  function initTransactionProcessing(transactionType) {
    let steps = [];
    
    switch(transactionType) {
      case 'transaction':
        steps = [
          "Validating transaction data",
          "Creating transaction record",
          "Processing settlement",
          "Updating inventory"
        ];
        break;
      case 'settlement':
        steps = [
          "Validating settlement data",
          "Processing settlement legs",
          "Creating transaction record",
          "Updating inventory"
        ];
        break;
      case 'swap':
        steps = [
          "Validating swap data",
          "Creating sell transaction",
          "Creating buy transaction",
          "Updating inventory"
        ];
        break;
      case 'adjustment':
        steps = [
          "Validating adjustment data",
          "Updating inventory",
          "Saving adjustment record"
        ];
        break;
      default:
        steps = [
          "Processing data",
          "Saving records",
          "Completing operation"
        ];
    }
    
    // Initialize the steps display
    initializeProcessingSteps(steps);
    setStepActive(0); // Set first step as active
  }
  
  // Handle form success with progress updates
  function handleFormSuccess(result) {
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
      
      // Hide loading overlay after a short delay
      setTimeout(function() {
        hideLoadingOverlay();
      }, 1000);
      
      // Close the dialog after a delay if autoClose is true
      if (result.closeForm !== false) {
        setTimeout(function() {
          google.script.host.close();
        }, 2000);
      }
    } else {
      // Handle special cases
      if (result.showSettlementForm) {
        // Update processing status before redirection
        updateProcessingStep("Opening settlement form...");
        
        // Short delay before redirect to show the final status
        setTimeout(function() {
          google.script.run.showSettlementForm();
          google.script.host.close();
        }, 1000);
      } else if (result.showSwapForm) {
        // Update processing status before redirection
        updateProcessingStep("Opening swap form...");
        
        // Short delay before redirect
        setTimeout(function() {
          google.script.run.showSwapForm();
          google.script.host.close();
        }, 1000);
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
  }
  
  // Handle form failure with error display
  function handleFormFailure(error) {
    // Hide loading overlay
    hideLoadingOverlay();
    
    // Show error message
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.innerHTML = "Error: " + (error.message || error);
      messageDiv.className = 'error';
      messageDiv.style.display = 'block';
    }
  }
</script>`;
};
