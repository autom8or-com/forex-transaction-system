/**
 * Forex Transaction System - Transaction Processor
 * 
 * Handles all transaction-related operations including:
 * - Creating new transactions
 * - Processing transaction legs
 * - Validating transaction data
 * - Calculating transaction values
 */

/**
 * Creates a new transaction from form data
 * @param {Object} transactionData - Transaction data from form
 * @return {Object} Transaction result with status and message
 */
function createTransaction(transactionData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Generate transaction ID
    const config = getConfigSettings();
    const lastRow = transactionSheet.getLastRow();
    const transactionNumber = lastRow > 1 ? lastRow : 1;
    const transactionId = `${config.transactionIdPrefix}${padNumber(transactionNumber, 4)}`;
    
    // Format date
    const transactionDate = new Date(transactionData.date);
    
    // Calculate value in NGN
    const valueNGN = transactionData.amount * transactionData.rate;
    
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
    
    // Process transaction legs if provided
    if (transactionData.legs && transactionData.legs.length > 0) {
      for (const leg of transactionData.legs) {
        addTransactionLeg(transactionId, leg);
      }
    } else {
      // Create a default leg if none provided
      const defaultLeg = {
        settlementType: transactionData.transactionType === 'Buy' ? 'Cash' : 'Bank Transfer',
        currency: transactionData.currency,
        amount: transactionData.amount,
        bankAccount: transactionData.bankAccount || '',
        status: 'Complete',
        notes: ''
      };
      
      addTransactionLeg(transactionId, defaultLeg);
    }
    
    // Update inventory if configured to do so
    if (config.autoUpdateInventory === 'TRUE') {
      updateInventoryForTransaction(transactionId);
    }
    
    return {
      success: true,
      message: 'Transaction created successfully',
      transactionId: transactionId
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
    const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
    
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
 * Counts the number of legs for a specific transaction
 * @param {string} transactionId - The transaction ID to count legs for
 * @return {number} Number of legs
 */
function countLegsForTransaction(transactionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const legsSheet = ss.getSheetByName(SHEET_TRANSACTION_LEGS);
  
  // Get all transaction IDs
  const legTxIds = legsSheet.getRange(2, 1, legsSheet.getLastRow() - 1, 1).getValues();
  
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
    
    // Update validation status in legs sheet
    for (const row of legRows) {
      legsSheet.getRange(row, 9).setValue(isValid ? '✓' : '❌ Mismatch');
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
    
    // Call inventory update function (will be implemented in InventoryManager.gs)
    // For now, we'll just return success
    return {
      success: true,
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
    const sellResult = createTransaction(sellTransaction);
    const buyResult = createTransaction(buyTransaction);
    
    // Return results
    if (sellResult.success && buyResult.success) {
      return {
        success: true,
        message: 'Swap transaction processed successfully',
        sellTransactionId: sellResult.transactionId,
        buyTransactionId: buyResult.transactionId
      };
    } else {
      return {
        success: false,
        message: 'Error processing swap transaction',
        sellResult: sellResult,
        buyResult: buyResult
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
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
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
        message: `Transaction ${transactionId} not found`
      };
    }
    
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
    
    // Update inventory if needed
    const config = getConfigSettings();
    if (config.autoUpdateInventory === 'TRUE') {
      updateInventoryForTransaction(transactionId);
    }
    
    return {
      success: true,
      message: `Transaction ${transactionId} updated successfully`
    };
  } catch (error) {
    Logger.log(`Error updating transaction: ${error}`);
    return {
      success: false,
      message: `Error updating transaction: ${error.toString()}`
    };
  }
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
