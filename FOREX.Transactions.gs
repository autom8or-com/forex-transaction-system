/**
 * Forex Transaction System - Transactions Module
 * 
 * This file contains functionality for processing forex transactions:
 * - Creating regular transactions
 * - Processing swap transactions
 * - Managing transaction legs
 */

// Ensure the namespace exists
var FOREX = FOREX || {};
FOREX.Transactions = FOREX.Transactions || {};

/**
 * Create a new transaction
 * @param {Object} transactionData - The transaction data
 * @return {Object} Result with status and message
 */
FOREX.Transactions.createTransaction = function(transactionData) {
  try {
    // Initialize processing tracking if not already initialized
    if (typeof FOREX.Utils.getProcessingSteps() === 'undefined' || FOREX.Utils.getProcessingSteps().length === 0) {
      FOREX.Utils.initializeProcessingSteps();
    }
    
    FOREX.Utils.addProcessingStep("Validating transaction data");
    
    // Validate transaction data
    if (!transactionData || !transactionData.date || !transactionData.transactionType || 
        !transactionData.currency || isNaN(parseFloat(transactionData.amount))) {
      throw new Error('Invalid transaction data: Missing required fields');
    }
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get the Transactions sheet
    const transactionsSheet = ss.getSheetByName('Transactions');
    if (!transactionsSheet) {
      throw new Error('Transactions sheet not found');
    }
    
    // Generate a transaction ID
    const lastRow = transactionsSheet.getLastRow();
    let transactionId = 'TX-001';
    
    if (lastRow > 1) {
      // Get the last transaction ID
      const lastTransactionId = transactionsSheet.getRange(lastRow, 1).getValue();
      
      // Extract the numeric part
      const numericPart = lastTransactionId.split('-')[1];
      
      // Increment the numeric part
      const nextNumericPart = String(parseInt(numericPart) + 1).padStart(3, '0');
      
      // Create the new transaction ID
      transactionId = `TX-${nextNumericPart}`;
    }
    
    FOREX.Utils.addProcessingStep(`Generated transaction ID: ${transactionId}`);
    
    // Format the transaction date
    const transactionDate = new Date(transactionData.date);
    
    // Add the transaction to the sheet
    transactionsSheet.appendRow([
      transactionId,
      transactionDate,
      transactionData.transactionType,
      transactionData.currency,
      parseFloat(transactionData.amount),
      parseFloat(transactionData.rate),
      transactionData.nature || '',
      transactionData.customer || '',
      transactionData.staff || '',
      transactionData.source || '',
      transactionData.notes || '',
      new Date() // timestamp
    ]);
    
    FOREX.Utils.addProcessingStep("Transaction record created");
    
    // Process transaction legs if present
    if (transactionData.legs && Array.isArray(transactionData.legs)) {
      FOREX.Utils.addProcessingStep(`Processing ${transactionData.legs.length} transaction legs`);
      
      // Get the Transaction_Legs sheet
      const legsSheet = ss.getSheetByName('Transaction_Legs');
      if (!legsSheet) {
        throw new Error('Transaction_Legs sheet not found');
      }
      
      // Process each leg
      for (const leg of transactionData.legs) {
        // Ensure amount is a number
        const legAmount = parseFloat(leg.amount);
        
        // Add the leg to the sheet
        legsSheet.appendRow([
          transactionId,
          leg.settlementType || '',
          leg.currency || transactionData.currency,
          legAmount,
          leg.bankAccount || '',
          leg.notes || '',
          new Date() // timestamp
        ]);
      }
      
      FOREX.Utils.addProcessingStep("Transaction legs recorded");
    }
    
    // Update inventory
    FOREX.Utils.addProcessingStep("Updating inventory");
    FOREX.Inventory.updateInventoryForDateAndCurrency(transactionDate, transactionData.currency);
    FOREX.Utils.addProcessingStep("Inventory updated");
    
    return {
      success: true,
      message: `Transaction ${transactionId} created successfully`,
      transactionId: transactionId,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  } catch (error) {
    Logger.log(`Error creating transaction: ${error}`);
    return {
      success: false,
      message: `Error creating transaction: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};

/**
 * Process a swap transaction
 * @param {Object} swapData - The swap transaction data
 * @return {Object} Result with status and message
 */
FOREX.Transactions.processSwapTransaction = function(swapData) {
  try {
    // Initialize processing tracking
    FOREX.Utils.initializeProcessingSteps();
    FOREX.Utils.addProcessingStep("Processing swap transaction");
    
    // Validate swap data
    if (!swapData || !swapData.date || !swapData.fromCurrency || !swapData.toCurrency || 
        isNaN(parseFloat(swapData.fromAmount)) || isNaN(parseFloat(swapData.toAmount))) {
      throw new Error('Invalid swap data: Missing required fields');
    }
    
    // Create the first transaction - "Sell" the from currency
    const sellTransaction = {
      date: swapData.date,
      transactionType: 'Sell',
      currency: swapData.fromCurrency,
      amount: parseFloat(swapData.fromAmount),
      rate: parseFloat(swapData.sellRate),
      nature: 'Swap Out',
      customer: swapData.customer,
      staff: swapData.staff,
      source: swapData.source,
      notes: `Part of swap transaction ${swapData.swapId}`
    };
    
    FOREX.Utils.addProcessingStep(`Creating "Sell" transaction for ${swapData.fromCurrency}`);
    const sellResult = FOREX.Transactions.createTransaction(sellTransaction);
    
    if (!sellResult.success) {
      throw new Error(`Failed to create sell transaction: ${sellResult.message}`);
    }
    
    // Create the second transaction - "Buy" the to currency
    const buyTransaction = {
      date: swapData.date,
      transactionType: 'Buy',
      currency: swapData.toCurrency,
      amount: parseFloat(swapData.toAmount),
      rate: parseFloat(swapData.buyRate),
      nature: 'Swap In',
      customer: swapData.customer,
      staff: swapData.staff,
      source: swapData.source,
      notes: `Part of swap transaction ${swapData.swapId}`
    };
    
    FOREX.Utils.addProcessingStep(`Creating "Buy" transaction for ${swapData.toCurrency}`);
    const buyResult = FOREX.Transactions.createTransaction(buyTransaction);
    
    if (!buyResult.success) {
      throw new Error(`Failed to create buy transaction: ${buyResult.message}`);
    }
    
    // Return the result
    return {
      success: true,
      message: `Swap transaction processed successfully. Sold ${swapData.fromAmount} ${swapData.fromCurrency} and bought ${swapData.toAmount} ${swapData.toCurrency}.`,
      sellTransactionId: sellResult.transactionId,
      buyTransactionId: buyResult.transactionId,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  } catch (error) {
    Logger.log(`Error processing swap transaction: ${error}`);
    return {
      success: false,
      message: `Error processing swap transaction: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};
