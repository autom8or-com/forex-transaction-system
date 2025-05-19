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
 * Creates custom menu and initializes FOREX system
 */
function onOpen() {
  // Initialize the FOREX namespace system
  if (typeof FOREX !== 'undefined') {
    FOREX.Core.init();
  }
  
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
 * Shows a custom form for entering new transactions
 * 
 * Note: In Google Apps Script, functions with the same name across files are all available
 * in the global namespace. The implementation in FormHandlers.gs will override this one
 * if both are present, but we're leaving this implementation empty to prevent confusion.
 */
function showTransactionForm() {
  // We need a temporary HTML template file to ensure the form will properly display
  let htmlTemplate;
  
  try {
    // Try to get the pre-existing template first
    htmlTemplate = HtmlService.createTemplateFromFile('TransactionForm');
  } catch (e) {
    // If the template doesn't exist, create a temporary redirect template
    const tempHtml = HtmlService.createTemplate(
      '<script>' +
      '  // Create the TransactionForm HTML file if needed' +
      '  google.script.run.withSuccessHandler(function() {' +
      '    // Redirect to the actual function in FormHandlers.gs' +
      '    google.script.run.showTransactionForm();' +
      '    google.script.host.close();' +
      '  }).createHtmlTemplates();' +
      '</script>' +
      '<div style="padding: 20px; text-align: center;">' +
      '  <h3>Setting up Transaction Forms...</h3>' +
      '  <p>Please wait while we prepare the transaction forms.</p>' +
      '</div>'
    );
    
    const html = tempHtml.evaluate()
      .setWidth(300)
      .setHeight(200)
      .setTitle('Preparing Forms');
    
    SpreadsheetApp.getUi().showModalDialog(html, 'Preparing Forms');
    return;
  }
  
  // If the template exists, we can proceed with the actual implementation in FormHandlers.gs
  const config = getConfigSettings();
  
  // Get staff list from config
  const staffList = config.staffNames ? config.staffNames.split(',') : [''];
  
  // Add data to template
  htmlTemplate.staffList = staffList;
  htmlTemplate.defaultCurrency = config.defaultCurrency || 'USD';
  htmlTemplate.transactionTypes = config.transactionTypes ? config.transactionTypes.split(',') : ['Buy', 'Sell', 'Swap'];
  htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  
  // Get today's date in yyyy-MM-dd format
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  htmlTemplate.today = today;
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(600)
    .setHeight(700)
    .setTitle('New Transaction');
  
  // Show the form
  SpreadsheetApp.getUi().showModalDialog(html, 'New Transaction');
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
  
  // Create HTML template files for forms
  // Use FOREX.Utils.createHtmlTemplates if available, otherwise fall back to global function
  if (typeof FOREX !== 'undefined' && FOREX.Utils && FOREX.Utils.createHtmlTemplates) {
    FOREX.Utils.createHtmlTemplates();
  } else {
    createHtmlTemplates();
  }
  
  // Initialize FOREX system
  if (typeof FOREX !== 'undefined') {
    FOREX.Core.init();
  }
  
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
 * This delegates to the FOREX.Inventory module
 */
function updateDailyInventory() {
  try {
    if (typeof FOREX !== 'undefined' && FOREX.Inventory && FOREX.Inventory.updateDailyInventory) {
      // Use the namespace version if available
      return FOREX.Inventory.updateDailyInventory();
    } else {
      // Fallback to old implementation
      const ui = SpreadsheetApp.getUi();
      ui.alert('Not Implemented', 'The inventory update will be implemented in InventoryManager.gs', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log(`Error updating inventory: ${error}`);
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', `Error updating inventory: ${error.toString()}`, ui.ButtonSet.OK);
  }
}

/**
 * Generates a daily summary report
 */
function generateDailyReport() {
  try {
    if (typeof FOREX !== 'undefined' && FOREX.Reports && FOREX.Reports.generateDailyReport) {
      // Use the namespace version if available
      return FOREX.Reports.generateDailyReport();
    } else {
      // Fallback to old implementation
      const ui = SpreadsheetApp.getUi();
      ui.alert('Not Implemented', 'The daily report feature is not available. Please make sure the FOREX.Reports module is properly loaded.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log(`Error generating daily report: ${error}`);
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', `Error generating daily report: ${error.toString()}`, ui.ButtonSet.OK);
  }
}

/**
 * Generates a staff performance report
 */
function generateStaffReport() {
  try {
    if (typeof FOREX !== 'undefined' && FOREX.Reports && FOREX.Reports.generateStaffReport) {
      // Use the namespace version if available
      return FOREX.Reports.generateStaffReport();
    } else {
      // Fallback to old implementation
      const ui = SpreadsheetApp.getUi();
      ui.alert('Not Implemented', 'The staff report feature is not available. Please make sure the FOREX.Reports module is properly loaded.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log(`Error generating staff report: ${error}`);
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', `Error generating staff report: ${error.toString()}`, ui.ButtonSet.OK);
  }
}

/**
 * Generates a customer analytics report
 */
function generateCustomerReport() {
  try {
    if (typeof FOREX !== 'undefined' && FOREX.Reports && FOREX.Reports.generateCustomerReport) {
      // Use the namespace version if available
      return FOREX.Reports.generateCustomerReport();
    } else {
      // Fallback to old implementation
      const ui = SpreadsheetApp.getUi();
      ui.alert('Not Implemented', 'The customer report feature is not available. Please make sure the FOREX.Reports module is properly loaded.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log(`Error generating customer report: ${error}`);
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', `Error generating customer report: ${error.toString()}`, ui.ButtonSet.OK);
  }
}

/**
 * Creates HTML template files if they don't exist
 */
function createHtmlTemplates() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Delegate to the FOREX.Utils implementation if available
    if (typeof FOREX !== 'undefined' && FOREX.Utils && FOREX.Utils.createHtmlTemplates) {
      return FOREX.Utils.createHtmlTemplates();
    }
    
    // Fallback implementation
    // Create Transaction Form HTML
    const transactionHtml = (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getTransactionFormHtml) 
      ? FOREX.Templates.getTransactionFormHtml() 
      : getTransactionFormHtml();
    createHtmlFile('TransactionForm', transactionHtml);
    
    // Create Settlement Form HTML
    const settlementHtml = (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getSettlementFormHtml) 
      ? FOREX.Templates.getSettlementFormHtml() 
      : getSettlementFormHtml();
    createHtmlFile('SettlementForm', settlementHtml);
    
    // Create Swap Form HTML
    const swapHtml = (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getSwapFormHtml) 
      ? FOREX.Templates.getSwapFormHtml() 
      : getSwapFormHtml();
    createHtmlFile('SwapForm', swapHtml);
    
    // Create Adjustment Form HTML
    const adjustmentHtml = (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getAdjustmentFormHtml) 
      ? FOREX.Templates.getAdjustmentFormHtml() 
      : getAdjustmentFormHtml();
    createHtmlFile('AdjustmentForm', adjustmentHtml);
    
    // Create Progress Indicator HTML
    const progressHtml = (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getProgressIndicatorHtml) 
      ? FOREX.Templates.getProgressIndicatorHtml() 
      : getProgressIndicatorHtml();
    createHtmlFile('ProgressIndicator', progressHtml);
    
    return true;
  } catch (error) {
    Logger.log(`Error creating HTML templates: ${error}`);
    ui.alert('Error', `Failed to create HTML templates: ${error.toString()}`, ui.ButtonSet.OK);
    return false;
  }
}

/**
 * Creates an HTML file in the script project
 * @param {string} filename - The filename to create
 * @param {string} content - The file content
 * @return {boolean} Success status
 */
function createHtmlFile(filename, content) {
  try {
    // Delegate to the FOREX.Utils implementation if available
    if (typeof FOREX !== 'undefined' && FOREX.Utils && FOREX.Utils.createHtmlFile) {
      return FOREX.Utils.createHtmlFile(filename, content);
    }
    
    // Fallback implementation
    // Create or update the HTML file
    const htmlOutput = HtmlService.createHtmlOutput(content)
      .setTitle(filename);
    
    // Log creation
    Logger.log(`HTML file ${filename}.html created or updated`);
    return true;
  } catch (error) {
    Logger.log(`Error creating HTML file: ${error}`);
    return false;
  }
}

/**
 * Gets configuration settings from the Config sheet
 * @return {Object} Configuration settings
 */
function getConfigSettings() {
  // Delegate to the FOREX.Utils implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Utils && FOREX.Utils.getConfigSettings) {
    return FOREX.Utils.getConfigSettings();
  }
  
  // Fallback implementation
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
  // Delegate to the FOREX.Utils implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Utils && FOREX.Utils.camelCase) {
    return FOREX.Utils.camelCase(str);
  }
  
  // Fallback implementation
  return str
    .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
    .replace(/\s/g, '')
    .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
}

/**
 * Returns the HTML content for the progress indicator
 * This function is maintained for backward compatibility but delegates to FOREX.Templates
 * @return {string} HTML content
 */
function getProgressIndicatorHtml() {
  // Delegate to the FOREX.Templates implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getProgressIndicatorHtml) {
    return FOREX.Templates.getProgressIndicatorHtml();
  }
  
  // Fallback to empty implementation - this should not be called if properly setup
  return '';
}

/**
 * Returns the HTML content for the transaction form
 * This function is maintained for backward compatibility but delegates to FOREX.Templates
 * @return {string} HTML content
 */
function getTransactionFormHtml() {
  // Delegate to the FOREX.Templates implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getTransactionFormHtml) {
    return FOREX.Templates.getTransactionFormHtml();
  }
  
  // Fallback to empty implementation - this should not be called if properly setup
  return '';
}

/**
 * Returns the HTML content for the settlement form
 * This function is maintained for backward compatibility but delegates to FOREX.Templates
 * @return {string} HTML content
 */
function getSettlementFormHtml() {
  // Delegate to the FOREX.Templates implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getSettlementFormHtml) {
    return FOREX.Templates.getSettlementFormHtml();
  }
  
  // Fallback to empty implementation - this should not be called if properly setup
  return '';
}

/**
 * Returns the HTML content for the swap form
 * This function is maintained for backward compatibility but delegates to FOREX.Templates
 * @return {string} HTML content
 */
function getSwapFormHtml() {
  // Delegate to the FOREX.Templates implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getSwapFormHtml) {
    return FOREX.Templates.getSwapFormHtml();
  }
  
  // Fallback to empty implementation - this should not be called if properly setup
  return '';
}

/**
 * Returns the HTML content for the adjustment form
 * This function is maintained for backward compatibility but delegates to FOREX.Templates
 * @return {string} HTML content
 */
function getAdjustmentFormHtml() {
  // Delegate to the FOREX.Templates implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Templates && FOREX.Templates.getAdjustmentFormHtml) {
    return FOREX.Templates.getAdjustmentFormHtml();
  }
  
  // Fallback to empty implementation - this should not be called if properly setup
  return '';
}

/**
 * Process the settlement form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
function processSettlementForm(formData) {
  // Delegate to the FOREX.Forms implementation
  if (typeof FOREX !== 'undefined' && FOREX.Forms && FOREX.Forms.processSettlementForm) {
    return FOREX.Forms.processSettlementForm(formData);
  } else {
    // Fallback to ensure backwards compatibility
    try {
      // Initialize processing tracking
      initializeProcessingSteps();
      
      // Get pending transaction data
      const props = PropertiesService.getScriptProperties();
      const pendingTransactionJson = props.getProperty('pendingTransaction');
      
      if (!pendingTransactionJson) {
        return {
          success: false,
          message: 'No pending transaction found',
          processingSteps: getProcessingSteps()
        };
      }
      
      // Parse transaction data
      const pendingTransaction = JSON.parse(pendingTransactionJson);
      
      addProcessingStep("Settlement data validated");
      addProcessingStep(`${formData.settlements.length} settlement legs processed`);
      
      // Ensure settlement amounts are properly parsed as numbers
      const optimizedLegs = formData.settlements.map(settlement => {
        return {
          settlementType: settlement.settlementType || '',
          currency: settlement.currency || pendingTransaction.currency,
          amount: parseFloat(settlement.amount) || 0,
          bankAccount: settlement.bankAccount || '',
          notes: settlement.notes || ''
        };
      });
      
      // Create transaction with settlement legs
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
      const result = createTransaction(transactionData);
      
      // Clear pending transaction data
      props.deleteProperty('pendingTransaction');
      
      // Ensure processing steps are included
      if (!result.processingSteps) {
        result.processingSteps = getProcessingSteps();
      }
      
      return result;
    } catch (error) {
      Logger.log(`Error processing settlement form: ${error}`);
      return {
        success: false,
        message: `Error processing form: ${error.toString()}`,
        processingSteps: getProcessingSteps()
      };
    }
  }
}

// Global processing steps tracking
// These will be deprecated in favor of the FOREX.Forms implementations
let _processingSteps = [];

/**
 * Initialize the processing steps tracking
 * @deprecated Use FOREX.Forms.initializeProcessingSteps instead
 */
function initializeProcessingSteps() {
  _processingSteps = [];
}

/**
 * Add a processing step to track progress
 * @param {string} step - Description of the processing step
 * @deprecated Use FOREX.Forms.addProcessingStep instead
 */
function addProcessingStep(step) {
  _processingSteps.push(step);
  Logger.log(`Processing step: ${step}`);
}

/**
 * Get current processing steps
 * @return {Array} Array of processing steps
 * @deprecated Use FOREX.Forms.getProcessingSteps instead
 */
function getProcessingSteps() {
  return _processingSteps;
}
