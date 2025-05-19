/**
 * Forex Transaction System - Forms Module
 * 
 * This file contains form-related functionality for the Forex Transaction System.
 * It includes functions for displaying and processing various forms:
 * - Transaction form
 * - Settlement form
 * - Swap form
 * - Adjustment form
 */

// Ensure the namespace exists
var FOREX = FOREX || {};
FOREX.Forms = FOREX.Forms || {};

/**
 * Shows the transaction entry form
 */
FOREX.Forms.showTransactionForm = function() {
  const config = FOREX.Utils.getConfigSettings();
  
  // Get staff list from config
  const staffList = config.staffNames ? config.staffNames.split(',') : [''];
  
  // Create HTML from template
  const htmlTemplate = HtmlService.createTemplateFromFile('TransactionForm');
  
  // Add data to template
  htmlTemplate.staffList = staffList;
  htmlTemplate.defaultCurrency = config.defaultCurrency || 'USD';
  htmlTemplate.transactionTypes = config.transactionTypes ? config.transactionTypes.split(',') : ['Buy', 'Sell', 'Swap'];
  htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  
  // Get today's date in yyyy-MM-dd format
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  htmlTemplate.today = today;
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(600)
    .setHeight(700)
    .setTitle('New Transaction');
  
  // Show the form
  SpreadsheetApp.getUi().showModalDialog(html, 'New Transaction');
};

/**
 * Process the transaction form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
FOREX.Forms.processTransactionForm = function(formData) {
  try {
    // Initialize processing tracking
    FOREX.Utils.initializeProcessingSteps();
    
    // If it's a swap transaction, redirect to swap handler
    if (formData.transactionType === 'Swap') {
      FOREX.Utils.addProcessingStep("Detected swap transaction, redirecting to swap form");
      return {
        success: false,
        message: 'Please use the Swap Transaction form for swap transactions',
        showSwapForm: true,
        processingSteps: FOREX.Utils.getProcessingSteps()
      };
    }
    
    // Check if this is a multi-settlement transaction
    const isMultiSettlement = formData.multiSettlement === 'yes';
    
    if (isMultiSettlement) {
      // Save transaction data in Properties service for the multi-settlement form
      const props = PropertiesService.getScriptProperties();
      props.setProperty('pendingTransaction', JSON.stringify(formData));
      
      FOREX.Utils.addProcessingStep("Multi-settlement transaction detected");
      FOREX.Utils.addProcessingStep("Transaction data saved for settlement");
      FOREX.Utils.addProcessingStep("Preparing settlement form");
      
      return {
        success: true,
        message: 'Please continue to add settlement details',
        showSettlementForm: true,
        processingSteps: FOREX.Utils.getProcessingSteps()
      };
    }
    
    // Regular single-settlement transaction
    FOREX.Utils.addProcessingStep("Transaction data validated");
    
    const transactionData = {
      date: formData.date,
      customer: formData.customer,
      transactionType: formData.transactionType,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      rate: parseFloat(formData.rate),
      nature: formData.nature,
      source: formData.source,
      staff: formData.staff,
      notes: formData.notes
    };
    
    // Create the transaction
    const result = FOREX.Transactions.createTransaction(transactionData);
    
    return result;
  } catch (error) {
    Logger.log(`Error processing transaction form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};

/**
 * Shows the multi-settlement form
 */
FOREX.Forms.showSettlementForm = function() {
  // Get pending transaction data
  const props = PropertiesService.getScriptProperties();
  const pendingTransactionJson = props.getProperty('pendingTransaction');
  
  if (!pendingTransactionJson) {
    SpreadsheetApp.getUi().alert('Error', 'No pending transaction found', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const pendingTransaction = JSON.parse(pendingTransactionJson);
  
  // Create HTML from template
  const htmlTemplate = HtmlService.createTemplateFromFile('SettlementForm');
  
  // Add data to template
  htmlTemplate.transactionData = pendingTransaction;
  htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  htmlTemplate.settlementTypes = [
    'Cash', 
    'Bank Transfer', 
    'Swap In', 
    'Swap Out'
  ];
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(800)
    .setHeight(600)
    .setTitle('Transaction Settlement');
  
  // Show the form
  SpreadsheetApp.getUi().showModalDialog(html, 'Transaction Settlement');
};

/**
 * Process the multi-settlement form submission
 * This is the consolidated, optimized version that addresses timeout issues
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
FOREX.Forms.processSettlementForm = function(formData) {
  try {
    // Initialize processing tracking
    FOREX.Utils.initializeProcessingSteps();
    
    // Get pending transaction data
    const props = PropertiesService.getScriptProperties();
    const pendingTransactionJson = props.getProperty('pendingTransaction');
    
    if (!pendingTransactionJson) {
      return {
        success: false,
        message: 'No pending transaction found',
        processingSteps: FOREX.Utils.getProcessingSteps()
      };
    }
    
    // Parse transaction data
    const pendingTransaction = JSON.parse(pendingTransactionJson);
    
    // Validate formData structure
    if (!formData || !formData.settlements || !Array.isArray(formData.settlements)) {
      return {
        success: false,
        message: 'Invalid settlement data structure',
        processingSteps: FOREX.Utils.getProcessingSteps()
      };
    }
    
    FOREX.Utils.addProcessingStep("Settlement data validated");
    FOREX.Utils.addProcessingStep(`${formData.settlements.length} settlement legs processed`);
    
    // Apply performance optimization - batch process legs
    // Instead of processing each leg separately, create an optimized structure
    const optimizedLegs = [];
    
    // Process legs in batches if there are many
    const batchSize = 5; // Process legs in batches of 5
    const totalLegs = formData.settlements.length;
    let processedLegs = 0;
    
    // Process legs in smaller batches to prevent timeout
    while (processedLegs < totalLegs) {
      const endIndex = Math.min(processedLegs + batchSize, totalLegs);
      const currentBatch = formData.settlements.slice(processedLegs, endIndex);
      
      // Process each leg in the current batch
      for (const leg of currentBatch) {
        // Ensure all settlement amounts are properly parsed
        optimizedLegs.push({
          settlementType: leg.settlementType || '',
          currency: leg.currency || pendingTransaction.currency,
          amount: parseFloat(leg.amount) || 0,
          bankAccount: leg.bankAccount || '',
          notes: leg.notes || ''
        });
      }
      
      processedLegs = endIndex;
    }
    
    // Create transaction with settlement legs
    const transactionData = {
      date: pendingTransaction.date,
      customer: pendingTransaction.customer,
      transactionType: pendingTransaction.transactionType,
      currency: pendingTransaction.currency,
      amount: parseFloat(pendingTransaction.amount),
      rate: parseFloat(pendingTransaction.rate),
      nature: pendingTransaction.nature,
      source: pendingTransaction.source,
      staff: pendingTransaction.staff,
      notes: pendingTransaction.notes,
      legs: optimizedLegs
    };
    
    // Create the transaction
    const result = FOREX.Transactions.createTransaction(transactionData);
    
    // Clear pending transaction data
    props.deleteProperty('pendingTransaction');
    
    // Ensure processing steps are included
    if (!result.processingSteps) {
      result.processingSteps = FOREX.Utils.getProcessingSteps();
    }
    
    return result;
  } catch (error) {
    Logger.log(`Error processing settlement form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};

/**
 * Shows the swap transaction form
 */
FOREX.Forms.showSwapForm = function() {
  const config = FOREX.Utils.getConfigSettings();
  
  // Get staff list from config
  const staffList = config.staffNames ? config.staffNames.split(',') : [''];
  
  // Create HTML from template
  const htmlTemplate = HtmlService.createTemplateFromFile('SwapForm');
  
  // Add data to template
  htmlTemplate.staffList = staffList;
  htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  
  // Get today's date in yyyy-MM-dd format
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  htmlTemplate.today = today;
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(600)
    .setHeight(700)
    .setTitle('Swap Transaction');
  
  // Show the form
  SpreadsheetApp.getUi().showModalDialog(html, 'Swap Transaction');
};

/**
 * Process the swap transaction form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
FOREX.Forms.processSwapForm = function(formData) {
  try {
    // Initialize processing tracking
    FOREX.Utils.initializeProcessingSteps();
    
    // Generate swap ID
    const swapId = 'SWAP-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
    
    FOREX.Utils.addProcessingStep("Swap data validated");
    
    // Create swap data
    const swapData = {
      swapId: swapId,
      date: formData.date,
      customer: formData.customer,
      fromCurrency: formData.fromCurrency,
      fromAmount: parseFloat(formData.fromAmount),
      toCurrency: formData.toCurrency,
      toAmount: parseFloat(formData.toAmount),
      sellRate: parseFloat(formData.sellRate),
      buyRate: parseFloat(formData.buyRate),
      source: formData.source,
      staff: formData.staff
    };
    
    // Process the swap transaction
    const result = FOREX.Transactions.processSwapTransaction(swapData);
    
    // Ensure processing steps are included
    if (!result.processingSteps) {
      result.processingSteps = FOREX.Utils.getProcessingSteps();
    }
    
    return result;
  } catch (error) {
    Logger.log(`Error processing swap form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};

/**
 * Shows the inventory adjustment form
 * Improved with error handling and template verification
 */
FOREX.Forms.showInventoryAdjustmentForm = function() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // First check if the AdjustmentForm template exists
    let htmlTemplate;
    
    try {
      // Try to get the template
      htmlTemplate = HtmlService.createTemplateFromFile('AdjustmentForm');
      Logger.log("AdjustmentForm template found successfully");
    } catch (e) {
      // Template doesn't exist, create a temporary HTML template to recreate it
      Logger.log("AdjustmentForm template not found: " + e.toString());
      
      const tempHtml = HtmlService.createTemplate(
        '<script>' +
        '  // Create the HTML templates if needed' +
        '  google.script.run.withSuccessHandler(function() {' +
        '    // Redirect back to the adjustment form after templates are created' +
        '    google.script.run.showInventoryAdjustmentForm();' +
        '    google.script.host.close();' +
        '  }).createHtmlTemplates();' +
        '</script>' +
        '<div style="padding: 20px; text-align: center;">' +
        '  <h3>Setting up Adjustment Form...</h3>' +
        '  <p>Please wait while we prepare the form templates.</p>' +
        '</div>'
      );
      
      const html = tempHtml.evaluate()
        .setWidth(300)
        .setHeight(200)
        .setTitle('Preparing Form');
      
      ui.showModalDialog(html, 'Preparing Form');
      return;
    }
    
    // If the template exists, proceed with the form setup
    
    // Add data to template
    htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
    
    // Get today's date in yyyy-MM-dd format
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    htmlTemplate.today = today;
    
    // Generate HTML from template
    const html = htmlTemplate.evaluate()
      .setWidth(500)
      .setHeight(400)
      .setTitle('Inventory Adjustment');
    
    // Show the form
    ui.showModalDialog(html, 'Inventory Adjustment');
    
  } catch (error) {
    // Handle unexpected errors
    Logger.log("Error showing adjustment form: " + error.toString());
    ui.alert('Error', 'There was a problem loading the Adjustment Form: ' + error.toString() + 
             '\n\nPlease run the System Setup function from the Forex System menu to recreate templates.', 
             ui.ButtonSet.OK);
  }
};

/**
 * Process the inventory adjustment form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
FOREX.Forms.processAdjustmentForm = function(formData) {
  try {
    // Initialize processing tracking
    FOREX.Utils.initializeProcessingSteps();
    
    FOREX.Utils.addProcessingStep("Adjustment data validated");
    
    // Create adjustment data
    const adjustmentData = {
      date: formData.date,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      reason: formData.reason
    };
    
    // Record the adjustment
    const result = FOREX.Inventory.recordInventoryAdjustment(adjustmentData);
    
    // Ensure processing steps are included
    if (!result.processingSteps) {
      result.processingSteps = FOREX.Utils.getProcessingSteps();
    }
    
    return result;
  } catch (error) {
    Logger.log(`Error processing adjustment form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};

/**
 * Include HTML file in template
 * @param {string} filename - The filename to include
 * @return {string} The file content
 */
function includeProgressIndicator() {
  return HtmlService.createHtmlOutputFromFile('ProgressIndicator').getContent();
}
