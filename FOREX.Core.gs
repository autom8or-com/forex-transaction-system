/**
 * Forex Transaction System - Core Module
 * 
 * This file contains the core functionality for system initialization
 * and global namespace management.
 */

// Ensure the namespace exists
var FOREX = FOREX || {};
FOREX.Core = FOREX.Core || {};

/**
 * Initialize the FOREX system
 * This function initializes the system and maps global functions to their namespaced equivalents
 * to maintain backward compatibility while enabling modular organization.
 */
FOREX.Core.init = function() {
  Logger.log("Initializing FOREX system...");
  
  try {
    // Process form functions
    if (typeof FOREX.Forms !== 'undefined') {
      window.processTransactionForm = FOREX.Forms.processTransactionForm;
      window.processSettlementForm = FOREX.Forms.processSettlementForm;
      window.processSwapForm = FOREX.Forms.processSwapForm;
      window.processAdjustmentForm = FOREX.Forms.processAdjustmentForm;
      
      // Show form functions
      window.showTransactionForm = FOREX.Forms.showTransactionForm;
      window.showSettlementForm = FOREX.Forms.showSettlementForm;
      window.showSwapForm = FOREX.Forms.showSwapForm;
      window.showInventoryAdjustmentForm = FOREX.Forms.showInventoryAdjustmentForm;
    }
    
    // HTML Template functions
    if (typeof FOREX.Templates !== 'undefined') {
      window.getTransactionFormHtml = FOREX.Templates.getTransactionFormHtml;
      window.getSettlementFormHtml = FOREX.Templates.getSettlementFormHtml;
      window.getSwapFormHtml = FOREX.Templates.getSwapFormHtml;
      window.getAdjustmentFormHtml = FOREX.Templates.getAdjustmentFormHtml;
      window.getProgressIndicatorHtml = FOREX.Templates.getProgressIndicatorHtml;
      window.includeProgressIndicator = FOREX.Templates.includeProgressIndicator;
    }
    
    // Transaction functions
    if (typeof FOREX.Transactions !== 'undefined') {
      window.createTransaction = FOREX.Transactions.createTransaction;
      window.processSwapTransaction = FOREX.Transactions.processSwapTransaction;
    }
    
    // Inventory functions
    if (typeof FOREX.Inventory !== 'undefined') {
      window.updateDailyInventory = FOREX.Inventory.updateDailyInventory;
      window.updateInventoryForDateAndCurrency = FOREX.Inventory.updateInventoryForDateAndCurrency;
      window.recordInventoryAdjustment = FOREX.Inventory.recordInventoryAdjustment;
    }
    
    // Report functions
    if (typeof FOREX.Reports !== 'undefined') {
      window.generateDailyReport = FOREX.Reports.generateDailyReport;
      window.generateStaffReport = FOREX.Reports.generateStaffReport;
      window.generateCustomerReport = FOREX.Reports.generateCustomerReport;
    }
    
    // Utility functions
    if (typeof FOREX.Utils !== 'undefined') {
      window.getConfigSettings = FOREX.Utils.getConfigSettings;
      window.createHtmlFile = FOREX.Utils.createHtmlFile;
      window.createHtmlTemplates = FOREX.Utils.createHtmlTemplates;
      window.camelCase = FOREX.Utils.camelCase;
      
      // Progress tracking
      window.initializeProcessingSteps = FOREX.Utils.initializeProcessingSteps;
      window.addProcessingStep = FOREX.Utils.addProcessingStep;
      window.getProcessingSteps = FOREX.Utils.getProcessingSteps;
    }
    
    Logger.log("FOREX system initialization complete.");
    return true;
  } catch (error) {
    Logger.log(`Error initializing FOREX system: ${error}`);
    return false;
  }
};

/**
 * Run this function to test the FOREX system initialization
 */
function testForexInit() {
  const result = FOREX.Core.init();
  if (result) {
    Logger.log("FOREX system initialization test passed successfully!");
  } else {
    Logger.log("FOREX system initialization test failed!");
  }
}
