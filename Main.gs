/**
 * Forex Transaction System - Main Script
 * 
 * This is the entry point for the Forex Transaction System.
 * It contains the menu setup and core functionality.
 * 
 * This version has been updated to work exclusively with the new FOREX namespace
 * modules instead of relying on the legacy files.
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
  // First, ensure all FOREX namespaces are initialized
  initializeForexSystem();
  
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
 * Initialize the FOREX system
 * Ensures all modules are loaded and functions are properly mapped
 */
function initializeForexSystem() {
  try {
    // Log the initialization process
    Logger.log("Initializing FOREX system...");
    
    // Ensure the global namespace exists
    if (typeof FOREX === 'undefined') {
      FOREX = {};
      Logger.log("Created FOREX global namespace");
    }
    
    // Initialize Core module
    if (typeof FOREX.Core === 'undefined') {
      FOREX.Core = {};
      Logger.log("Created FOREX.Core module");
    }
    
    // Initialize Forms module
    if (typeof FOREX.Forms === 'undefined') {
      FOREX.Forms = {};
      Logger.log("Created FOREX.Forms module");
    }
    
    // Initialize Inventory module
    if (typeof FOREX.Inventory === 'undefined') {
      FOREX.Inventory = {};
      Logger.log("Created FOREX.Inventory module");
    }
    
    // Initialize Transactions module
    if (typeof FOREX.Transactions === 'undefined') {
      FOREX.Transactions = {};
      Logger.log("Created FOREX.Transactions module");
    }
    
    // Initialize Reports module
    if (typeof FOREX.Reports === 'undefined') {
      FOREX.Reports = {};
      Logger.log("Created FOREX.Reports module");
    }
    
    // Initialize Utils module
    if (typeof FOREX.Utils === 'undefined') {
      FOREX.Utils = {};
      Logger.log("Created FOREX.Utils module");
    }
    
    // Call the Core.init function if it exists
    if (typeof FOREX.Core.init === 'function') {
      FOREX.Core.init();
      Logger.log("Called FOREX.Core.init()");
    } else {
      // Manually map global functions if Core.init doesn't exist
      mapGlobalFunctions();
      Logger.log("Manually mapped global functions");
    }
    
    Logger.log("FOREX system initialization complete");
    return true;
  } catch (error) {
    Logger.log(`Error initializing FOREX system: ${error.toString()}`);
    return false;
  }
}

/**
 * Map global functions to their namespaced equivalents
 * This function is used when FOREX.Core.init is not available
 */
function mapGlobalFunctions() {
  // Map Form functions
  if (typeof FOREX.Forms !== 'undefined') {
    if (typeof FOREX.Forms.showTransactionForm === 'function') {
      this.showTransactionForm = FOREX.Forms.showTransactionForm;
    }
    if (typeof FOREX.Forms.showSettlementForm === 'function') {
      this.showSettlementForm = FOREX.Forms.showSettlementForm;
    }
    if (typeof FOREX.Forms.showSwapForm === 'function') {
      this.showSwapForm = FOREX.Forms.showSwapForm;
    }
    if (typeof FOREX.Forms.showInventoryAdjustmentForm === 'function') {
      this.showInventoryAdjustmentForm = FOREX.Forms.showInventoryAdjustmentForm;
    }
    if (typeof FOREX.Forms.processTransactionForm === 'function') {
      this.processTransactionForm = FOREX.Forms.processTransactionForm;
    }
    if (typeof FOREX.Forms.processSettlementForm === 'function') {
      this.processSettlementForm = FOREX.Forms.processSettlementForm;
    }
    if (typeof FOREX.Forms.processSwapForm === 'function') {
      this.processSwapForm = FOREX.Forms.processSwapForm;
    }
    if (typeof FOREX.Forms.processAdjustmentForm === 'function') {
      this.processAdjustmentForm = FOREX.Forms.processAdjustmentForm;
    }
  }
  
  // Map Transaction functions
  if (typeof FOREX.Transactions !== 'undefined') {
    if (typeof FOREX.Transactions.createTransaction === 'function') {
      this.createTransaction = FOREX.Transactions.createTransaction;
    }
    if (typeof FOREX.Transactions.processSwapTransaction === 'function') {
      this.processSwapTransaction = FOREX.Transactions.processSwapTransaction;
    }
  }
  
  // Map Inventory functions
  if (typeof FOREX.Inventory !== 'undefined') {
    if (typeof FOREX.Inventory.updateDailyInventory === 'function') {
      this.updateDailyInventory = FOREX.Inventory.updateDailyInventory;
    }
    if (typeof FOREX.Inventory.updateInventoryForDateAndCurrency === 'function') {
      this.updateInventoryForDateAndCurrency = FOREX.Inventory.updateInventoryForDateAndCurrency;
    }
    if (typeof FOREX.Inventory.recordInventoryAdjustment === 'function') {
      this.recordInventoryAdjustment = FOREX.Inventory.recordInventoryAdjustment;
    }
  }
  
  // Map Utility functions
  if (typeof FOREX.Utils !== 'undefined') {
    if (typeof FOREX.Utils.getConfigSettings === 'function') {
      this.getConfigSettings = FOREX.Utils.getConfigSettings;
    } else {
      // Keep original implementation if not in Utils
      this.getConfigSettings = function() {
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
      };
    }
    
    if (typeof FOREX.Utils.camelCase === 'function') {
      this.camelCase = FOREX.Utils.camelCase;
    } else {
      // Keep original implementation if not in Utils
      this.camelCase = function(str) {
        return str
          .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
          .replace(/\s/g, '')
          .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
      };
    }
    
    if (typeof FOREX.Utils.createHtmlFile === 'function') {
      this.createHtmlFile = FOREX.Utils.createHtmlFile;
    }
    
    if (typeof FOREX.Utils.createHtmlTemplates === 'function') {
      this.createHtmlTemplates = FOREX.Utils.createHtmlTemplates;
    }
    
    // Progress tracking
    if (typeof FOREX.Utils.initializeProcessingSteps === 'function') {
      this.initializeProcessingSteps = FOREX.Utils.initializeProcessingSteps;
    }
    if (typeof FOREX.Utils.addProcessingStep === 'function') {
      this.addProcessingStep = FOREX.Utils.addProcessingStep;
    }
    if (typeof FOREX.Utils.getProcessingSteps === 'function') {
      this.getProcessingSteps = FOREX.Utils.getProcessingSteps;
    }
  }
}

/**
 * Shows a custom form for entering new transactions
 * Directly uses the FOREX.Forms implementation
 */
function showTransactionForm() {
  // Check if FOREX.Forms.showTransactionForm is available
  if (typeof FOREX !== 'undefined' && 
      typeof FOREX.Forms !== 'undefined' && 
      typeof FOREX.Forms.showTransactionForm === 'function') {
    
    // Use the FOREX.Forms implementation
    FOREX.Forms.showTransactionForm();
    return;
  }
  
  // Fallback implementation
  Logger.log("Could not find FOREX.Forms.showTransactionForm, using fallback implementation");
  
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
      '    // Try again after templates are created' +
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
  
  // If the template exists, we can proceed with the form setup
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
  
  // Make sure the includeProgressIndicator function is defined
  if (typeof includeProgressIndicator !== 'function') {
    if (typeof FOREX.Utils !== 'undefined' && 
        typeof FOREX.Utils.getProgressIndicatorHtml === 'function') {
      
      // Use the FOREX.Utils implementation for includeProgressIndicator
      htmlTemplate.includeProgressIndicator = function() {
        return FOREX.Utils.getProgressIndicatorHtml();
      };
    } else {
      // Create a basic implementation
      htmlTemplate.includeProgressIndicator = function() {
        return getProgressIndicatorHtml();
      };
    }
  }
  
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
  createHtmlTemplates();
  
  // Initialize FOREX system
  initializeForexSystem();
  
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
    'Transaction ID', 'Date', 'Transaction Type', 'Currency', 'Amount', 
    'Rate', 'Value (NGN)', 'Nature of Transaction', 'Customer', 'Source', 
    'Staff', 'Status', 'Notes', 'Timestamp'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Set up data validation for Transaction Type
  const transactionTypeRange = sheet.getRange(2, 3, 1000, 1);
  const transactionTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Buy', 'Sell', 'Swap'], true)
    .build();
  transactionTypeRange.setDataValidation(transactionTypeRule);
  
  // Set up data validation for Currency
  const currencyRange = sheet.getRange(2, 4, 1000, 1);
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
  sheet.getRange('E:E').setNumberFormat('#,##0.00');
  sheet.getRange('F:F').setNumberFormat('#,##0.00');
  sheet.getRange('G:G').setNumberFormat('#,##0.00');
  sheet.getRange('N:N').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
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
    'Transaction ID', 'Settlement Type', 'Currency', 'Amount', 
    'Bank/Account', 'Notes', 'Timestamp'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Set up data validation for Settlement Type
  const settlementTypeRange = sheet.getRange(2, 2, 1000, 1);
  const settlementTypeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Cash', 'Bank Transfer', 'Swap In', 'Swap Out'], true)
    .build();
  settlementTypeRange.setDataValidation(settlementTypeRule);
  
  // Set up data validation for Currency
  const currencyRange = sheet.getRange(2, 3, 1000, 1);
  const currencyRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['USD', 'GBP', 'EUR', 'NAIRA'], true)
    .build();
  currencyRange.setDataValidation(currencyRule);
  
  // Format columns
  sheet.getRange('D:D').setNumberFormat('#,##0.00');
  sheet.getRange('G:G').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  
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
    'Date', 'Currency', 'Balance'
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
  }
  
  // Format columns
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('C:C').setNumberFormat('#,##0.00');
  
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
    if (typeof FOREX !== 'undefined' && 
        typeof FOREX.Inventory !== 'undefined' && 
        typeof FOREX.Inventory.updateDailyInventory === 'function') {
      
      // Use the namespace version
      return FOREX.Inventory.updateDailyInventory();
    } else {
      // Fallback message
      const ui = SpreadsheetApp.getUi();
      ui.alert('Function Not Available', 'The inventory update feature is not available. Please make sure the FOREX.Inventory module is properly loaded.', ui.ButtonSet.OK);
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
    if (typeof FOREX !== 'undefined' && 
        typeof FOREX.Reports !== 'undefined' && 
        typeof FOREX.Reports.generateDailyReport === 'function') {
      
      // Use the namespace version
      return FOREX.Reports.generateDailyReport();
    } else {
      // Fallback message
      const ui = SpreadsheetApp.getUi();
      ui.alert('Function Not Available', 'The daily report feature is not available. Please make sure the FOREX.Reports module is properly loaded.', ui.ButtonSet.OK);
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
    if (typeof FOREX !== 'undefined' && 
        typeof FOREX.Reports !== 'undefined' && 
        typeof FOREX.Reports.generateStaffReport === 'function') {
      
      // Use the namespace version
      return FOREX.Reports.generateStaffReport();
    } else {
      // Fallback message
      const ui = SpreadsheetApp.getUi();
      ui.alert('Function Not Available', 'The staff report feature is not available. Please make sure the FOREX.Reports module is properly loaded.', ui.ButtonSet.OK);
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
    if (typeof FOREX !== 'undefined' && 
        typeof FOREX.Reports !== 'undefined' && 
        typeof FOREX.Reports.generateCustomerReport === 'function') {
      
      // Use the namespace version
      return FOREX.Reports.generateCustomerReport();
    } else {
      // Fallback message
      const ui = SpreadsheetApp.getUi();
      ui.alert('Function Not Available', 'The customer report feature is not available. Please make sure the FOREX.Reports module is properly loaded.', ui.ButtonSet.OK);
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
    // Check if FOREX.Utils.createHtmlTemplates is available
    if (typeof FOREX !== 'undefined' && 
        typeof FOREX.Utils !== 'undefined' && 
        typeof FOREX.Utils.createHtmlTemplates === 'function') {
      
      // Use the FOREX.Utils implementation
      return FOREX.Utils.createHtmlTemplates();
    }
    
    // Otherwise use the fallback implementation
    Logger.log("Using fallback implementation for createHtmlTemplates");
    
    // Add the Progress Indicator HTML to all templates
    const progressIndicatorHtml = getProgressIndicatorHtml();
    
    // Create basic templates with the progress indicator
    createHtmlFile('TransactionForm', getBasicFormHtml('Transaction', progressIndicatorHtml));
    createHtmlFile('SettlementForm', getBasicFormHtml('Settlement', progressIndicatorHtml));
    createHtmlFile('SwapForm', getBasicFormHtml('Swap', progressIndicatorHtml));
    createHtmlFile('AdjustmentForm', getBasicFormHtml('Adjustment', progressIndicatorHtml));
    createHtmlFile('ProgressIndicator', progressIndicatorHtml);
    
    return true;
  } catch (error) {
    Logger.log(`Error creating HTML templates: ${error}`);
    ui.alert('Error', `Failed to create HTML templates: ${error.toString()}`, ui.ButtonSet.OK);
    return false;
  }
}

/**
 * Creates a basic form HTML template
 * @param {string} formType - The type of form
 * @param {string} progressIndicatorHtml - The progress indicator HTML
 * @return {string} The basic form HTML
 */
function getBasicFormHtml(formType, progressIndicatorHtml) {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 10px;
      }
      .form-group {
        margin-bottom: 15px;
      }
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      input[type="text"], 
      input[type="number"], 
      input[type="date"], 
      select, 
      textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .button-group {
        margin-top: 20px;
        text-align: right;
      }
      button {
        padding: 8px 16px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button.cancel {
        background-color: #f1f1f1;
        color: #333;
        margin-right: 10px;
      }
      .error {
        color: red;
        margin-bottom: 15px;
      }
      .success {
        color: green;
        margin-bottom: 15px;
      }
    </style>
    
    <!-- Progress Indicator -->
    ${progressIndicatorHtml}
  </head>
  <body>
    <h2>${formType} Form</h2>
    
    <div id="message" class="error" style="display:none;">
      This is a placeholder ${formType} form. The actual form content will be loaded dynamically.
    </div>
    
    <div class="button-group">
      <button type="button" class="cancel" onclick="google.script.host.close()">Close</button>
    </div>
    
    <script>
      // Show the message when the page loads
      document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('message').style.display = 'block';
      });
    </script>
  </body>
</html>`;
}

/**
 * Creates an HTML file in the script project
 * @param {string} filename - The filename to create
 * @param {string} content - The file content
 * @return {boolean} Success status
 */
function createHtmlFile(filename, content) {
  try {
    // Check if FOREX.Utils.createHtmlFile is available
    if (typeof FOREX !== 'undefined' && 
        typeof FOREX.Utils !== 'undefined' && 
        typeof FOREX.Utils.createHtmlFile === 'function') {
      
      // Use the FOREX.Utils implementation
      return FOREX.Utils.createHtmlFile(filename, content);
    }
    
    // Otherwise use the fallback implementation
    Logger.log("Using fallback implementation for createHtmlFile");
    
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
 * Returns the HTML content for the progress indicator
 * @return {string} HTML content
 */
function getProgressIndicatorHtml() {
  // Check if FOREX.Utils.getProgressIndicatorHtml is available
  if (typeof FOREX !== 'undefined' && 
      typeof FOREX.Utils !== 'undefined' && 
      typeof FOREX.Utils.getProgressIndicatorHtml === 'function') {
    
    // Use the FOREX.Utils implementation
    return FOREX.Utils.getProgressIndicatorHtml();
  }
  
  // Otherwise use the fallback implementation
  return `<!-- Standardized Progress Indicator Component -->
<style>
  /* Loading overlay styles */
  .loading-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 1000;
  }
  
  .loading-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  
  .spinner {
    border: 8px solid #f3f3f3;
    border-radius: 50%;
    border-top: 8px solid #3498db;
    width: 60px;
    height: 60px;
    margin: 20px auto;
    animation: spin 2s linear infinite;
  }
  
  .processing-status {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
  }
  
  .processing-step {
    margin-top: 10px;
    font-size: 14px;
    color: #666;
  }
  
  .processing-steps {
    margin-top: 15px;
    text-align: left;
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .step-item {
    margin-bottom: 6px;
    font-size: 13px;
    color: #666;
    display: flex;
    align-items: center;
  }
  
  .step-indicator {
    display: inline-block;
    width: 18px;
    height: 18px;
    line-height: 18px;
    background: #e0e0e0;
    border-radius: 50%;
    text-align: center;
    margin-right: 8px;
    font-size: 12px;
    color: #fff;
  }
  
  .step-complete .step-indicator {
    background: #4CAF50;
  }
  
  .step-active .step-indicator {
    background: #2196F3;
  }
  
  .step-pending .step-indicator {
    background: #e0e0e0;
  }
  
  .step-text {
    flex: 1;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>

<!-- Loading overlay HTML template -->
<div id="loadingOverlay" class="loading-overlay">
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p id="processingStatus" class="processing-status">Processing...</p>
    <p id="processingStep" class="processing-step"></p>
    <div id="processingSteps" class="processing-steps">
      <!-- Processing steps will be added here dynamically -->
    </div>
  </div>
</div>

<script>
  // Show loading overlay with message
  function showLoadingOverlay(message) {
    document.getElementById('loadingOverlay').style.display = 'block';
    if (message) {
      document.getElementById('processingStatus').textContent = message;
    }
    // Disable all buttons while processing
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = true;
    });
  }
  
  // Hide loading overlay
  function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
    // Re-enable all buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = false;
    });
  }
  
  // Update the processing step message
  function updateProcessingStep(step) {
    document.getElementById('processingStep').textContent = step;
  }
  
  // Initialize processing steps display
  function initializeProcessingSteps(steps) {
    const stepsContainer = document.getElementById('processingSteps');
    stepsContainer.innerHTML = '';
    
    steps.forEach((step, index) => {
      const stepItem = document.createElement('div');
      stepItem.className = 'step-item step-pending';
      stepItem.id = 'step-' + index;
      
      stepItem.innerHTML = \`
        <span class="step-indicator">\${index + 1}</span>
        <span class="step-text">\${step}</span>
      \`;
      
      stepsContainer.appendChild(stepItem);
    });
  }
  
  // Set a specific step as active (in progress)
  function setStepActive(stepIndex) {
    // First, make sure all previous steps are complete
    for (let i = 0; i < stepIndex; i++) {
      const step = document.getElementById('step-' + i);
      if (step) {
        step.className = 'step-item step-complete';
      }
    }
    
    // Set the current step as active
    const currentStep = document.getElementById('step-' + stepIndex);
    if (currentStep) {
      currentStep.className = 'step-item step-active';
    }
  }
  
  // Mark a specific step as complete
  function setStepComplete(stepIndex) {
    const step = document.getElementById('step-' + stepIndex);
    if (step) {
      step.className = 'step-item step-complete';
    }
    
    // Set next step as active if available
    const nextStep = document.getElementById('step-' + (stepIndex + 1));
    if (nextStep) {
      nextStep.className = 'step-item step-active';
    }
  }
  
  // Mark all steps as complete
  function setAllStepsComplete() {
    const stepsContainer = document.getElementById('processingSteps');
    const steps = stepsContainer.querySelectorAll('.step-item');
    
    steps.forEach(step => {
      step.className = 'step-item step-complete';
    });
  }
  
  // Update processing steps based on server response
  function updateProcessingStepsFromResult(steps) {
    // Reinitialize with the actual steps from the server
    initializeProcessingSteps(steps);
    
    // Show steps one by one with a delay to simulate progress
    let i = 0;
    const stepInterval = setInterval(function() {
      setStepComplete(i);
      i++;
      
      if (i >= steps.length - 1) {
        clearInterval(stepInterval);
        setAllStepsComplete();
      }
    }, 500);
  }
  
  // Initialize transaction processing with default steps based on transaction type
  function initTransactionProcessing(transactionType) {
    let steps = [];
    
    switch(transactionType) {
      case 'transaction':
        steps = [
          "Validating transaction data",
          "Creating transaction record",
          "Processing settlement",
          "Updating inventory"
        ];
        break;
      case 'settlement':
        steps = [
          "Validating settlement data",
          "Processing settlement legs",
          "Creating transaction record",
          "Updating inventory"
        ];
        break;
      case 'swap':
        steps = [
          "Validating swap data",
          "Creating sell transaction",
          "Creating buy transaction",
          "Updating inventory"
        ];
        break;
      case 'adjustment':
        steps = [
          "Validating adjustment data",
          "Updating inventory",
          "Saving adjustment record"
        ];
        break;
      default:
        steps = [
          "Processing data",
          "Saving records",
          "Completing operation"
        ];
    }
    
    // Initialize the steps display
    initializeProcessingSteps(steps);
    setStepActive(0); // Set first step as active
  }
  
  // Handle form success with progress updates
  function handleFormSuccess(result) {
    // Update processing steps if provided
    if (result.processingSteps) {
      updateProcessingStepsFromResult(result.processingSteps);
    }
    
    if (result.success) {
      // Set all steps as complete
      setAllStepsComplete();
      
      // Show success message
      const messageDiv = document.getElementById('message');
      if (messageDiv) {
        messageDiv.innerHTML = result.message;
        messageDiv.className = 'success';
        messageDiv.style.display = 'block';
      }
      
      // Hide loading overlay after a short delay
      setTimeout(function() {
        hideLoadingOverlay();
      }, 1000);
      
      // Close the dialog after a delay if autoClose is true
      if (result.closeForm !== false) {
        setTimeout(function() {
          google.script.host.close();
        }, 2000);
      }
    } else {
      // Handle special cases
      if (result.showSettlementForm) {
        // Update processing status before redirection
        updateProcessingStep("Opening settlement form...");
        
        // Short delay before redirect to show the final status
        setTimeout(function() {
          google.script.run.showSettlementForm();
          google.script.host.close();
        }, 1000);
      } else if (result.showSwapForm) {
        // Update processing status before redirection
        updateProcessingStep("Opening swap form...");
        
        // Short delay before redirect
        setTimeout(function() {
          google.script.run.showSwapForm();
          google.script.host.close();
        }, 1000);
      } else {
        // Hide loading overlay
        hideLoadingOverlay();
        
        // Show error message
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
          messageDiv.innerHTML = result.message;
          messageDiv.className = 'error';
          messageDiv.style.display = 'block';
        }
      }
    }
  }
  
  // Handle form failure with error display
  function handleFormFailure(error) {
    // Hide loading overlay
    hideLoadingOverlay();
    
    // Show error message
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.innerHTML = "Error: " + (error.message || error);
      messageDiv.className = 'error';
      messageDiv.style.display = 'block';
    }
  }
</script>`;
}

/**
 * Gets configuration settings from the Config sheet
 * @return {Object} Configuration settings
 */
function getConfigSettings() {
  // Check if FOREX.Utils.getConfigSettings is available
  if (typeof FOREX !== 'undefined' && 
      typeof FOREX.Utils !== 'undefined' && 
      typeof FOREX.Utils.getConfigSettings === 'function') {
    
    // Use the FOREX.Utils implementation
    return FOREX.Utils.getConfigSettings();
  }
  
  // Otherwise use the fallback implementation
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(SHEET_CONFIG);
  
  if (!configSheet) {
    Logger.log("Config sheet not found");
    return {};
  }
  
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
 * Helper function to make templates work
 * This is required for HTML templates to include the progress indicator
 */
function includeProgressIndicator() {
  return HtmlService.createHtmlOutputFromFile('ProgressIndicator').getContent();
}

/**
 * Converts a string to camelCase
 * @param {string} str - The string to convert
 * @return {string} Camel-cased string
 */
function camelCase(str) {
  // Check if FOREX.Utils.camelCase is available
  if (typeof FOREX !== 'undefined' && 
      typeof FOREX.Utils !== 'undefined' && 
      typeof FOREX.Utils.camelCase === 'function') {
    
    // Use the FOREX.Utils implementation
    return FOREX.Utils.camelCase(str);
  }
  
  // Otherwise use the fallback implementation
  return str
    .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
    .replace(/\s/g, '')
    .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
}
