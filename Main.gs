/**
 * Forex Transaction System - Main Script
 * 
 * This is the entry point for the Forex Transaction System.
 * It contains the menu setup and core functionality.
 */

// Constants for sheet names
const SHEET_TRANSACTIONS = 'Transactions';
const SHEET_TRANSACTION_LEGS = 'Transaction_Legs';
const SHEET_DAILY_INVENTORY = 'Daily_Inventory';
const SHEET_CONFIG = 'Config';
const SHEET_DASHBOARD = 'Dashboard';

/**
 * Runs when the spreadsheet is opened
 * Creates custom menu
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Forex System')
    .addItem('New Transaction', 'showTransactionForm')
    .addSeparator()
    .addItem('Update Daily Inventory', 'updateDailyInventory')
    .addSeparator()
    .addSubMenu(ui.createMenu('Reports')
      .addItem('Daily Summary', 'generateDailyReport')
      .addItem('Staff Performance', 'generateStaffReport')
      .addItem('Customer Analytics', 'generateCustomerReport'))
    .addSeparator()
    .addItem('System Setup', 'setupSystem')
    .addToUi();
}

/**
 * Initial system setup
 * Creates necessary sheets and configurations
 */
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Confirm before proceeding
  const response = ui.alert(
    'System Setup',
    'This will set up the Forex Transaction System, creating necessary sheets and configurations. Proceed?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  // Create sheets if they don't exist
  createSheetIfNotExists(SHEET_TRANSACTIONS);
  createSheetIfNotExists(SHEET_TRANSACTION_LEGS);
  createSheetIfNotExists(SHEET_DAILY_INVENTORY);
  createSheetIfNotExists(SHEET_CONFIG);
  createSheetIfNotExists(SHEET_DASHBOARD);
  
  // Set up transaction sheet
  setupTransactionSheet();
  
  // Set up transaction legs sheet
  setupTransactionLegsSheet();
  
  // Set up daily inventory sheet
  setupDailyInventorySheet();
  
  // Set up config sheet
  setupConfigSheet();
  
  // Set up dashboard
  setupDashboardSheet();
  
  ui.alert('Setup Complete', 'The Forex Transaction System has been set up successfully.', ui.ButtonSet.OK);
}

/**
 * Creates a sheet if it doesn't already exist
 * @param {string} sheetName - Name of the sheet to create
 * @return {Sheet} The sheet object
 */
function createSheetIfNotExists(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    Logger.log(`Created sheet: ${sheetName}`);
  } else {
    Logger.log(`Sheet already exists: ${sheetName}`);
  }
  
  return sheet;
}

/**
 * Sets up the Transaction sheet with headers and validation
 */
function setupTransactionSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  
  // Clear existing content
  sheet.clear();
  
  // Set headers
  const headers = [
    'Transaction ID', 'Date', 'Customer', 'Transaction Type', 'Currency', 
    'Amount', 'Rate', 'Value (NGN)', 'Nature of Transaction', 'Source', 
    'Staff', 'Status', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Set up data validation for Transaction Type
  const transactionTypeRange = sheet.getRange(2, 4, 1000, 1);
  const transactionTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Buy', 'Sell', 'Swap'], true)
    .build();
  transactionTypeRange.setDataValidation(transactionTypeRule);
  
  // Set up data validation for Currency
  const currencyRange = sheet.getRange(2, 5, 1000, 1);
  const currencyRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['USD', 'GBP', 'EUR', 'NAIRA'], true)
    .build();
  currencyRange.setDataValidation(currencyRule);
  
  // Set up data validation for Status
  const statusRange = sheet.getRange(2, 12, 1000, 1);
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Complete', 'Pending Rate'], true)
    .build();
  statusRange.setDataValidation(statusRule);
  
  // Format columns
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('F:F').setNumberFormat('#,##0.00');
  sheet.getRange('G:G').setNumberFormat('#,##0.00');
  sheet.getRange('H:H').setNumberFormat('#,##0.00');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Sets up the Transaction Legs sheet with headers and validation
 */
function setupTransactionLegsSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTION_LEGS);
  
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
}

/**
 * Sets up the Daily Inventory sheet with headers and formulas
 */
function setupDailyInventorySheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DAILY_INVENTORY);
  
  // Clear existing content
  sheet.clear();
  
  // Set headers
  const headers = [
    'Date', 'Currency', 'Opening Balance', 'Purchases', 'Sales', 
    'Adjustments', 'Closing Balance'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Set initial currencies
  const currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  const today = new Date();
  
  for (let i = 0; i < currencies.length; i++) {
    sheet.getRange(i + 2, 1).setValue(today);
    sheet.getRange(i + 2, 2).setValue(currencies[i]);
    // Initial balance - this would be set manually
    sheet.getRange(i + 2, 3).setValue(0);
    // Purchases formula - placeholder, will be updated by script
    sheet.getRange(i + 2, 4).setValue(0);
    // Sales formula - placeholder, will be updated by script
    sheet.getRange(i + 2, 5).setValue(0);
    // Adjustments - default to 0
    sheet.getRange(i + 2, 6).setValue(0);
    // Closing balance formula
    sheet.getRange(i + 2, 7).setFormula('=C' + (i + 2) + '+D' + (i + 2) + '-E' + (i + 2) + '+F' + (i + 2));
  }
  
  // Format columns
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('C:G').setNumberFormat('#,##0.00');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Sets up the Config sheet with system settings
 */
function setupConfigSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG);
  
  // Clear existing content
  sheet.clear();
  
  // Set headers and initial values
  const configData = [
    ['Setting', 'Value', 'Description'],
    ['Transaction ID Prefix', 'TX-', 'Prefix for transaction IDs'],
    ['Default Currency', 'USD', 'Default currency for new transactions'],
    ['Report Email', '', 'Email to send reports to'],
    ['Staff Names', 'Femi,Taiye', 'Comma-separated list of staff names'],
    ['Auto Update Inventory', 'TRUE', 'Automatically update inventory on new transactions'],
    ['Transaction Types', 'Buy,Sell,Swap', 'Available transaction types']
  ];
  
  sheet.getRange(1, 1, configData.length, 3).setValues(configData);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 3);
  
  // Protect the config sheet
  const protection = sheet.protect().setDescription('Config Protection');
  protection.setWarningOnly(true);
}

/**
 * Sets up the Dashboard sheet
 */
function setupDashboardSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DASHBOARD);
  
  // Clear existing content
  sheet.clear();
  
  // Set title
  sheet.getRange(1, 1).setValue('FOREX TRANSACTION SYSTEM DASHBOARD');
  sheet.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  
  // Current Date
  sheet.getRange(2, 1).setValue('Report Date:');
  sheet.getRange(2, 2).setFormula('=TODAY()');
  sheet.getRange(2, 2).setNumberFormat('yyyy-mm-dd');
  
  // Section headers
  sheet.getRange(4, 1).setValue('CURRENT INVENTORY');
  sheet.getRange(4, 1).setFontWeight('bold');
  
  sheet.getRange(11, 1).setValue('TODAY\'S TRANSACTIONS');
  sheet.getRange(11, 1).setFontWeight('bold');
  
  sheet.getRange(18, 1).setValue('STAFF PERFORMANCE');
  sheet.getRange(18, 1).setFontWeight('bold');
  
  // Current Inventory Section
  const inventoryHeaders = ['Currency', 'Balance'];
  sheet.getRange(5, 1, 1, 2).setValues([inventoryHeaders]);
  sheet.getRange(5, 1, 1, 2).setFontWeight('bold');
  
  const currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  for (let i = 0; i < currencies.length; i++) {
    sheet.getRange(6 + i, 1).setValue(currencies[i]);
    // These will be updated by the script
    sheet.getRange(6 + i, 2).setValue(0);
  }
  
  // Format the dashboard nicely
  sheet.getRange('B6:B9').setNumberFormat('#,##0.00');
}

/**
 * Updates the daily inventory sheet with latest transaction data
 */
function updateDailyInventory() {
  // This will be implemented in InventoryManager.gs
  // For now, just show a message
  const ui = SpreadsheetApp.getUi();
  ui.alert('Not Implemented', 'The inventory update will be implemented in InventoryManager.gs', ui.ButtonSet.OK);
}

/**
 * Generates a daily summary report
 */
function generateDailyReport() {
  // This will be implemented in ReportGenerator.gs
  // For now, just show a message
  const ui = SpreadsheetApp.getUi();
  ui.alert('Not Implemented', 'The daily report will be implemented in ReportGenerator.gs', ui.ButtonSet.OK);
}

/**
 * Generates a staff performance report
 */
function generateStaffReport() {
  // This will be implemented in ReportGenerator.gs
  // For now, just show a message
  const ui = SpreadsheetApp.getUi();
  ui.alert('Not Implemented', 'The staff report will be implemented in ReportGenerator.gs', ui.ButtonSet.OK);
}

/**
 * Generates a customer analytics report
 */
function generateCustomerReport() {
  // This will be implemented in ReportGenerator.gs
  // For now, just show a message
  const ui = SpreadsheetApp.getUi();
  ui.alert('Not Implemented', 'The customer report will be implemented in ReportGenerator.gs', ui.ButtonSet.OK);
}
