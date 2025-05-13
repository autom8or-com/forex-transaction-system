/**
 * Forex Transaction System - Inventory Manager
 * 
 * Handles all inventory-related operations including:
 * - Daily inventory calculations
 * - Inventory adjustments
 * - Reconciliation
 */

/**
 * Updates inventory for a specific date and currency
 * @param {Date} date - The date to update inventory for
 * @param {string} currency - The currency to update
 * @return {Object} Update result
 */
function updateInventoryForDateAndCurrency(date, currency) {
  try {
    // Track step for processing
    trackProcessingStep("Inventory Update", "Starting update for " + currency, { date: formatDate(date) });
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ensure the inventory sheet exists
    let inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
    if (!inventorySheet) {
      trackProcessingStep("Inventory Update", "Creating inventory sheet", { currency: currency });
      setupInventorySheet();
      inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
    }
    
    // Format date for searching
    const dateFormatted = formatDate(date);
    
    trackProcessingStep("Inventory Update", "Looking for existing inventory record", 
      { date: dateFormatted, currency: currency });
    
    // Check if there's an inventory entry for this date and currency
    const inventoryData = inventorySheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < inventoryData.length; i++) {
      const rowDate = formatDate(inventoryData[i][0]);
      const rowCurrency = inventoryData[i][1];
      
      if (rowDate === dateFormatted && rowCurrency === currency) {
        rowIndex = i + 1; // +1 because array is 0-based but sheet is 1-based
        break;
      }
    }
    
    // Find previous day closing for opening balance
    trackProcessingStep("Inventory Update", "Finding previous day closing balance", 
      { date: dateFormatted, currency: currency });
    
    const previousDayClosing = getPreviousDayClosing(date, currency);
    
    // Get purchases and sales for this date
    trackProcessingStep("Inventory Update", "Calculating purchases and sales", 
      { date: dateFormatted, currency: currency });
    
    const transactions = getTransactionsForDate(date, currency);
    
    // Calculate closing balance
    const openingBalance = previousDayClosing.amount;
    const purchases = transactions.purchases;
    const sales = transactions.sales;
    const adjustments = getAdjustmentsForDate(date, currency);
    const closingBalance = openingBalance + purchases - sales + adjustments;
    
    trackProcessingStep("Inventory Update", "Calculated inventory values", 
      { 
        opening: openingBalance,
        purchases: purchases,
        sales: sales,
        adjustments: adjustments,
        closing: closingBalance
      });
    
    // Update or create inventory entry
    if (rowIndex > 0) {
      // Update existing entry
      inventorySheet.getRange(rowIndex, 3).setValue(openingBalance); // Opening Balance
      inventorySheet.getRange(rowIndex, 5).setValue(purchases); // Purchases
      inventorySheet.getRange(rowIndex, 7).setValue(sales); // Sales
      inventorySheet.getRange(rowIndex, 9).setValue(adjustments); // Adjustments
      inventorySheet.getRange(rowIndex, 10).setValue(closingBalance); // Closing Balance
      
      trackProcessingStep("Inventory Update", "Updated existing inventory record", 
        { rowIndex: rowIndex });
    } else {
      // Create new entry
      const inventoryRow = [
        new Date(date), // Date
        currency, // Currency
        openingBalance, // Opening Balance
        previousDayClosing.source, // Opening Balance Source
        purchases, // Purchases
        `=QUERY(${SHEET_TRANSACTIONS}!$A$2:$K$1000, "SELECT SUM(F) WHERE E='${currency}' AND B=date '"&TEXT(A${inventorySheet.getLastRow()+1},"yyyy-mm-dd")&"' AND D='Buy'")`, // Purchases Formula
        sales, // Sales
        `=QUERY(${SHEET_TRANSACTIONS}!$A$2:$K$1000, "SELECT SUM(F) WHERE E='${currency}' AND B=date '"&TEXT(A${inventorySheet.getLastRow()+1},"yyyy-mm-dd")&"' AND D='Sell'")`, // Sales Formula
        adjustments, // Adjustments
        closingBalance // Closing Balance
      ];
      
      inventorySheet.appendRow(inventoryRow);
      
      trackProcessingStep("Inventory Update", "Created new inventory record", 
        { row: inventorySheet.getLastRow() });
      
      // Format the new row
      const newRowIndex = inventorySheet.getLastRow();
      inventorySheet.getRange(newRowIndex, 3, 1, 8).setNumberFormat('#,##0.00');
    }
    
    // Update future day opening balances if necessary
    updateFutureDaysOpeningBalance(date, currency, closingBalance);
    
    trackProcessingStep("Inventory Update", "Completed inventory update", 
      { date: dateFormatted, currency: currency });
    
    return {
      success: true,
      message: `Inventory updated for ${currency} on ${dateFormatted}`,
      openingBalance: openingBalance,
      purchases: purchases,
      sales: sales,
      adjustments: adjustments,
      closingBalance: closingBalance
    };
  } catch (error) {
    Logger.log(`Error updating inventory: ${error}`);
    trackProcessingStep("Inventory Update", "ERROR updating inventory", 
      { error: error.toString() });
    
    return {
      success: false,
      message: `Error updating inventory: ${error.toString()}`
    };
  }
}

/**
 * Gets the previous day's closing balance for a currency
 * @param {Date} date - The date to get previous day for
 * @param {string} currency - The currency
 * @return {Object} Previous day closing balance info
 */
function getPreviousDayClosing(date, currency) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  
  if (!inventorySheet) {
    return { amount: 0, source: 'No previous data' };
  }
  
  // Get all inventory data
  const inventoryData = inventorySheet.getDataRange().getValues();
  
  // Format the target date for comparison
  const targetDate = new Date(date);
  targetDate.setDate(targetDate.getDate() - 1); // Previous day
  const targetDateFormatted = formatDate(targetDate);
  
  // Find the previous day's entry for this currency
  for (let i = 1; i < inventoryData.length; i++) {
    const rowDate = formatDate(inventoryData[i][0]);
    const rowCurrency = inventoryData[i][1];
    
    if (rowDate === targetDateFormatted && rowCurrency === currency) {
      return {
        amount: inventoryData[i][9], // Closing Balance
        source: `Previous day (${targetDateFormatted})`
      };
    }
  }
  
  // If no previous day, find the most recent entry for this currency
  let mostRecentDate = null;
  let mostRecentClosing = 0;
  
  for (let i = 1; i < inventoryData.length; i++) {
    const rowDate = new Date(inventoryData[i][0]);
    const rowCurrency = inventoryData[i][1];
    
    if (rowCurrency === currency && rowDate < date) {
      if (!mostRecentDate || rowDate > mostRecentDate) {
        mostRecentDate = rowDate;
        mostRecentClosing = inventoryData[i][9]; // Closing Balance
      }
    }
  }
  
  if (mostRecentDate) {
    return {
      amount: mostRecentClosing,
      source: `Most recent (${formatDate(mostRecentDate)})`
    };
  }
  
  // Default to zero if no previous inventory found
  return { amount: 0, source: 'Initial balance' };
}

/**
 * Gets transaction totals for a specific date and currency
 * @param {Date} date - The date to get transactions for
 * @param {string} currency - The currency
 * @return {Object} Transaction totals
 */
function getTransactionsForDate(date, currency) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  
  if (!transactionSheet) {
    return { purchases: 0, sales: 0 };
  }
  
  // Format date for comparison
  const dateFormatted = formatDate(date);
  
  // Get all transaction data
  const transactions = transactionSheet.getDataRange().getValues();
  
  // Initialize totals
  let purchases = 0;
  let sales = 0;
  
  // Calculate totals
  for (let i = 1; i < transactions.length; i++) {
    const transactionDate = formatDate(transactions[i][1]);
    const transactionType = transactions[i][3];
    const transactionCurrency = transactions[i][4];
    const transactionAmount = transactions[i][5];
    
    if (transactionDate === dateFormatted && transactionCurrency === currency) {
      if (transactionType === 'Buy') {
        purchases += transactionAmount;
      } else if (transactionType === 'Sell') {
        sales += transactionAmount;
      }
    }
  }
  
  return { purchases: purchases, sales: sales };
}

/**
 * Gets adjustment totals for a specific date and currency
 * @param {Date} date - The date to get adjustments for
 * @param {string} currency - The currency
 * @return {number} Adjustment total
 */
function getAdjustmentsForDate(date, currency) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const adjustmentsSheet = ss.getSheetByName(SHEET_ADJUSTMENTS);
  
  if (!adjustmentsSheet) {
    return 0;
  }
  
  // Format date for comparison
  const dateFormatted = formatDate(date);
  
  // Get all adjustment data
  const adjustments = adjustmentsSheet.getDataRange().getValues();
  
  // Initialize total
  let total = 0;
  
  // Calculate total
  for (let i = 1; i < adjustments.length; i++) {
    const adjustmentDate = formatDate(adjustments[i][1]);
    const adjustmentCurrency = adjustments[i][2];
    const adjustmentAmount = adjustments[i][3];
    
    if (adjustmentDate === dateFormatted && adjustmentCurrency === currency) {
      total += adjustmentAmount;
    }
  }
  
  return total;
}

/**
 * Updates future days opening balances after a change
 * @param {Date} fromDate - The date from which to update
 * @param {string} currency - The currency to update
 * @param {number} closingBalance - The closing balance to cascade
 */
function updateFutureDaysOpeningBalance(fromDate, currency, closingBalance) {
  trackProcessingStep("Inventory Update", "Updating future days", 
      { date: formatDate(fromDate), currency: currency });
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  
  if (!inventorySheet) {
    return;
  }
  
  // Format date for comparison
  const fromDateObj = new Date(fromDate);
  fromDateObj.setDate(fromDateObj.getDate() + 1); // Start from next day
  
  // Get all inventory data
  const inventoryData = inventorySheet.getDataRange().getValues();
  
  // Update future days
  let nextDayBalance = closingBalance;
  
  for (let i = 1; i < inventoryData.length; i++) {
    const rowDate = new Date(inventoryData[i][0]);
    const rowCurrency = inventoryData[i][1];
    
    if (rowCurrency === currency && rowDate >= fromDateObj) {
      // Update this row's opening balance
      inventorySheet.getRange(i + 1, 3).setValue(nextDayBalance);
      inventorySheet.getRange(i + 1, 4).setValue(`Updated from ${formatDate(fromDate)}`);
      
      // Recalculate closing balance for this day
      const purchases = inventoryData[i][4];
      const sales = inventoryData[i][6];
      const adjustments = inventoryData[i][8];
      const newClosingBalance = nextDayBalance + purchases - sales + adjustments;
      
      inventorySheet.getRange(i + 1, 10).setValue(newClosingBalance);
      
      // Update for next iteration
      nextDayBalance = newClosingBalance;
      fromDateObj = rowDate;
    }
  }
  
  trackProcessingStep("Inventory Update", "Completed future days update", 
      { currency: currency });
}

/**
 * Sets up the Inventory sheet if it doesn't exist
 */
function setupInventorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  
  if (!inventorySheet) {
    inventorySheet = ss.insertSheet(SHEET_INVENTORY);
    Logger.log(`Created sheet: ${SHEET_INVENTORY}`);
  }
  
  // Clear existing content
  inventorySheet.clear();
  
  // Set headers
  const headers = [
    'Date', 'Currency', 'Opening Balance', 'Formula/Source', 'Purchases',
    'Purchase Formula', 'Sales', 'Sales Formula', 'Adjustments', 'Closing Balance'
  ];
  
  inventorySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  inventorySheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  inventorySheet.setFrozenRows(1);
  
  // Set column formats
  inventorySheet.getRange('C:C').setNumberFormat('#,##0.00');
  inventorySheet.getRange('E:E').setNumberFormat('#,##0.00');
  inventorySheet.getRange('G:G').setNumberFormat('#,##0.00');
  inventorySheet.getRange('I:I').setNumberFormat('#,##0.00');
  inventorySheet.getRange('J:J').setNumberFormat('#,##0.00');
  
  // Auto-resize columns
  inventorySheet.autoResizeColumns(1, headers.length);
  
  return inventorySheet;
}

/**
 * Gets current inventory balance for all currencies
 * @return {Array} Array of currency balances
 */
function getCurrentInventoryBalances() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  
  if (!inventorySheet) {
    return [];
  }
  
  // Get inventory data
  const inventoryData = inventorySheet.getDataRange().getValues();
  
  // Initialize array to hold the latest balance for each currency
  const balances = {};
  
  // Find the latest entry for each currency
  for (let i = 1; i < inventoryData.length; i++) {
    const currency = inventoryData[i][1];
    const date = new Date(inventoryData[i][0]);
    const closingBalance = inventoryData[i][9];
    
    if (!balances[currency] || date > balances[currency].date) {
      balances[currency] = {
        date: date,
        balance: closingBalance
      };
    }
  }
  
  // Convert to array
  const result = [];
  for (const currency in balances) {
    result.push({
      currency: currency,
      date: balances[currency].date,
      balance: balances[currency].balance
    });
  }
  
  return result;
}

/**
 * Gets inventory history for a specific currency
 * @param {string} currency - The currency to get history for
 * @param {number} days - Number of days to look back
 * @return {Array} Inventory history
 */
function getInventoryHistory(currency, days) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
  
  if (!inventorySheet) {
    return [];
  }
  
  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Get inventory data
  const inventoryData = inventorySheet.getDataRange().getValues();
  
  // Filter for the requested currency and date range
  const history = [];
  
  for (let i = 1; i < inventoryData.length; i++) {
    const rowDate = new Date(inventoryData[i][0]);
    const rowCurrency = inventoryData[i][1];
    
    if (rowCurrency === currency && rowDate >= cutoffDate) {
      history.push({
        date: rowDate,
        openingBalance: inventoryData[i][2],
        purchases: inventoryData[i][4],
        sales: inventoryData[i][6],
        adjustments: inventoryData[i][8],
        closingBalance: inventoryData[i][9]
      });
    }
  }
  
  // Sort by date
  history.sort((a, b) => a.date - b.date);
  
  return history;
}

/**
 * Reconciles inventory with transaction data
 * @param {Date} date - The date to reconcile
 * @return {Object} Reconciliation result
 */
function reconcileInventory(date) {
  try {
    trackProcessingStep("Inventory Reconciliation", "Starting reconciliation", 
      { date: formatDate(date) });
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const inventorySheet = ss.getSheetByName(SHEET_INVENTORY);
    
    if (!inventorySheet) {
      return {
        success: false,
        message: 'Inventory sheet not found'
      };
    }
    
    // Format date for comparison
    const dateFormatted = formatDate(date);
    
    // Get all currency balances from inventory
    const inventoryData = inventorySheet.getDataRange().getValues();
    const currencyBalances = {};
    
    trackProcessingStep("Inventory Reconciliation", "Finding currency balances", 
      { date: dateFormatted });
    
    for (let i = 1; i < inventoryData.length; i++) {
      const rowDate = formatDate(inventoryData[i][0]);
      const rowCurrency = inventoryData[i][1];
      const rowClosingBalance = inventoryData[i][9];
      
      if (rowDate === dateFormatted) {
        currencyBalances[rowCurrency] = {
          inventoryBalance: rowClosingBalance,
          calculatedBalance: 0,
          discrepancy: 0,
          reconciled: false
        };
      }
    }
    
    // Calculate balances from transactions
    trackProcessingStep("Inventory Reconciliation", "Calculating from transactions", 
      { currencies: Object.keys(currencyBalances) });
    
    for (const currency in currencyBalances) {
      // Get previous day closing
      const previousDayClosing = getPreviousDayClosing(date, currency);
      
      // Get transactions for this date
      const transactions = getTransactionsForDate(date, currency);
      
      // Get adjustments for this date
      const adjustments = getAdjustmentsForDate(date, currency);
      
      // Calculate balance
      const calculatedBalance = previousDayClosing.amount + transactions.purchases - transactions.sales + adjustments;
      
      // Update balance info
      currencyBalances[currency].calculatedBalance = calculatedBalance;
      currencyBalances[currency].discrepancy = currencyBalances[currency].inventoryBalance - calculatedBalance;
      currencyBalances[currency].reconciled = Math.abs(currencyBalances[currency].discrepancy) < 0.01;
    }
    
    // Check if all currencies are reconciled
    let allReconciled = true;
    const discrepancies = [];
    
    for (const currency in currencyBalances) {
      if (!currencyBalances[currency].reconciled) {
        allReconciled = false;
        discrepancies.push(`${currency}: ${currencyBalances[currency].discrepancy.toFixed(2)}`);
      }
    }
    
    trackProcessingStep("Inventory Reconciliation", "Completed reconciliation", 
      { reconciled: allReconciled, discrepancies: discrepancies });
    
    return {
      success: true,
      message: allReconciled ? 'All currencies reconciled' : 'Discrepancies found',
      date: dateFormatted,
      currencyBalances: currencyBalances,
      allReconciled: allReconciled,
      discrepancies: discrepancies
    };
  } catch (error) {
    Logger.log(`Error reconciling inventory: ${error}`);
    trackProcessingStep("Inventory Reconciliation", "ERROR in reconciliation", 
      { error: error.toString() });
    
    return {
      success: false,
      message: `Error reconciling inventory: ${error.toString()}`
    };
  }
}
