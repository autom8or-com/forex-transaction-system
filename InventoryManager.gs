/**
 * Forex Transaction System - Inventory Manager
 * 
 * Handles all currency inventory management including:
 * - Calculating daily balances
 * - Tracking running balances
 * - Reconciling transactions with inventory
 */

/**
 * Updates the entire inventory for a specified date range
 * If no range is provided, updates for the current date
 * @param {Date} startDate - Optional start date
 * @param {Date} endDate - Optional end date
 * @return {Object} Result with status and message
 */
function updateInventoryForDateRange(startDate, endDate) {
  try {
    // Default to today if no dates provided
    const start = startDate || new Date();
    start.setHours(0, 0, 0, 0); // Start of day
    
    const end = endDate || new Date();
    end.setHours(23, 59, 59, 999); // End of day
    
    const currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
    
    // Get all dates in the range
    const dateRange = getDateRange(start, end);
    
    // For each date, update inventory for all currencies
    for (const date of dateRange) {
      for (const currency of currencies) {
        updateInventoryForDateAndCurrency(date, currency);
      }
    }
    
    return {
      success: true,
      message: `Inventory updated successfully for ${dateRange.length} dates`
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
 * Updates inventory based on a specific transaction
 * Properly implemented version that actually updates the inventory
 * @param {string} transactionId - The transaction ID
 * @return {Object} Result with status and message
 */
function updateInventoryForTransaction(transactionId) {
  try {
    // Start with a loading indicator for long operations
    showLoading("Updating inventory...");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Find the transaction
    const transactions = transactionSheet.getDataRange().getValues();
    const headers = transactions[0];
    const idIndex = 0; // Transaction ID is always the first column
    const dateIndex = headers.indexOf('Date');
    const typeIndex = headers.indexOf('Transaction Type');
    const currencyIndex = headers.indexOf('Currency');
    const amountIndex = headers.indexOf('Amount');
    
    let transaction = null;
    
    for (let i = 1; i < transactions.length; i++) {
      if (transactions[i][idIndex] === transactionId) {
        transaction = {
          id: transactions[i][idIndex],
          date: transactions[i][dateIndex],
          type: transactions[i][typeIndex],
          currency: transactions[i][currencyIndex],
          amount: parseFloat(transactions[i][amountIndex])
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
    
    // Update inventory for the transaction's date and currency
    const result = updateInventoryForDateAndCurrency(transaction.date, transaction.currency);
    
    // Update dashboard inventory
    updateDashboardInventory();
    
    // Update running balances
    updateRunningBalances();
    
    return {
      success: result.success,
      message: `Inventory updated for transaction ${transactionId}`,
      details: result
    };
  } catch (error) {
    Logger.log(`Error updating inventory for transaction: ${error}`);
    return {
      success: false,
      message: `Error updating inventory: ${error.toString()}`
    };
  } finally {
    // Close the loading dialog by refreshing the UI
    SpreadsheetApp.getActiveSpreadsheet().toast("Inventory update completed", "Complete", 3);
  }
}

/**
 * Updates inventory for a specific date and currency
 * @param {Date} date - The date to update
 * @param {string} currency - The currency to update
 * @return {Object} Result with status and message
 */
function updateInventoryForDateAndCurrency(date, currency) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Format date to string for comparison
    const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Get all transactions for this date and currency
    const transactions = transactionSheet.getDataRange().getValues();
    
    // Transaction indices: 1=Date, 3=Type, 4=Currency, 5=Amount
    let purchases = 0;
    let sales = 0;
    
    for (let i = 1; i < transactions.length; i++) {
      const txDate = transactions[i][1];
      if (!txDate) continue;
      
      const txDateString = Utilities.formatDate(txDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      if (txDateString === dateString && transactions[i][4] === currency) {
        const type = transactions[i][3];
        const amount = Number(transactions[i][5]);
        
        if (type === 'Buy') {
          purchases += amount;
        } else if (type === 'Sell') {
          sales += amount;
        }
        // Note: Swap transactions should already be recorded as Buy/Sell pairs
      }
    }
    
    // Get or create inventory entry for this date and currency
    const inventoryEntry = findOrCreateInventoryEntry(date, currency);
    if (!inventoryEntry.success) {
      return inventoryEntry;
    }
    
    const { rowIndex, openingBalance } = inventoryEntry;
    
    // Update inventory
    inventorySheet.getRange(rowIndex, 4).setValue(purchases); // Purchases column
    inventorySheet.getRange(rowIndex, 5).setValue(sales); // Sales column
    
    // Closing balance is calculated by the sheet formula
    
    return {
      success: true,
      message: `Inventory updated for ${currency} on ${dateString}`,
      date: dateString,
      currency: currency,
      purchases: purchases,
      sales: sales,
      openingBalance: openingBalance
    };
  } catch (error) {
    Logger.log(`Error updating inventory for ${currency} on ${date}: ${error}`);
    return {
      success: false,
      message: `Error updating inventory: ${error.toString()}`
    };
  }
}

/**
 * Finds or creates an inventory entry for a specific date and currency
 * @param {Date} date - The date to find or create
 * @param {string} currency - The currency to find or create
 * @return {Object} Result with rowIndex and other data
 */
function findOrCreateInventoryEntry(date, currency) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
    
    // Format date to string for comparison
    const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Get all inventory entries
    const inventory = inventorySheet.getDataRange().getValues();
    
    // Check if entry exists
    let rowIndex = -1;
    for (let i = 1; i < inventory.length; i++) {
      if (!inventory[i][0]) continue; // Skip empty rows
      
      const entryDate = inventory[i][0];
      const entryDateString = Utilities.formatDate(entryDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      if (entryDateString === dateString && inventory[i][1] === currency) {
        rowIndex = i + 1; // +1 because array is 0-based but sheet is 1-based
        break;
      }
    }
    
    // If entry doesn't exist, create it
    if (rowIndex === -1) {
      // Find the closing balance from the previous date
      const previousDayBalance = findPreviousDayClosingBalance(date, currency);
      
      // Add new row
      inventorySheet.appendRow([
        date,
        currency,
        previousDayBalance, // Opening balance
        0, // Purchases (will be updated later)
        0, // Sales (will be updated later)
        0, // Adjustments
      ]);
      
      rowIndex = inventorySheet.getLastRow();
      
      // Set closing balance formula
      inventorySheet.getRange(rowIndex, 7).setFormula(`=C${rowIndex}+D${rowIndex}-E${rowIndex}+F${rowIndex}`);
      
      // Format cells
      inventorySheet.getRange(rowIndex, 1).setNumberFormat('yyyy-mm-dd');
      inventorySheet.getRange(rowIndex, 3, 1, 5).setNumberFormat('#,##0.00');
    }
    
    return {
      success: true,
      message: `Inventory entry found or created`,
      rowIndex: rowIndex,
      openingBalance: inventorySheet.getRange(rowIndex, 3).getValue()
    };
  } catch (error) {
    Logger.log(`Error finding/creating inventory entry: ${error}`);
    return {
      success: false,
      message: `Error finding/creating inventory entry: ${error.toString()}`
    };
  }
}

/**
 * Finds the closing balance from the previous day for a currency
 * @param {Date} date - The current date
 * @param {string} currency - The currency to find
 * @return {number} Previous day closing balance (or 0 if not found)
 */
function findPreviousDayClosingBalance(date, currency) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
    
    // Calculate previous day
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousDayString = Utilities.formatDate(previousDay, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Get all inventory entries
    const inventory = inventorySheet.getDataRange().getValues();
    
    // Find the previous day entry
    for (let i = 1; i < inventory.length; i++) {
      if (!inventory[i][0]) continue; // Skip empty rows
      
      const entryDate = inventory[i][0];
      const entryDateString = Utilities.formatDate(entryDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      if (entryDateString === previousDayString && inventory[i][1] === currency) {
        return Number(inventory[i][6]); // Closing balance is in column 7 (index 6)
      }
    }
    
    // If no previous day entry, return 0
    return 0;
  } catch (error) {
    Logger.log(`Error finding previous day balance: ${error}`);
    return 0;
  }
}

/**
 * Gets an array of dates between start and end (inclusive)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @return {Array} Array of dates
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Calculate and update running balances for transactions
 * @return {Object} Result with status and message
 */
function updateRunningBalances() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Check if running balance columns exist, create them if not
    const headers = transactionSheet.getRange(1, 1, 1, transactionSheet.getLastColumn()).getValues()[0];
    
    const currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
    const balanceColumns = {};
    
    // Find or create running balance columns
    for (const currency of currencies) {
      const colName = `${currency} Balance`;
      let colIndex = headers.indexOf(colName) + 1; // +1 because array is 0-based
      
      if (colIndex === 0) {
        // Column doesn't exist, create it
        colIndex = transactionSheet.getLastColumn() + 1;
        transactionSheet.getRange(1, colIndex).setValue(colName);
        transactionSheet.getRange(1, colIndex).setFontWeight('bold');
      }
      
      balanceColumns[currency] = colIndex;
    }
    
    // Get all transactions and sort by date
    const dataRange = transactionSheet.getRange(2, 1, transactionSheet.getLastRow() - 1, transactionSheet.getLastColumn());
    const transactions = dataRange.getValues();
    
    // Sort transactions by date
    transactions.sort((a, b) => {
      if (!a[1]) return -1;
      if (!b[1]) return 1;
      return a[1] - b[1];
    });
    
    // Calculate running balances for each currency
    const balances = {
      'USD': 0,
      'GBP': 0,
      'EUR': 0,
      'NAIRA': 0
    };
    
    // Reset balance columns
    for (const currency of currencies) {
      if (balanceColumns[currency]) {
        transactionSheet.getRange(2, balanceColumns[currency], transactions.length, 1).clearContent();
      }
    }
    
    // Write transactions back to sheet in date order and calculate running balances
    for (let i = 0; i < transactions.length; i++) {
      const rowIndex = i + 2; // +2 because we start at row 2 (after header)
      
      // Write back to sheet in sorted order
      for (let j = 0; j < transactions[i].length; j++) {
        transactionSheet.getRange(rowIndex, j + 1).setValue(transactions[i][j]);
      }
      
      // Calculate running balance for this transaction
      const currency = transactions[i][4];
      const type = transactions[i][3];
      const amount = Number(transactions[i][5]);
      
      if (currency && currencies.includes(currency)) {
        if (type === 'Buy') {
          balances[currency] += amount;
        } else if (type === 'Sell') {
          balances[currency] -= amount;
        }
        
        // Set running balance
        if (balanceColumns[currency]) {
          transactionSheet.getRange(rowIndex, balanceColumns[currency]).setValue(balances[currency]);
          transactionSheet.getRange(rowIndex, balanceColumns[currency]).setNumberFormat('#,##0.00');
        }
      }
    }
    
    return {
      success: true,
      message: 'Running balances updated successfully'
    };
  } catch (error) {
    Logger.log(`Error updating running balances: ${error}`);
    return {
      success: false,
      message: `Error updating running balances: ${error.toString()}`
    };
  }
}

/**
 * Calculates the current balance for a specific currency
 * @param {string} currency - The currency to calculate balance for
 * @return {number} Current balance
 */
function getCurrentBalance(currency) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
  
  // Get all inventory entries
  const inventory = inventorySheet.getDataRange().getValues();
  
  // Find the latest entry for this currency
  let latestDate = new Date(0); // Start with epoch
  let latestBalance = 0;
  
  for (let i = 1; i < inventory.length; i++) {
    if (!inventory[i][0]) continue; // Skip empty rows
    
    const entryDate = inventory[i][0];
    const entryCurrency = inventory[i][1];
    
    if (entryCurrency === currency && entryDate > latestDate) {
      latestDate = entryDate;
      latestBalance = Number(inventory[i][6]); // Closing balance is in column 7 (index 6)
    }
  }
  
  return latestBalance;
}

/**
 * Updates the dashboard with current inventory balances
 * @return {Object} Result with status and message
 */
function updateDashboardInventory() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dashboardSheet = ss.getSheetByName(SHEET_DASHBOARD);
    
    const currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
    
    // Update balance for each currency
    for (let i = 0; i < currencies.length; i++) {
      const currency = currencies[i];
      const balance = getCurrentBalance(currency);
      
      // Dashboard currency balances are at rows 6-9
      dashboardSheet.getRange(6 + i, 2).setValue(balance);
    }
    
    return {
      success: true,
      message: 'Dashboard inventory updated successfully'
    };
  } catch (error) {
    Logger.log(`Error updating dashboard inventory: ${error}`);
    return {
      success: false,
      message: `Error updating dashboard inventory: ${error.toString()}`
    };
  }
}

/**
 * Records an inventory adjustment
 * @param {Object} adjustmentData - Adjustment data
 * @return {Object} Result with status and message
 */
function recordInventoryAdjustment(adjustmentData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
    
    // Format date
    const date = new Date(adjustmentData.date);
    
    // Find or create inventory entry
    const inventoryEntry = findOrCreateInventoryEntry(date, adjustmentData.currency);
    if (!inventoryEntry.success) {
      return inventoryEntry;
    }
    
    const { rowIndex } = inventoryEntry;
    
    // Update adjustment column
    const currentAdjustment = inventorySheet.getRange(rowIndex, 6).getValue() || 0;
    const newAdjustment = currentAdjustment + adjustmentData.amount;
    
    inventorySheet.getRange(rowIndex, 6).setValue(newAdjustment);
    
    // Add note about adjustment
    const notesRange = inventorySheet.getRange(rowIndex, 8);
    const currentNotes = notesRange.getValue() || '';
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    
    const newNote = `${currentNotes}\n${timestamp}: ${adjustmentData.reason} (${adjustmentData.amount > 0 ? '+' : ''}${adjustmentData.amount})`;
    
    notesRange.setValue(newNote);
    
    // Update dashboard
    updateDashboardInventory();
    
    return {
      success: true,
      message: `Inventory adjustment recorded successfully`
    };
  } catch (error) {
    Logger.log(`Error recording inventory adjustment: ${error}`);
    return {
      success: false,
      message: `Error recording inventory adjustment: ${error.toString()}`
    };
  }
}

/**
 * Perform daily inventory reconciliation
 * @param {Date} date - The date to reconcile (defaults to today)
 * @return {Object} Reconciliation results
 */
function reconcileInventory(date) {
  try {
    const reconcileDate = date || new Date();
    const currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
    
    const results = {
      success: true,
      message: 'Inventory reconciliation completed',
      reconciliationDate: Utilities.formatDate(reconcileDate, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      currencies: {}
    };
    
    // Reconcile each currency
    for (const currency of currencies) {
      const result = reconcileCurrency(reconcileDate, currency);
      results.currencies[currency] = result;
      
      if (!result.success) {
        results.success = false;
        results.message = `Some currencies failed reconciliation`;
      }
    }
    
    return results;
  } catch (error) {
    Logger.log(`Error reconciling inventory: ${error}`);
    return {
      success: false,
      message: `Error reconciling inventory: ${error.toString()}`
    };
  }
}

/**
 * Reconcile a specific currency for a date
 * @param {Date} date - The date to reconcile
 * @param {string} currency - The currency to reconcile
 * @return {Object} Reconciliation result
 */
function reconcileCurrency(date, currency) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Format date to string for comparison
    const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Get inventory entry
    const inventoryEntry = findOrCreateInventoryEntry(date, currency);
    if (!inventoryEntry.success) {
      return {
        success: false,
        message: `Could not find or create inventory entry`,
        details: inventoryEntry
      };
    }
    
    const { rowIndex } = inventoryEntry;
    
    // Get inventory values
    const openingBalance = inventorySheet.getRange(rowIndex, 3).getValue() || 0;
    const recordedPurchases = inventorySheet.getRange(rowIndex, 4).getValue() || 0;
    const recordedSales = inventorySheet.getRange(rowIndex, 5).getValue() || 0;
    const adjustments = inventorySheet.getRange(rowIndex, 6).getValue() || 0;
    const closingBalance = inventorySheet.getRange(rowIndex, 7).getValue() || 0;
    
    // Calculate expected values from transactions
    const transactions = transactionSheet.getDataRange().getValues();
    
    let calculatedPurchases = 0;
    let calculatedSales = 0;
    
    for (let i = 1; i < transactions.length; i++) {
      const txDate = transactions[i][1];
      if (!txDate) continue;
      
      const txDateString = Utilities.formatDate(txDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      if (txDateString === dateString && transactions[i][4] === currency) {
        const type = transactions[i][3];
        const amount = Number(transactions[i][5]);
        
        if (type === 'Buy') {
          calculatedPurchases += amount;
        } else if (type === 'Sell') {
          calculatedSales += amount;
        }
      }
    }
    
    // Calculate expected closing balance
    const expectedClosingBalance = openingBalance + calculatedPurchases - calculatedSales + adjustments;
    
    // Check if values match
    const purchasesMatch = Math.abs(recordedPurchases - calculatedPurchases) < 0.01;
    const salesMatch = Math.abs(recordedSales - calculatedSales) < 0.01;
    const balanceMatch = Math.abs(closingBalance - expectedClosingBalance) < 0.01;
    
    // Update inventory if values don't match
    if (!purchasesMatch || !salesMatch) {
      inventorySheet.getRange(rowIndex, 4).setValue(calculatedPurchases);
      inventorySheet.getRange(rowIndex, 5).setValue(calculatedSales);
    }
    
    return {
      success: purchasesMatch && salesMatch && balanceMatch,
      message: purchasesMatch && salesMatch && balanceMatch ? 
        'Reconciliation successful' : 'Discrepancies found and corrected',
      openingBalance: openingBalance,
      calculatedPurchases: calculatedPurchases,
      recordedPurchases: recordedPurchases,
      purchasesMatch: purchasesMatch,
      calculatedSales: calculatedSales,
      recordedSales: recordedSales,
      salesMatch: salesMatch,
      adjustments: adjustments,
      expectedClosingBalance: expectedClosingBalance,
      closingBalance: closingBalance,
      balanceMatch: balanceMatch
    };
  } catch (error) {
    Logger.log(`Error reconciling ${currency} on ${date}: ${error}`);
    return {
      success: false,
      message: `Error reconciling currency: ${error.toString()}`
    };
  }
}

/**
 * Updates daily inventory for the current day
 * Called from Main.js when user clicks the "Update Inventory" button
 */
function updateDailyInventory() {
  try {
    // Show loading dialog
    showLoading("Updating daily inventory...");
    
    // Update inventory for today
    const today = new Date();
    const result = updateInventoryForDateRange(today, today);
    
    // Update dashboard after inventory update
    updateDashboardInventory();
    
    // Update running balances
    updateRunningBalances();
    
    // Show completion message
    SpreadsheetApp.getUi().alert(
      'Inventory Updated', 
      'Daily inventory has been updated successfully.', 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return result;
  } catch (error) {
    Logger.log(`Error in updateDailyInventory: ${error}`);
    // Show error message
    SpreadsheetApp.getUi().alert(
      'Error', 
      `Failed to update daily inventory: ${error.toString()}`, 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return {
      success: false,
      message: `Error updating daily inventory: ${error.toString()}`
    };
  }
}
