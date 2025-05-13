/**
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
    
    stepItem.innerHTML = `
      <span class="step-indicator">${index + 1}</span>
      <span class="step-text">${step}</span>
    `;
    
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
        `Creating sell transaction (${fromCurrency})`,
        `Creating buy transaction (${toCurrency})`,
        "Updating inventory"
      ];
      break;
    case 'adjustment':
      const currency = document.getElementById('currency')?.value || 'currency';
      defaultSteps = [
        "Validating adjustment data",
        `Updating inventory for ${currency}`,
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
}
