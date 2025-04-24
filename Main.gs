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
  createHtmlTemplates();
  
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

/**
 * Creates HTML template files if they don't exist
 */
function createHtmlTemplates() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Create Transaction Form HTML
    createHtmlFile('TransactionForm', getTransactionFormHtml());
    
    // Create Settlement Form HTML
    createHtmlFile('SettlementForm', getSettlementFormHtml());
    
    // Create Swap Form HTML
    createHtmlFile('SwapForm', getSwapFormHtml());
    
    // Create Adjustment Form HTML
    createHtmlFile('AdjustmentForm', getAdjustmentFormHtml());
    
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
 * Returns the HTML content for the transaction form
 * @return {string} HTML content
 */
function getTransactionFormHtml() {
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
  </head>
  <body>
    <h2>New Transaction</h2>
    
    <div id="message" class="error" style="display:none;"></div>
    
    <form id="transactionForm">
      <div class="form-group">
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="<?= today ?>" required>
      </div>
      
      <div class="form-group">
        <label for="customer">Customer</label>
        <input type="text" id="customer" name="customer" required>
      </div>
      
      <div class="form-group">
        <label for="transactionType">Transaction Type</label>
        <select id="transactionType" name="transactionType" required>
          <? for (var i = 0; i < transactionTypes.length; i++) { ?>
            <option value="<?= transactionTypes[i] ?>"><?= transactionTypes[i] ?></option>
          <? } ?>
        </select>
      </div>
      
      <div class="form-group">
        <label for="currency">Currency</label>
        <select id="currency" name="currency" required>
          <? for (var i = 0; i < currencies.length; i++) { ?>
            <option value="<?= currencies[i] ?>" <?= currencies[i] === defaultCurrency ? 'selected' : '' ?>><?= currencies[i] ?></option>
          <? } ?>
        </select>
      </div>
      
      <div class="form-group">
        <label for="amount">Amount</label>
        <input type="number" id="amount" name="amount" step="0.01" min="0" required>
      </div>
      
      <div class="form-group">
        <label for="rate">Rate</label>
        <input type="number" id="rate" name="rate" step="0.01" min="0" required>
      </div>
      
      <div class="form-group">
        <label for="nature">Nature of Transaction</label>
        <input type="text" id="nature" name="nature" required>
      </div>
      
      <div class="form-group">
        <label for="source">Source</label>
        <select id="source" name="source" required>
          <option value="Walk-in">Walk-in</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Referral">Referral</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="staff">Staff</label>
        <select id="staff" name="staff" required>
          <? for (var i = 0; i < staffList.length; i++) { ?>
            <option value="<?= staffList[i] ?>"><?= staffList[i] ?></option>
          <? } ?>
        </select>
      </div>
      
      <div class="form-group">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes" rows="3"></textarea>
      </div>
      
      <div class="form-group">
        <label for="multiSettlement">Multiple Settlement Methods?</label>
        <select id="multiSettlement" name="multiSettlement">
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      
      <div class="button-group">
        <button type="button" class="cancel" onclick="google.script.host.close()">Cancel</button>
        <button type="submit">Save Transaction</button>
      </div>
    </form>
    
    <script>
      // Form submission handler
      document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
          date: document.getElementById('date').value,
          customer: document.getElementById('customer').value,
          transactionType: document.getElementById('transactionType').value,
          currency: document.getElementById('currency').value,
          amount: document.getElementById('amount').value,
          rate: document.getElementById('rate').value,
          nature: document.getElementById('nature').value,
          source: document.getElementById('source').value,
          staff: document.getElementById('staff').value,
          notes: document.getElementById('notes').value,
          multiSettlement: document.getElementById('multiSettlement').value
        };
        
        // Send data to server
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onFailure)
          .processTransactionForm(formData);
      });
      
      // Success handler
      function onSuccess(result) {
        if (result.success) {
          if (result.showSettlementForm) {
            // Redirect to settlement form
            google.script.run.showSettlementForm();
            google.script.host.close();
          } else {
            // Show success message
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = result.message;
            messageDiv.className = 'success';
            messageDiv.style.display = 'block';
            
            // Close the dialog after a delay
            setTimeout(function() {
              google.script.host.close();
            }, 2000);
          }
        } else {
          // Handle special cases
          if (result.showSwapForm) {
            google.script.run.showSwapForm();
            google.script.host.close();
          } else {
            // Show error message
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = result.message;
            messageDiv.className = 'error';
            messageDiv.style.display = 'block';
          }
        }
      }
      
      // Failure handler
      function onFailure(error) {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = "Error: " + error.message;
        messageDiv.className = 'error';
        messageDiv.style.display = 'block';
      }
    </script>
  </body>
</html>`;
}

/**
 * Returns the HTML content for the settlement form
 * This is a simplified version - the actual implementation is in FormHandlers.gs
 * @return {string} HTML content
 */
function getSettlementFormHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      }
      h2 {
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <h2>Transaction Settlement Form</h2>
    <p>This HTML file is a placeholder. The actual form will be created by FormHandlers.gs</p>
    <p>Please run the setupSystem function to create all required HTML templates.</p>
  </body>
</html>`;
}

/**
 * Returns the HTML content for the swap form
 * This is a simplified version - the actual implementation is in FormHandlers.gs
 * @return {string} HTML content
 */
function getSwapFormHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      }
      h2 {
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <h2>Swap Transaction Form</h2>
    <p>This HTML file is a placeholder. The actual form will be created by FormHandlers.gs</p>
    <p>Please run the setupSystem function to create all required HTML templates.</p>
  </body>
</html>`;
}

/**
 * Returns the HTML content for the adjustment form
 * This is a simplified version - the actual implementation is in FormHandlers.gs
 * @return {string} HTML content
 */
function getAdjustmentFormHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
      }
      h2 {
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <h2>Inventory Adjustment Form</h2>
    <p>This HTML file is a placeholder. The actual form will be created by FormHandlers.gs</p>
    <p>Please run the setupSystem function to create all required HTML templates.</p>
  </body>
</html>`;
}
