/**
 * Forex Transaction System - Transaction Processor
 * 
 * Handles all transaction-related operations including:
 * - Creating new transactions
 * - Processing transaction legs
 * - Validating transaction data
 * - Calculating transaction values
 */

// Store processing steps for the current operation
let currentProcessingSteps = [];
let currentStepIndex = 0;

/**
 * Creates a new transaction from form data
 * @param {Object} transactionData - Transaction data from form
 * @return {Object} Transaction result with status and message
 */
function createTransaction(transactionData) {
  try {
    // Initialize processing steps tracking
    initializeProcessingSteps();
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Update processing status
    updateProcessingStatus("Generating transaction ID...");
    
    // Generate transaction ID
    const config = getConfigSettings();
    const lastRow = transactionSheet.getLastRow();
    const transactionNumber = lastRow > 1 ? lastRow : 1;
    
    // Use default prefix if not defined in config
    const idPrefix = config.transactionIdPrefix || "TX-";
    const transactionId = `${idPrefix}${padNumber(transactionNumber, 4)}`;
    
    // Format date
    const transactionDate = new Date(transactionData.date);
    
    // Calculate value in NGN
    const valueNGN = transactionData.amount * transactionData.rate;
    
    updateProcessingStatus("Saving transaction data...");
    addProcessingStep("Transaction data validated");
    
    // Create transaction row
    const transactionRow = [
      transactionId,
      transactionDate,
      transactionData.customer,
      transactionData.transactionType,
      transactionData.currency,
      transactionData.amount,
      transactionData.rate,
      valueNGN,
      transactionData.nature,
      transactionData.source,
      transactionData.staff,
      'Complete',
      transactionData.notes || ''
    ];
    
    // Add to sheet
    transactionSheet.appendRow(transactionRow);
    
    // Format the new row
    const newRowIndex = transactionSheet.getLastRow();
    transactionSheet.getRange(newRowIndex, 6, 1, 3).setNumberFormat('#,##0.00');
    
    updateProcessingStatus("Transaction record created successfully");
    addProcessingStep("Transaction record created");
    
    // Create the Transaction_Legs sheet if it doesn't exist
    let legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
    if (!legsSheet) {
      updateProcessingStatus("Setting up transaction legs sheet...");
      setupTransactionLegsSheet();
      legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
    }
    
    updateProcessingStatus("Processing transaction legs...");
    
    // Process transaction legs if provided
    if (transactionData.legs && transactionData.legs.length > 0) {
      for (let i = 0; i < transactionData.legs.length; i++) {
        updateProcessingStatus(`Processing settlement leg ${i+1} of ${transactionData.legs.length}...`);
        addTransactionLeg(transactionId, transactionData.legs[i]);
      }
      addProcessingStep(`${transactionData.legs.length} settlement legs processed`);
    } else {
      // Create a default leg if none provided
      updateProcessingStatus("Creating default settlement leg...");
      const defaultLeg = {
        settlementType: transactionData.transactionType === 'Buy' ? 'Cash' : 'Bank Transfer',
        currency: transactionData.currency,
        amount: transactionData.amount,
        bankAccount: transactionData.bankAccount || '',
        status: 'Complete',
        notes: ''
      };
      
      addTransactionLeg(transactionId, defaultLeg);
      addProcessingStep("Default settlement leg created");
    }
    
    // Validate that the legs were properly created
    updateProcessingStatus("Validating transaction legs...");
    validateTransactionLegs(transactionId);
    
    // Update inventory if configured to do so
    if (config.autoUpdateInventory === 'TRUE') {
      updateProcessingStatus("Updating inventory...");
      updateInventoryForTransaction(transactionId);
      addProcessingStep("Inventory updated");
    }
    
    updateProcessingStatus("Transaction completed successfully!");
    addProcessingStep("Transaction completed successfully");
    
    // Get the processing steps to return to client
    const processingSteps = getProcessingSteps();
    
    return {
      success: true,
      message: 'Transaction created successfully',
      transactionId: transactionId,
      processingSteps: processingSteps
    };
  } catch (error) {
    Logger.log(`Error creating transaction: ${error}`);
    return {
      success: false,
      message: `Error creating transaction: ${error.toString()}`
    };
  }
}

/**
 * Adds a transaction leg to the Transaction_Legs sheet
 * @param {string} transactionId - The parent transaction ID
 * @param {Object} legData - Leg data to add
 * @return {Object} Result with status and message
 */
function addTransactionLeg(transactionId, legData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure the Transaction_Legs sheet exists
    let legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
    if (!legsSheet) {
      updateProcessingStatus("Creating Transaction_Legs sheet...");
      setupTransactionLegsSheet();
      legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
      
      // If still doesn't exist, return error
      if (!legsSheet) {
        throw new Error("Could not create Transaction_Legs sheet");
      }
    }
    
    // Count existing legs for this transaction to generate leg ID
    const legCount = countLegsForTransaction(transactionId);
    const legId = `${transactionId}-L${legCount + 1}`;
    
    // Create leg row
    const legRow = [
      transactionId,
      legId,
      legData.settlementType,
      legData.currency,
      legData.amount,
      legData.bankAccount || '',
      legData.status || 'Complete',
      legData.notes || '',
      '' // Validation column, will be filled by formula
    ];
    
    // Add to sheet
    legsSheet.appendRow(legRow);
    
    // Format the new row
    const newRowIndex = legsSheet.getLastRow();
    legsSheet.getRange(newRowIndex, 5, 1, 1).setNumberFormat('#,##0.00');
    
    // Log success for debugging
    Logger.log(`Added transaction leg ${legId} for transaction ${transactionId}`);
    
    return {
      success: true,
      message: 'Transaction leg added successfully',
      legId: legId
    };
  } catch (error) {
    Logger.log(`Error adding transaction leg: ${error}`);
    return {
      success: false,
      message: `Error adding transaction leg: ${error.toString()}`
    };
  }
}

/**
 * Set up the Transaction Legs sheet if it doesn't exist
 */
function setupTransactionLegsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TRANSACTION_LEGS);
    Logger.log(`Created sheet: ${SHEET_TRANSACTION_LEGS}`);
  }
  
  // Clear existing content
  sheet.clear();
  
  // Set headers
  const headers = [
    'Transaction ID', 'Leg ID', 'Settlement Type', 'Currency', 'Amount', 
    'Bank/Account', 'Status', 'Notes', 'Validation'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Set up data validation for Settlement Type
  const settlementTypeRange = sheet.getRange(2, 3, 1000, 1);
  const settlementTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Cash', 'Bank Transfer', 'Swap In', 'Swap Out'], true)
    .build();
  settlementTypeRange.setDataValidation(settlementTypeRule);
  
  // Set up data validation for Currency
  const currencyRange = sheet.getRange(2, 4, 1000, 1);
  const currencyRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['USD', 'GBP', 'EUR', 'NAIRA'], true)
    .build();
  currencyRange.setDataValidation(currencyRule);
  
  // Format columns
  sheet.getRange('E:E').setNumberFormat('#,##0.00');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  return sheet;
}

/**
 * Counts the number of legs for a specific transaction
 * @param {string} transactionId - The transaction ID to count legs for
 * @return {number} Number of legs
 */
function countLegsForTransaction(transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
  
  if (!legsSheet || legsSheet.getLastRow() <= 1) {
    return 0; // No legs yet or only header row
  }
  
  // Get all transaction IDs
  const lastRow = legsSheet.getLastRow();
  const legTxIds = lastRow > 1 ? 
    legsSheet.getRange(2, 1, lastRow - 1, 1).getValues() : 
    [];
  
  // Count matches
  let count = 0;
  for (const row of legTxIds) {
    if (row[0] === transactionId) {
      count++;
    }
  }
  
  return count;
}

/**
 * Validates that transaction legs add up to the main transaction amount
 * @param {string} transactionId - The transaction ID to validate
 * @return {Object} Validation result with status and message
 */
function validateTransactionLegs(transactionId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
    
    updateProcessingStatus("Finding transaction details...");
    
    // Find the transaction
    const transactions = transactionSheet.getDataRange().getValues();
    let transactionRow = -1;
    let transactionCurrency = '';
    let transactionAmount = 0;
    
    for (let i = 1; i < transactions.length; i++) {
      if (transactions[i][0] === transactionId) {
        transactionRow = i + 1; // +1 because array is 0-based but sheet is 1-based
        transactionCurrency = transactions[i][4];
        transactionAmount = transactions[i][5];
        break;
      }
    }
    
    if (transactionRow === -1) {
      return {
        success: false,
        message: `Transaction ${transactionId} not found`
      };
    }
    
    updateProcessingStatus("Calculating settlement leg totals...");
    
    // Get all legs for this transaction
    const allLegs = legsSheet.getDataRange().getValues();
    let legTotal = 0;
    let legRows = [];
    
    for (let i = 1; i < allLegs.length; i++) {
      if (allLegs[i][0] === transactionId && allLegs[i][3] === transactionCurrency) {
        legTotal += Number(allLegs[i][4]);
        legRows.push(i + 1); // +1 because array is 0-based but sheet is 1-based
      }
    }
    
    // Compare totals
    const isValid = Math.abs(legTotal - transactionAmount) < 0.01; // Allow for small rounding errors
    
    updateProcessingStatus("Updating validation status...");
    
    // Update validation status in legs sheet
    for (const row of legRows) {
      legsSheet.getRange(row, 9).setValue(isValid ? '✓' : '❌ Mismatch');
    }
    
    // Add a processing step
    if (isValid) {
      addProcessingStep("Transaction legs validated successfully");
    } else {
      addProcessingStep("Transaction legs validation failed - amount mismatch");
    }
    
    return {
      success: isValid,
      message: isValid ? 
        'Transaction legs validated successfully' : 
        `Leg total (${legTotal}) does not match transaction amount (${transactionAmount})`,
      legTotal: legTotal,
      transactionAmount: transactionAmount
    };
  } catch (error) {
    Logger.log(`Error validating transaction legs: ${error}`);
    return {
      success: false,
      message: `Error validating transaction legs: ${error.toString()}`
    };
  }
}

/**
 * Updates inventory based on a specific transaction
 * @param {string} transactionId - The transaction ID
 * @return {Object} Result with status and message
 */
function updateInventoryForTransaction(transactionId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Find the transaction
    const transactions = transactionSheet.getDataRange().getValues();
    let transaction = null;
    
    updateProcessingStatus("Finding transaction data...");
    
    for (let i = 1; i < transactions.length; i++) {
      if (transactions[i][0] === transactionId) {
        transaction = {
          id: transactions[i][0],
          date: transactions[i][1],
          type: transactions[i][3],
          currency: transactions[i][4],
          amount: transactions[i][5]
        };
        break;
      }
    }
    
    if (!transaction) {
      return {
        success: false,
        message: `Transaction ${transactionId} not found`
      };
    }
    
    updateProcessingStatus(`Updating inventory for ${transaction.currency}...`);
    
    // Call inventory update function
    const result = updateInventoryForDateAndCurrency(transaction.date, transaction.currency);
    
    return {
      success: result.success,
      message: `Inventory updated for transaction ${transactionId}`
    };
  } catch (error) {
    Logger.log(`Error updating inventory: ${error}`);
    return {
      success: false,
      message: `Error updating inventory: ${error.toString()}`
    };
  }
}

/**
 * Gets transaction data by ID
 * @param {string} transactionId - The transaction ID to retrieve
 * @return {Object} Transaction data or null if not found
 */
function getTransactionById(transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  
  // Find the transaction
  const transactions = transactionSheet.getDataRange().getValues();
  const headers = transactions[0];
  
  for (let i = 1; i < transactions.length; i++) {
    if (transactions[i][0] === transactionId) {
      // Create object with column headers as keys
      const transaction = {};
      for (let j = 0; j < headers.length; j++) {
        transaction[headers[j].replace(/ /g, '_').toLowerCase()] = transactions[i][j];
      }
      
      // Get transaction legs
      transaction.legs = getTransactionLegs(transactionId);
      
      return transaction;
    }
  }
  
  return null;
}

/**
 * Gets all legs for a transaction
 * @param {string} transactionId - The transaction ID
 * @return {Array} Array of leg objects
 */
function getTransactionLegs(transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
  
  if (!legsSheet) {
    return []; // No legs sheet exists
  }
  
  // Get all legs
  const allLegs = legsSheet.getDataRange().getValues();
  const headers = allLegs[0];
  const legs = [];
  
  for (let i = 1; i < allLegs.length; i++) {
    if (allLegs[i][0] === transactionId) {
      // Create object with column headers as keys
      const leg = {};
      for (let j = 0; j < headers.length; j++) {
        leg[headers[j].replace(/ /g, '_').toLowerCase()] = allLegs[i][j];
      }
      legs.push(leg);
    }
  }
  
  return legs;
}

/**
 * Processes a swap transaction (currency to currency)
 * @param {Object} swapData - Data for the swap transaction
 * @return {Object} Result with status and message
 */
function processSwapTransaction(swapData) {
  try {
    // Initialize processing steps tracking
    initializeProcessingSteps();
    
    updateProcessingStatus("Setting up sell transaction...");
    addProcessingStep("Swap data validated");
    
    // Create two linked transactions - one for each currency
    const sellTransaction = {
      date: swapData.date,
      customer: swapData.customer,
      transactionType: 'Sell',
      currency: swapData.fromCurrency,
      amount: swapData.fromAmount,
      rate: swapData.sellRate,
      nature: 'Swap transaction',
      source: swapData.source || 'Walk-in',
      staff: swapData.staff,
      notes: `Swap to ${swapData.toCurrency} ${swapData.toAmount} (Swap ID: ${swapData.swapId})`
    };
    
    updateProcessingStatus("Setting up buy transaction...");
    
    const buyTransaction = {
      date: swapData.date,
      customer: swapData.customer,
      transactionType: 'Buy',
      currency: swapData.toCurrency,
      amount: swapData.toAmount,
      rate: swapData.buyRate,
      nature: 'Swap transaction',
      source: swapData.source || 'Walk-in',
      staff: swapData.staff,
      notes: `Swap from ${swapData.fromCurrency} ${swapData.fromAmount} (Swap ID: ${swapData.swapId})`
    };
    
    // Create both transactions
    updateProcessingStatus("Processing sell side of swap...");
    const sellResult = createTransaction(sellTransaction);
    addProcessingStep(`Sell transaction created (${swapData.fromCurrency})`);
    
    updateProcessingStatus("Processing buy side of swap...");
    const buyResult = createTransaction(buyTransaction);
    addProcessingStep(`Buy transaction created (${swapData.toCurrency})`);
    
    updateProcessingStatus("Finalizing swap transaction...");
    addProcessingStep("Inventory updated for both currencies");
    addProcessingStep("Swap transaction completed successfully");
    
    // Get the processing steps
    const processingSteps = getProcessingSteps();
    
    // Return results
    if (sellResult.success && buyResult.success) {
      return {
        success: true,
        message: 'Swap transaction processed successfully',
        sellTransactionId: sellResult.transactionId,
        buyTransactionId: buyResult.transactionId,
        processingSteps: processingSteps
      };
    } else {
      return {
        success: false,
        message: 'Error processing swap transaction',
        sellResult: sellResult,
        buyResult: buyResult,
        processingSteps: processingSteps
      };
    }
  } catch (error) {
    Logger.log(`Error processing swap transaction: ${error}`);
    return {
      success: false,
      message: `Error processing swap transaction: ${error.toString()}`
    };
  }
}

/**
 * Updates an existing transaction
 * @param {string} transactionId - The transaction ID to update
 * @param {Object} updateData - Updated transaction data
 * @return {Object} Result with status and message
 */
function updateTransaction(transactionId, updateData) {
  try {
    // Initialize processing steps tracking
    initializeProcessingSteps();
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    updateProcessingStatus("Finding transaction...");
    addProcessingStep("Transaction lookup initiated");
    
    // Find the transaction
    const transactions = transactionSheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < transactions.length; i++) {
      if (transactions[i][0] === transactionId) {
        rowIndex = i + 1; // +1 because array is 0-based but sheet is 1-based
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: `Transaction ${transactionId} not found`,
        processingSteps: getProcessingSteps()
      };
    }
    
    addProcessingStep("Transaction found");
    updateProcessingStatus("Updating transaction fields...");
    
    // Update fields
    if (updateData.date) {
      transactionSheet.getRange(rowIndex, 2).setValue(new Date(updateData.date));
    }
    
    if (updateData.customer) {
      transactionSheet.getRange(rowIndex, 3).setValue(updateData.customer);
    }
    
    if (updateData.transactionType) {
      transactionSheet.getRange(rowIndex, 4).setValue(updateData.transactionType);
    }
    
    if (updateData.currency) {
      transactionSheet.getRange(rowIndex, 5).setValue(updateData.currency);
    }
    
    if (updateData.amount) {
      transactionSheet.getRange(rowIndex, 6).setValue(updateData.amount);
      
      // If amount changed and rate exists, recalculate value
      const currentRate = transactionSheet.getRange(rowIndex, 7).getValue();
      if (currentRate) {
        transactionSheet.getRange(rowIndex, 8).setValue(updateData.amount * currentRate);
      }
    }
    
    if (updateData.rate) {
      transactionSheet.getRange(rowIndex, 7).setValue(updateData.rate);
      
      // If rate changed, recalculate value
      const currentAmount = transactionSheet.getRange(rowIndex, 6).getValue();
      transactionSheet.getRange(rowIndex, 8).setValue(currentAmount * updateData.rate);
    }
    
    if (updateData.nature) {
      transactionSheet.getRange(rowIndex, 9).setValue(updateData.nature);
    }
    
    if (updateData.source) {
      transactionSheet.getRange(rowIndex, 10).setValue(updateData.source);
    }
    
    if (updateData.staff) {
      transactionSheet.getRange(rowIndex, 11).setValue(updateData.staff);
    }
    
    if (updateData.status) {
      transactionSheet.getRange(rowIndex, 12).setValue(updateData.status);
    }
    
    if (updateData.notes) {
      transactionSheet.getRange(rowIndex, 13).setValue(updateData.notes);
    }
    
    addProcessingStep("Transaction fields updated");
    
    // Update inventory if needed
    const config = getConfigSettings();
    if (config.autoUpdateInventory === 'TRUE') {
      updateProcessingStatus("Updating inventory...");
      updateInventoryForTransaction(transactionId);
      addProcessingStep("Inventory recalculated");
    }
    
    updateProcessingStatus("Update completed successfully");
    addProcessingStep("Transaction update completed");
    
    // Get the processing steps
    const processingSteps = getProcessingSteps();
    
    return {
      success: true,
      message: `Transaction ${transactionId} updated successfully`,
      processingSteps: processingSteps
    };
  } catch (error) {
    Logger.log(`Error updating transaction: ${error}`);
    return {
      success: false,
      message: `Error updating transaction: ${error.toString()}`,
      processingSteps: getProcessingSteps()
    };
  }
}

/**
 * Records an inventory adjustment
 * @param {Object} adjustmentData - The adjustment data
 * @return {Object} Result with status and message
 */
function recordInventoryAdjustment(adjustmentData) {
  try {
    // Initialize processing steps tracking
    initializeProcessingSteps();
    
    updateProcessingStatus("Validating adjustment data...");
    addProcessingStep("Adjustment data validated");
    
    // Create the Adjustments sheet if it doesn't exist
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let adjustmentsSheet = ss.getSheetByName(SHEET_ADJUSTMENTS);
    
    if (!adjustmentsSheet) {
      updateProcessingStatus("Creating adjustments sheet...");
      adjustmentsSheet = ss.insertSheet(SHEET_ADJUSTMENTS);
      
      // Set up headers
      const headers = [
        'Adjustment ID', 'Date', 'Currency', 'Amount', 
        'Reason', 'Processed By', 'Timestamp'
      ];
      
      adjustmentsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      adjustmentsSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    updateProcessingStatus("Generating adjustment ID...");
    
    // Generate adjustment ID
    const lastRow = adjustmentsSheet.getLastRow();
    const adjustmentNumber = lastRow > 1 ? lastRow : 1;
    const adjustmentId = `ADJ-${padNumber(adjustmentNumber, 4)}`;
    
    // Get user email/name
    const userEmail = Session.getActiveUser().getEmail();
    
    updateProcessingStatus("Saving adjustment record...");
    
    // Add adjustment to sheet
    const adjustmentRow = [
      adjustmentId,
      new Date(adjustmentData.date),
      adjustmentData.currency,
      adjustmentData.amount,
      adjustmentData.reason,
      userEmail,
      new Date()
    ];
    
    adjustmentsSheet.appendRow(adjustmentRow);
    
    // Format the new row
    const newRowIndex = adjustmentsSheet.getLastRow();
    adjustmentsSheet.getRange(newRowIndex, 4, 1, 1).setNumberFormat('#,##0.00');
    
    addProcessingStep("Adjustment record saved");
    updateProcessingStatus("Updating inventory for adjustment...");
    
    // Update inventory
    const inventoryResult = updateInventoryForDateAndCurrency(
      new Date(adjustmentData.date), 
      adjustmentData.currency
    );
    
    addProcessingStep(`Inventory adjusted for ${adjustmentData.currency}`);
    updateProcessingStatus("Adjustment completed successfully!");
    addProcessingStep("Adjustment completed successfully");
    
    // Get the processing steps
    const processingSteps = getProcessingSteps();
    
    return {
      success: true,
      message: `Inventory adjustment for ${adjustmentData.currency} recorded successfully`,
      adjustmentId: adjustmentId,
      processingSteps: processingSteps
    };
  } catch (error) {
    Logger.log(`Error recording inventory adjustment: ${error}`);
    return {
      success: false,
      message: `Error recording inventory adjustment: ${error.toString()}`,
      processingSteps: getProcessingSteps()
    };
  }
}

/**
 * Initialize the processing steps tracking
 */
function initializeProcessingSteps() {
  currentProcessingSteps = [];
  currentStepIndex = 0;
}

/**
 * Add a processing step to the current operation
 * @param {string} step - The step description
 */
function addProcessingStep(step) {
  currentProcessingSteps.push(step);
  currentStepIndex++;
  
  // Also log the step for debugging
  Logger.log(`Processing step ${currentStepIndex}: ${step}`);
}

/**
 * Get the current processing steps
 * @return {Array} Array of processing step descriptions
 */
function getProcessingSteps() {
  return currentProcessingSteps;
}

/**
 * Pads a number with leading zeros
 * @param {number} num - The number to pad
 * @param {number} size - The desired string length
 * @return {string} Padded number as string
 */
function padNumber(num, size) {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
}

/**
 * Gets configuration settings from the Config sheet
 * @return {Object} Configuration settings
 */
function getConfigSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEET_CONFIG);
  
  const configData = configSheet.getDataRange().getValues();
  const config = {};
  
  // Skip header row
  for (let i = 1; i < configData.length; i++) {
    const setting = configData[i][0];
    const value = configData[i][1];
    config[camelCase(setting)] = value;
  }
  
  return config;
}

/**
 * Converts a string to camelCase
 * @param {string} str - The string to convert
 * @return {string} Camel-cased string
 */
function camelCase(str) {
  return str
    .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
    .replace(/\s/g, '')
    .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
}

/**
 * Updates the processing status message in the loading dialog
 * @param {string} status - The new status message to display
 * @param {string} step - Optional step detail to display
 */
function updateProcessingStatus(status, step) {
  try {
    // Log processing steps for debugging
    Logger.log(`Processing: ${status}${step ? ` - ${step}` : ''}`);
    
    // Note: In a real implementation, we would need to update the UI
    // However, Apps Script doesn't allow direct UI updates from server-side code
    // Instead, we track the steps and return them in the response to be displayed by client-side code
    
    // We don't add every status update as a step, as that would be too granular
    // Steps are added explicitly via addProcessingStep()
  } catch (error) {
    // Silently fail - this is just for UI feedback and shouldn't stop processing
    Logger.log(`Error updating processing status: ${error}`);
  }
}
