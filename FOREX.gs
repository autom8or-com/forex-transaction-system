/**
 * Forex Transaction System - Main Namespace
 * 
 * This file defines the namespace structure for the Forex Transaction System.
 * All functionality is organized into modules within the FOREX namespace.
 */

// Global namespace
var FOREX = {};

// Core module for initialization and shared utilities
FOREX.Core = {
  /**
   * Initialize the Forex System
   * Called during the initial setup or when the spreadsheet is opened
   */
  init: function() {
    // Initialize all modules
    FOREX.Forms.init();
    FOREX.Inventory.init();
    FOREX.Transactions.init();
    FOREX.Utils.init();
    
    Logger.log("FOREX system initialized");
  }
};

// Forms module for handling user interfaces
FOREX.Forms = {
  // Holds processing steps for the current form operation
  _processingSteps: [],
  
  /**
   * Initialize Forms module
   */
  init: function() {
    this._processingSteps = [];
    Logger.log("FOREX.Forms initialized");
  },
  
  /**
   * Process the settlement form submission
   * Consolidated implementation to prevent conflicts
   * 
   * @param {Object} formData - The form data from the settlement form
   * @return {Object} Result with status and message
   */
  processSettlementForm: function(formData) {
    try {
      // Initialize processing tracking
      this.initializeProcessingSteps();
      
      // Get pending transaction data
      const props = PropertiesService.getScriptProperties();
      const pendingTransactionJson = props.getProperty('pendingTransaction');
      
      if (!pendingTransactionJson) {
        return {
          success: false,
          message: 'No pending transaction found',
          processingSteps: this.getProcessingSteps()
        };
      }
      
      // Parse transaction data
      const pendingTransaction = JSON.parse(pendingTransactionJson);
      
      // Validate the settlements data structure
      if (!formData || !formData.settlements || !Array.isArray(formData.settlements)) {
        return {
          success: false,
          message: 'Invalid settlement data structure',
          processingSteps: this.getProcessingSteps()
        };
      }
      
      this.addProcessingStep("Settlement data validated");
      this.addProcessingStep(`${formData.settlements.length} settlement legs processed`);
      
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
          // Ensure numeric values
          const processedLeg = {
            settlementType: leg.settlementType || '',
            currency: leg.currency || pendingTransaction.currency,
            amount: parseFloat(leg.amount) || 0,
            bankAccount: leg.bankAccount || '',
            notes: leg.notes || ''
          };
          
          // Add to optimized legs array
          optimizedLegs.push(processedLeg);
        }
        
        processedLegs = endIndex;
      }
      
      // Create transaction with optimized settlement legs
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
        result.processingSteps = this.getProcessingSteps();
      }
      
      return result;
    } catch (error) {
      Logger.log(`Error processing settlement form: ${error}`);
      return {
        success: false,
        message: `Error processing form: ${error.toString()}`,
        processingSteps: this.getProcessingSteps()
      };
    }
  },
  
  /**
   * Initialize the processing steps tracking
   */
  initializeProcessingSteps: function() {
    this._processingSteps = [];
  },
  
  /**
   * Add a processing step to track progress
   * @param {string} step - Description of the processing step
   */
  addProcessingStep: function(step) {
    this._processingSteps.push(step);
    Logger.log(`Processing step: ${step}`);
  },
  
  /**
   * Get current processing steps
   * @return {Array} Array of processing steps
   */
  getProcessingSteps: function() {
    return this._processingSteps;
  }
};

// Inventory management module
FOREX.Inventory = {
  /**
   * Initialize Inventory module
   */
  init: function() {
    Logger.log("FOREX.Inventory initialized");
  }
};

// Transactions processing module
FOREX.Transactions = {
  /**
   * Initialize Transactions module
   */
  init: function() {
    Logger.log("FOREX.Transactions initialized");
  },
  
  /**
   * Create a new transaction
   * Placeholder - will be implemented in the Transactions module
   * @param {Object} transactionData - Transaction data
   * @return {Object} Result with status and message
   */
  createTransaction: function(transactionData) {
    // This is a placeholder - in the actual implementation, 
    // this will call the existing createTransaction function
    // until it can be fully migrated to the namespace structure
    
    return window.createTransaction(transactionData);
  }
};

// Utility functions module
FOREX.Utils = {
  /**
   * Initialize Utils module
   */
  init: function() {
    Logger.log("FOREX.Utils initialized");
  }
};
