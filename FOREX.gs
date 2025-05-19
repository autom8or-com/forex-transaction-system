/**
 * Forex Transaction System - Core Module
 * 
 * This file contains the global namespace for the Forex Transaction System
 * and sets up the structure for modular organization of code.
 * 
 * The system is organized into the following modules:
 * - FOREX.Core: Core functions and system initialization
 * - FOREX.Forms: Form handling and processing
 * - FOREX.Inventory: Inventory management
 * - FOREX.Transactions: Transaction processing
 * - FOREX.Reports: Reporting and analytics
 * - FOREX.Utils: Utility functions
 */

// Global namespace
var FOREX = FOREX || {};

// Core module
FOREX.Core = FOREX.Core || {};

// Form handlers module
FOREX.Forms = FOREX.Forms || {};

// Inventory management module
FOREX.Inventory = FOREX.Inventory || {};

// Transaction processing module
FOREX.Transactions = FOREX.Transactions || {};

// Reporting module
FOREX.Reports = FOREX.Reports || {};

// Utilities module
FOREX.Utils = FOREX.Utils || {};

/**
 * Initialize the FOREX system and register global functions
 * This function maps global function names to their namespaced equivalents
 * to maintain backward compatibility while enabling modular organization.
 */
FOREX.initialize = function() {
  // Process form functions
  processTransactionForm = FOREX.Forms.processTransactionForm;
  processSettlementForm = FOREX.Forms.processSettlementForm;
  processSwapForm = FOREX.Forms.processSwapForm;
  processAdjustmentForm = FOREX.Forms.processAdjustmentForm;
  
  // Show form functions
  showTransactionForm = FOREX.Forms.showTransactionForm;
  showSettlementForm = FOREX.Forms.showSettlementForm;
  showSwapForm = FOREX.Forms.showSwapForm;
  showInventoryAdjustmentForm = FOREX.Forms.showInventoryAdjustmentForm;
  
  // Transaction functions
  createTransaction = FOREX.Transactions.createTransaction;
  processSwapTransaction = FOREX.Transactions.processSwapTransaction;
  
  // Inventory functions
  updateDailyInventory = FOREX.Inventory.updateDailyInventory;
  updateInventoryForDateAndCurrency = FOREX.Inventory.updateInventoryForDateAndCurrency;
  recordInventoryAdjustment = FOREX.Inventory.recordInventoryAdjustment;
  
  // Report functions
  generateDailyReport = FOREX.Reports.generateDailyReport;
  generateStaffReport = FOREX.Reports.generateStaffReport;
  generateCustomerReport = FOREX.Reports.generateCustomerReport;
  
  // Utility functions
  getConfigSettings = FOREX.Utils.getConfigSettings;
  createHtmlFile = FOREX.Utils.createHtmlFile;
  createHtmlTemplates = FOREX.Utils.createHtmlTemplates;
  camelCase = FOREX.Utils.camelCase;
  
  // Progress tracking
  initializeProcessingSteps = FOREX.Utils.initializeProcessingSteps;
  addProcessingStep = FOREX.Utils.addProcessingStep;
  getProcessingSteps = FOREX.Utils.getProcessingSteps;
};
