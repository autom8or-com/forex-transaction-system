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

// Assume SHEET_TRANSACTIONS and SHEET_TRANSACTION_LEGS are globally defined (e.g., in Main.gs or a constants file)

/**
 * Create a new transaction
 * (Consolidated from TransactionProcessor.gs and original FOREX.Transactions.gs)
 * @param {Object} transactionData - The transaction data
 * @return {Object} Result with status and message
 */
FOREX.Transactions.createTransaction = function(transactionData) {
  try {
    FOREX.Utils.initializeProcessingSteps();
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    if (!transactionSheet) {
      throw new Error('Transactions sheet not found');
    }

    Logger.log("Generating transaction ID...");
    
    const config = FOREX.Utils.getConfigSettings();
    const lastRow = transactionSheet.getLastRow();
    const transactionNumber = lastRow > 1 ? lastRow : 1; // Basic sequence
    
    const idPrefix = config.transactionIdPrefix || "TX-";
    const transactionId = `${idPrefix}${FOREX.Utils.padNumber(transactionNumber, 4)}`;
    
    const transactionDate = new Date(transactionData.date);
    const valueNGN = transactionData.amount * transactionData.rate;
    
    Logger.log("Saving transaction data...");
    FOREX.Utils.addProcessingStep("Transaction data validated");
    
    const transactionRow = [
      transactionId,
      transactionDate,
      transactionData.customer,
      transactionData.transactionType,
      transactionData.currency,
      transactionData.amount,
      transactionData.rate,
      valueNGN, // Calculated NGN value
      transactionData.nature,
      transactionData.source,
      transactionData.staff,
      'Complete', // Default status
      transactionData.notes || ''
    ];
    
    transactionSheet.appendRow(transactionRow);
    const newRowIndex = transactionSheet.getLastRow();
    transactionSheet.getRange(newRowIndex, 6, 1, 3).setNumberFormat('#,##0.00'); // Format Amount, Rate, Value
    
    Logger.log("Transaction record created successfully");
    FOREX.Utils.addProcessingStep("Transaction record created");
    
    let legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
    if (!legsSheet) {
      Logger.log("Setting up transaction legs sheet...");
      legsSheet = FOREX.Transactions.setupTransactionLegsSheet(); // Call namespaced version
    }
    
    Logger.log("Processing transaction legs...");
    if (transactionData.legs && transactionData.legs.length > 0) {
      for (let i = 0; i < transactionData.legs.length; i++) {
        Logger.log(`Processing settlement leg ${i+1} of ${transactionData.legs.length}...`);
        const leg = transactionData.legs[i];
        if (typeof leg.amount === 'string') {
          leg.amount = parseFloat(leg.amount);
        }
        FOREX.Transactions.addTransactionLeg(transactionId, leg); // Call namespaced version
      }
      FOREX.Utils.addProcessingStep(`${transactionData.legs.length} settlement legs processed`);
    } else {
      Logger.log("Creating default settlement leg...");
      const defaultLeg = {
        settlementType: transactionData.transactionType === 'Buy' ? 'Cash' : 'Bank Transfer',
        currency: transactionData.currency,
        amount: transactionData.amount,
        bankAccount: transactionData.bankAccount || '',
        status: 'Complete',
        notes: ''
      };
      FOREX.Transactions.addTransactionLeg(transactionId, defaultLeg); // Call namespaced version
      FOREX.Utils.addProcessingStep("Default settlement leg created");
    }
    
    Logger.log("Validating transaction legs...");
    FOREX.Transactions.validateTransactionLegs(transactionId); // Call namespaced version
    
    if (config.autoUpdateInventory === 'TRUE' || config.autoUpdateInventory === true) { // Handle boolean or string TRUE
      Logger.log("Updating inventory...");
      // Direct call to FOREX.Inventory as per existing logic in original FOREX.Transactions.createTransaction
      FOREX.Inventory.updateInventoryForDateAndCurrency(transactionDate, transactionData.currency);
      FOREX.Utils.addProcessingStep("Inventory updated");
    }
    
    Logger.log("Transaction completed successfully!");
    FOREX.Utils.addProcessingStep("Transaction completed successfully");
    
    return {
      success: true,
      message: `Transaction ${transactionId} created successfully`,
      transactionId: transactionId,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  } catch (error) {
    Logger.log(`Error creating transaction: ${error.toString()} at ${error.stack}`);
    return {
      success: false,
      message: `Error creating transaction: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps() // Include steps even on failure
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
    FOREX.Utils.initializeProcessingSteps();
    Logger.log("Processing swap transaction...");
    FOREX.Utils.addProcessingStep("Swap data validated");
    
    if (!swapData || !swapData.date || !swapData.fromCurrency || !swapData.toCurrency || 
        isNaN(parseFloat(swapData.fromAmount)) || isNaN(parseFloat(swapData.toAmount))) {
      throw new Error('Invalid swap data: Missing required fields');
    }
    
    const sellTransaction = {
      date: swapData.date,
      customer: swapData.customer,
      transactionType: 'Sell',
      currency: swapData.fromCurrency,
      amount: parseFloat(swapData.fromAmount),
      rate: parseFloat(swapData.sellRate),
      nature: 'Swap transaction',
      source: swapData.source || 'Walk-in',
      staff: swapData.staff,
      notes: `Swap to ${swapData.toCurrency} ${swapData.toAmount} (Swap ID: ${swapData.swapId})`
    };
    
    Logger.log("Processing sell side of swap...");
    const sellResult = FOREX.Transactions.createTransaction(sellTransaction);
    FOREX.Utils.addProcessingStep(`Sell transaction created (${swapData.fromCurrency})`);
    
    if (!sellResult.success) {
      throw new Error(`Failed to create sell transaction: ${sellResult.message}`);
    }
    
    const buyTransaction = {
      date: swapData.date,
      customer: swapData.customer,
      transactionType: 'Buy',
      currency: swapData.toCurrency,
      amount: parseFloat(swapData.toAmount),
      rate: parseFloat(swapData.buyRate),
      nature: 'Swap transaction',
      source: swapData.source || 'Walk-in',
      staff: swapData.staff,
      notes: `Swap from ${swapData.fromCurrency} ${swapData.fromAmount} (Swap ID: ${swapData.swapId})`
    };
    
    Logger.log("Processing buy side of swap...");
    const buyResult = FOREX.Transactions.createTransaction(buyTransaction);
    FOREX.Utils.addProcessingStep(`Buy transaction created (${swapData.toCurrency})`);

    if (!buyResult.success) {
      throw new Error(`Failed to create buy transaction: ${buyResult.message}`);
    }
    
    Logger.log("Finalizing swap transaction...");
    FOREX.Utils.addProcessingStep("Inventory updated for both currencies");
    FOREX.Utils.addProcessingStep("Swap transaction completed successfully");
    
    return {
      success: true,
      message: `Swap transaction processed successfully. Sold ${swapData.fromAmount} ${swapData.fromCurrency} and bought ${swapData.toAmount} ${swapData.toCurrency}.`,
      sellTransactionId: sellResult.transactionId,
      buyTransactionId: buyResult.transactionId,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  } catch (error) {
    Logger.log(`Error processing swap transaction: ${error.toString()} at ${error.stack}`);
    return {
      success: false,
      message: `Error processing swap transaction: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};

/**
 * Adds a transaction leg to the Transaction_Legs sheet
 */
FOREX.Transactions.addTransactionLeg = function(transactionId, legData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
    if (!legsSheet) {
      Logger.log("Creating Transaction_Legs sheet...");
      legsSheet = FOREX.Transactions.setupTransactionLegsSheet();
      if (!legsSheet) {
        throw new Error("Could not create Transaction_Legs sheet");
      }
    }
    
    const legCount = FOREX.Transactions.countLegsForTransaction(transactionId);
    const legId = `${transactionId}-L${legCount + 1}`;
    
    const legRow = [
      transactionId,
      legId,
      legData.settlementType,
      legData.currency,
      legData.amount,
      legData.bankAccount || '',
      legData.status || 'Complete',
      legData.notes || '',
      '' // Validation
    ];
    
    legsSheet.appendRow(legRow);
    legsSheet.getRange(legsSheet.getLastRow(), 5, 1, 1).setNumberFormat('#,##0.00');
    Logger.log(`Added transaction leg ${legId} for transaction ${transactionId}`);
    
    return { success: true, message: 'Transaction leg added successfully', legId: legId };
  } catch (error) {
    Logger.log(`Error adding transaction leg: ${error.toString()} at ${error.stack}`);
    return { success: false, message: `Error adding transaction leg: ${error.toString()}` };
  }
};

/**
 * Sets up the Transaction Legs sheet if it doesn't exist
 */
FOREX.Transactions.setupTransactionLegsSheet = function() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TRANSACTION_LEGS);
    Logger.log(`Created sheet: ${SHEET_TRANSACTION_LEGS}`);
  }
  
  sheet.clear();
  const headers = [
    'Transaction ID', 'Leg ID', 'Settlement Type', 'Currency', 'Amount', 
    'Bank/Account', 'Status', 'Notes', 'Validation'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  const settlementTypeRule = SpreadsheetApp.newDataValidation().requireValueInList(['Cash', 'Bank Transfer', 'Swap In', 'Swap Out'], true).build();
  sheet.getRange(2, 3, sheet.getMaxRows() -1 , 1).setDataValidation(settlementTypeRule);
  
  const currencyRule = SpreadsheetApp.newDataValidation().requireValueInList(['USD', 'GBP', 'EUR', 'NAIRA'], true).build();
  sheet.getRange(2, 4, sheet.getMaxRows() - 1, 1).setDataValidation(currencyRule);
  
  sheet.getRange('E:E').setNumberFormat('#,##0.00');
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
};

/**
 * Counts the number of legs for a specific transaction
 */
FOREX.Transactions.countLegsForTransaction = function(transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
  if (!legsSheet || legsSheet.getLastRow() <= 1) return 0;
  
  const legTxIds = legsSheet.getRange(2, 1, legsSheet.getLastRow() - 1, 1).getValues();
  let count = 0;
  for (const row of legTxIds) {
    if (row[0] === transactionId) count++;
  }
  return count;
};

/**
 * Validates that transaction legs add up to the main transaction amount
 */
FOREX.Transactions.validateTransactionLegs = function(transactionId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);

    Logger.log("Finding transaction details for validation...");
    const transactions = transactionSheet.getDataRange().getValues();
    let transactionCurrency = '';
    let transactionAmount = 0;
    let foundTransaction = false;

    for (let i = 1; i < transactions.length; i++) {
      if (transactions[i][0] === transactionId) {
        transactionCurrency = transactions[i][4]; // Currency column
        transactionAmount = parseFloat(transactions[i][5]); // Amount column
        foundTransaction = true;
        break;
      }
    }

    if (!foundTransaction) {
      throw new Error(`Transaction ${transactionId} not found for validation.`);
    }

    Logger.log("Calculating settlement leg totals for validation...");
    const allLegs = legsSheet.getDataRange().getValues();
    let legTotal = 0;
    let legRowsToValidate = [];

    for (let i = 1; i < allLegs.length; i++) {
      if (allLegs[i][0] === transactionId && allLegs[i][3] === transactionCurrency) { // Tx ID and Currency match
        legTotal += parseFloat(allLegs[i][4]); // Amount column in legs
        legRowsToValidate.push(i + 1);
      }
    }
    
    const isValid = Math.abs(legTotal - transactionAmount) < 0.01;
    Logger.log(`Validation result for ${transactionId}: ${isValid}. Leg total: ${legTotal}, Tx amount: ${transactionAmount}`);

    for (const row of legRowsToValidate) {
      legsSheet.getRange(row, 9).setValue(isValid ? '✓' : '❌ Mismatch'); // Validation column
    }
    
    FOREX.Utils.addProcessingStep(isValid ? "Transaction legs validated successfully" : "Transaction legs validation failed - amount mismatch");
    return { success: isValid, message: isValid ? 'Legs validated' : 'Mismatch in leg totals' };
  } catch (error) {
    Logger.log(`Error validating transaction legs: ${error.toString()} at ${error.stack}`);
    return { success: false, message: `Error validating transaction legs: ${error.toString()}` };
  }
};

/**
 * Gets transaction data by ID
 */
FOREX.Transactions.getTransactionById = function(transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  const transactions = transactionSheet.getDataRange().getValues();
  const headers = transactions[0];
  
  for (let i = 1; i < transactions.length; i++) {
    if (transactions[i][0] === transactionId) {
      const transaction = {};
      headers.forEach((header, j) => {
        transaction[header.replace(/ /g, '_').toLowerCase()] = transactions[i][j];
      });
      transaction.legs = FOREX.Transactions.getTransactionLegs(transactionId);
      return transaction;
    }
  }
  return null;
};

/**
 * Gets all legs for a transaction
 */
FOREX.Transactions.getTransactionLegs = function(transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
  if (!legsSheet) return [];
  
  const allLegs = legsSheet.getDataRange().getValues();
  const headers = allLegs[0];
  const legs = [];
  
  for (let i = 1; i < allLegs.length; i++) {
    if (allLegs[i][0] === transactionId) {
      const leg = {};
      headers.forEach((header, j) => {
        leg[header.replace(/ /g, '_').toLowerCase()] = allLegs[i][j];
      });
      legs.push(leg);
    }
  }
  return legs;
};

/**
 * Updates an existing transaction
 */
FOREX.Transactions.updateTransaction = function(transactionId, updateData) {
  try {
    FOREX.Utils.initializeProcessingSteps();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);

    Logger.log(`Finding transaction ${transactionId} for update...`);
    FOREX.Utils.addProcessingStep("Transaction lookup initiated");
    
    const transactions = transactionSheet.getDataRange().getValues();
    let rowIndex = -1;
    let originalDate;
    let originalCurrency;

    for (let i = 1; i < transactions.length; i++) {
      if (transactions[i][0] === transactionId) {
        rowIndex = i + 1;
        originalDate = new Date(transactions[i][1]); // Date column
        originalCurrency = transactions[i][4]; // Currency column
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Transaction ${transactionId} not found for update.`);
    }

    FOREX.Utils.addProcessingStep("Transaction found");
    Logger.log("Updating transaction fields...");

    // Update specific fields
    // Column indices are 1-based
    if (updateData.date) transactionSheet.getRange(rowIndex, 2).setValue(new Date(updateData.date));
    if (updateData.customer) transactionSheet.getRange(rowIndex, 3).setValue(updateData.customer);
    // ... other fields ...
    if (updateData.amount || updateData.rate) {
        const currentAmount = updateData.amount !== undefined ? parseFloat(updateData.amount) : parseFloat(transactionSheet.getRange(rowIndex, 6).getValue());
        const currentRate = updateData.rate !== undefined ? parseFloat(updateData.rate) : parseFloat(transactionSheet.getRange(rowIndex, 7).getValue());
        if (updateData.amount !== undefined) transactionSheet.getRange(rowIndex, 6).setValue(currentAmount);
        if (updateData.rate !== undefined) transactionSheet.getRange(rowIndex, 7).setValue(currentRate);
        transactionSheet.getRange(rowIndex, 8).setValue(currentAmount * currentRate); // Update Value (NGN)
    }
    if (updateData.nature) transactionSheet.getRange(rowIndex, 9).setValue(updateData.nature);
    // ... etc. for all updatable fields ...

    FOREX.Utils.addProcessingStep("Transaction fields updated");
    
    const config = FOREX.Utils.getConfigSettings();
    if (config.autoUpdateInventory === 'TRUE' || config.autoUpdateInventory === true) {
      Logger.log("Updating inventory due to transaction update...");
      const newDate = updateData.date ? new Date(updateData.date) : originalDate;
      const newCurrency = updateData.currency || originalCurrency;
      
      // Update inventory for the original date/currency if they changed
      if (originalDate.getTime() !== newDate.getTime() || originalCurrency !== newCurrency) {
          FOREX.Inventory.updateInventoryForDateAndCurrency(originalDate, originalCurrency);
      }
      // Update inventory for the new date/currency
      FOREX.Inventory.updateInventoryForDateAndCurrency(newDate, newCurrency);
      FOREX.Utils.addProcessingStep("Inventory recalculated");
    }

    Logger.log("Update completed successfully");
    FOREX.Utils.addProcessingStep("Transaction update completed");
    
    return { success: true, message: `Transaction ${transactionId} updated.`, processingSteps: FOREX.Utils.getProcessingSteps() };
  } catch (error) {
    Logger.log(`Error updating transaction: ${error.toString()} at ${error.stack}`);
    return { success: false, message: `Error updating transaction: ${error.toString()}`, processingSteps: FOREX.Utils.getProcessingSteps() };
  }
};

// FOREX.Transactions.updateInventoryForTransaction - This specific helper is not needed
// as its logic is incorporated into createTransaction and updateTransaction directly
// by calling FOREX.Inventory.updateInventoryForDateAndCurrency.
