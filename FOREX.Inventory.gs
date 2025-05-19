/**
 * Forex Transaction System - Inventory Module
 * 
 * This file contains functionality for managing forex inventory:
 * - Updating daily inventory
 * - Tracking currency balances
 * - Recording inventory adjustments
 */

// Ensure the namespace exists
var FOREX = FOREX || {};
FOREX.Inventory = FOREX.Inventory || {};

/**
 * Update the daily inventory for all currencies
 * @return {Object} Result with status and message
 */
FOREX.Inventory.updateDailyInventory = function() {
  try {
    // Initialize processing tracking
    FOREX.Utils.initializeProcessingSteps();
    FOREX.Utils.addProcessingStep("Updating inventory for all currencies");
    
    // Get current date
    const today = new Date();
    
    // Get currencies from config
    const config = FOREX.Utils.getConfigSettings();
    const currencies = ['USD', 'GBP', 'EUR', 'NAIRA']; // Default currencies if not in config
    
    // Initialize UI
    const ui = SpreadsheetApp.getUi();
    
    // Create a progress dialog
    const htmlOutput = HtmlService.createHtmlOutput(
      '<div style="text-align: center; padding: 20px;">' +
      '<h3>Updating Inventory</h3>' +
      '<p>Please wait while the inventory is being updated...</p>' +
      '</div>'
    )
    .setWidth(300)
    .setHeight(150);
    
    ui.showModelessDialog(htmlOutput, 'Updating Inventory');
    
    // Update inventory for each currency
    const results = [];
    
    for (const currency of currencies) {
      const result = FOREX.Inventory.updateInventoryForDateAndCurrency(today, currency);
      results.push(result);
      FOREX.Utils.addProcessingStep(`${currency} inventory updated`);
    }
    
    // Show completion message
    let message = 'Inventory update completed:\n\n';
    
    for (let i = 0; i < results.length; i++) {
      message += `- ${currencies[i]}: ${results[i].success ? 'Success' : 'Failed'}\n`;
    }
    
    ui.alert('Inventory Update', message, ui.ButtonSet.OK);
    
    return {
      success: true,
      message: 'Inventory updated successfully',
      results: results,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  } catch (error) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', `Error updating inventory: ${error.toString()}`, ui.ButtonSet.OK);
    
    return {
      success: false,
      message: `Error updating inventory: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};

/**
 * Update inventory for a specific date and currency
 * @param {Date} date - The date to update
 * @param {string} currency - The currency to update
 * @return {Object} Result with status and message
 */
FOREX.Inventory.updateInventoryForDateAndCurrency = function(date, currency) {
  try {
    // Add processing step
    FOREX.Utils.addProcessingStep(`Updating inventory for ${currency}`);
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get the Daily_Inventory sheet
    const inventorySheet = ss.getSheetByName('Daily_Inventory');
    if (!inventorySheet) {
      throw new Error('Daily_Inventory sheet not found');
    }
    
    // Format date for comparison
    const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // Get transactions for this currency and date
    const transactionsSheet = ss.getSheetByName('Transactions');
    const transactionsData = transactionsSheet.getDataRange().getValues();
    
    // Skip header row
    const relevantTransactions = [];
    for (let i = 1; i < transactionsData.length; i++) {
      const transactionDate = transactionsData[i][1]; // Date is in column B
      if (transactionDate) {
        const transactionDateStr = Utilities.formatDate(transactionDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        
        // Check if the transaction is for the target date and currency
        const transactionCurrency = transactionsData[i][3]; // Currency is in column D
        
        if (transactionDateStr === dateString && transactionCurrency === currency) {
          relevantTransactions.push(transactionsData[i]);
        }
      }
    }
    
    // Get the last inventory record for this currency
    const inventoryData = inventorySheet.getDataRange().getValues();
    let lastInventory = 0;
    let lastInventoryDateStr = '';
    
    // Skip header row and find the last inventory record for this currency
    for (let i = inventoryData.length - 1; i >= 1; i--) {
      const inventoryCurrency = inventoryData[i][1]; // Currency is in column B
      
      if (inventoryCurrency === currency) {
        lastInventory = inventoryData[i][2]; // Balance is in column C
        const inventoryDate = inventoryData[i][0]; // Date is in column A
        
        if (inventoryDate) {
          lastInventoryDateStr = Utilities.formatDate(inventoryDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        break;
      }
    }
    
    // Calculate new inventory
    let newInventory = lastInventory;
    
    // Process transactions and calculate new inventory
    for (const transaction of relevantTransactions) {
      const transactionType = transaction[2]; // Transaction type is in column C
      const amount = transaction[4]; // Amount is in column E
      
      if (transactionType === 'Buy') {
        newInventory += amount;
      } else if (transactionType === 'Sell') {
        newInventory -= amount;
      } else if (transactionType === 'Swap') {
        // For swaps, check if it's incoming or outgoing for this currency
        const swapDirection = transaction[6]; // Direction/Nature might be in column G
        if (swapDirection === 'In') {
          newInventory += amount;
        } else if (swapDirection === 'Out') {
          newInventory -= amount;
        }
      }
    }
    
    // Get adjustments for this currency and date
    const adjustmentsSheet = ss.getSheetByName('Adjustments');
    if (adjustmentsSheet) {
      const adjustmentsData = adjustmentsSheet.getDataRange().getValues();
      
      // Skip header row
      for (let i = 1; i < adjustmentsData.length; i++) {
        const adjustmentDate = adjustmentsData[i][0]; // Date is in column A
        if (adjustmentDate) {
          const adjustmentDateStr = Utilities.formatDate(adjustmentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          
          // Check if the adjustment is for the target date and currency
          const adjustmentCurrency = adjustmentsData[i][1]; // Currency is in column B
          
          if (adjustmentDateStr === dateString && adjustmentCurrency === currency) {
            const adjustmentAmount = adjustmentsData[i][2]; // Amount is in column C
            newInventory += adjustmentAmount;
          }
        }
      }
    }
    
    // Check if we already have an entry for this date and currency
    let foundExistingEntry = false;
    let existingRow = -1;
    
    for (let i = 1; i < inventoryData.length; i++) {
      const inventoryDate = inventoryData[i][0]; // Date is in column A
      const inventoryCurrency = inventoryData[i][1]; // Currency is in column B
      
      if (inventoryDate) {
        const inventoryDateStr = Utilities.formatDate(inventoryDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        
        if (inventoryDateStr === dateString && inventoryCurrency === currency) {
          foundExistingEntry = true;
          existingRow = i + 1; // +1 because rows are 1-indexed
          break;
        }
      }
    }
    
    // Update or create inventory entry
    if (foundExistingEntry) {
      // Update existing entry
      inventorySheet.getRange(existingRow, 3).setValue(newInventory); // Column C is balance
    } else {
      // Add new entry
      inventorySheet.appendRow([new Date(dateString), currency, newInventory]);
    }
    
    FOREX.Utils.addProcessingStep(`${currency} balance updated to ${newInventory}`);
    
    return {
      success: true,
      message: `Inventory for ${currency} updated successfully`,
      newBalance: newInventory
    };
  } catch (error) {
    Logger.log(`Error updating inventory for ${currency}: ${error}`);
    return {
      success: false,
      message: `Error updating inventory for ${currency}: ${error.toString()}`
    };
  }
};

/**
 * Record an inventory adjustment
 * @param {Object} adjustmentData - Adjustment data
 * @return {Object} Result with status and message
 */
FOREX.Inventory.recordInventoryAdjustment = function(adjustmentData) {
  try {
    // Initialize processing tracking if not already initialized
    if (typeof FOREX.Utils.getProcessingSteps() === 'undefined' || FOREX.Utils.getProcessingSteps().length === 0) {
      FOREX.Utils.initializeProcessingSteps();
    }
    
    FOREX.Utils.addProcessingStep("Recording inventory adjustment");
    
    // Validate adjustment data
    if (!adjustmentData || !adjustmentData.currency || !adjustmentData.date) {
      throw new Error('Invalid adjustment data: Missing currency or date');
    }
    
    // Parse the amount to ensure it's a number
    const amount = parseFloat(adjustmentData.amount);
    if (isNaN(amount)) {
      throw new Error('Invalid amount: Must be a number');
    }
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get or create the Adjustments sheet
    let adjustmentsSheet = ss.getSheetByName('Adjustments');
    
    if (!adjustmentsSheet) {
      // Create the sheet if it doesn't exist
      adjustmentsSheet = ss.insertSheet('Adjustments');
      
      // Add headers
      adjustmentsSheet.appendRow(['Date', 'Currency', 'Amount', 'Reason', 'Timestamp']);
      
      // Format headers
      adjustmentsSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }
    
    // Add adjustment to the sheet
    const adjustmentDate = new Date(adjustmentData.date);
    const timestamp = new Date();
    
    adjustmentsSheet.appendRow([
      adjustmentDate,
      adjustmentData.currency,
      amount,
      adjustmentData.reason || '',
      timestamp
    ]);
    
    FOREX.Utils.addProcessingStep(`Adjustment recorded: ${adjustmentData.currency} ${amount}`);
    
    // Update inventory for this currency and date
    const result = FOREX.Inventory.updateInventoryForDateAndCurrency(adjustmentDate, adjustmentData.currency);
    
    FOREX.Utils.addProcessingStep(`Inventory updated with new adjustment`);
    
    return {
      success: true,
      message: `Adjustment of ${amount} ${adjustmentData.currency} recorded successfully`,
      updateResult: result,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  } catch (error) {
    Logger.log(`Error recording inventory adjustment: ${error}`);
    return {
      success: false,
      message: `Error recording inventory adjustment: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
};
