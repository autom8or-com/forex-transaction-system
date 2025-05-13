/**
 * Forex Transaction System - Utilities
 * 
 * Contains utility functions and constants used across the system
 */

// Sheet name constants
const SHEET_TRANSACTIONS = 'Transactions';
const SHEET_TRANSACTION_LEGS = 'Transaction_Legs';
const SHEET_INVENTORY = 'Daily_Inventory';
const SHEET_CONFIG = 'Config';
const SHEET_ADJUSTMENTS = 'Adjustments';

/**
 * Formats a date as YYYY-MM-DD
 * @param {Date} date - The date to format
 * @return {string} Formatted date string
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Formats a number with commas and decimal places
 * @param {number} number - The number to format
 * @param {number} decimals - Number of decimal places
 * @return {string} Formatted number string
 */
function formatNumber(number, decimals) {
  return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Gets the current user's email
 * @return {string} User email
 */
function getCurrentUserEmail() {
  return Session.getActiveUser().getEmail();
}

/**
 * Gets the current date as a Date object
 * @return {Date} Current date
 */
function getCurrentDate() {
  return new Date();
}

/**
 * Creates a date-based ID with optional prefix
 * @param {string} prefix - Optional prefix
 * @return {string} Date-based ID
 */
function createDateBasedId(prefix) {
  const datePart = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  return prefix ? `${prefix}-${datePart}` : datePart;
}

/**
 * Gets the most recent Monday date (for weekly reports)
 * @return {Date} Most recent Monday
 */
function getMostRecentMonday() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(today.setDate(diff));
}

/**
 * Gets the first day of the current month
 * @return {Date} First day of month
 */
function getFirstDayOfMonth() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Gets the last day of the current month
 * @return {Date} Last day of month
 */
function getLastDayOfMonth() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0);
}

/**
 * Creates an error log entry
 * @param {string} source - Source of the error
 * @param {string} message - Error message
 * @param {Object} data - Optional data related to the error
 */
function logError(source, message, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('Error_Log');
  
  // Create log sheet if it doesn't exist
  if (!logSheet) {
    logSheet = ss.insertSheet('Error_Log');
    
    // Add headers
    const headers = ['Timestamp', 'Source', 'Message', 'Data', 'User'];
    logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    logSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  // Add log entry
  const logEntry = [
    new Date(),
    source,
    message,
    data ? JSON.stringify(data) : '',
    Session.getActiveUser().getEmail()
  ];
  
  logSheet.appendRow(logEntry);
}

/**
 * Finds a sheet by name, creates it if it doesn't exist
 * @param {string} sheetName - The name of the sheet
 * @param {Array} headers - Optional headers for a new sheet
 * @return {Sheet} The sheet object
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    // Create the sheet
    sheet = ss.insertSheet(sheetName);
    
    // Add headers if provided
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    Logger.log(`Created sheet: ${sheetName}`);
  }
  
  return sheet;
}

/**
 * Shows a toast message in the spreadsheet
 * @param {string} message - The message to show
 * @param {string} title - Optional title
 * @param {number} timeout - Optional timeout in seconds
 */
function showToast(message, title, timeout) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast(message, title || 'Forex System', timeout || 5);
}

/**
 * Show a progress indicator with status message
 * This function provides a consistent way to show loading status across the system
 * 
 * @param {string} message - The loading message to display
 * @param {string} title - Optional title for the dialog
 * @return {boolean} Success status
 */
function showProgressIndicator(message, title) {
  try {
    const html = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        text-align: center;
      }
      .loader {
        border: 8px solid #f3f3f3;
        border-radius: 50%;
        border-top: 8px solid #3498db;
        width: 60px;
        height: 60px;
        margin: 30px auto;
        animation: spin 2s linear infinite;
      }
      .status {
        margin-top: 20px;
        font-size: 16px;
        color: #555;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="loader"></div>
    <div id="status" class="status">${message || 'Processing...'}</div>
    
    <script>
      function updateStatus(msg) {
        document.getElementById('status').textContent = msg;
      }
    </script>
  </body>
</html>`;

    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(300)
      .setHeight(200);
    
    SpreadsheetApp.getUi().showModelessDialog(htmlOutput, title || 'Processing');
    
    return true;
  } catch (error) {
    Logger.log(`Error showing progress indicator: ${error}`);
    return false;
  }
}

/**
 * Track processing steps for complex operations
 * This function logs processing steps for debugging and auditing
 * 
 * @param {string} operation - The operation being performed
 * @param {string} step - The current step
 * @param {Object} data - Optional data for the step
 */
function trackProcessingStep(operation, step, data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let trackingSheet = ss.getSheetByName('Processing_Log');
    
    // Create tracking sheet if it doesn't exist
    if (!trackingSheet) {
      trackingSheet = ss.insertSheet('Processing_Log');
      
      // Add headers
      const headers = ['Timestamp', 'Operation', 'Step', 'Data', 'User'];
      trackingSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      trackingSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Add tracking entry
    const trackingEntry = [
      new Date(),
      operation,
      step,
      data ? JSON.stringify(data) : '',
      Session.getActiveUser().getEmail()
    ];
    
    trackingSheet.appendRow(trackingEntry);
    
    // Log to Apps Script logs as well
    Logger.log(`Processing: ${operation} - ${step}`);
    
    return true;
  } catch (error) {
    Logger.log(`Error tracking processing step: ${error}`);
    return false;
  }
}

/**
 * Calculate the processing progress percentage
 * @param {number} current - Current step
 * @param {number} total - Total steps
 * @return {number} Progress percentage
 */
function calculateProgress(current, total) {
  // Ensure valid numbers and prevent division by zero
  if (!current || !total || total === 0) {
    return 0;
  }
  
  const progress = Math.round((current / total) * 100);
  
  // Ensure progress is between 0 and 100
  return Math.max(0, Math.min(100, progress));
}

/**
 * Validate required transaction fields
 * @param {Object} transactionData - Transaction data to validate
 * @return {Object} Validation result
 */
function validateTransactionData(transactionData) {
  // Define required fields based on transaction type
  const requiredFields = [
    'date', 
    'customer', 
    'transactionType',
    'currency',
    'amount',
    'rate'
  ];
  
  // Check for missing fields
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!transactionData[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  // Validate data types
  if (isNaN(transactionData.amount) || transactionData.amount <= 0) {
    return {
      valid: false,
      message: 'Amount must be a positive number'
    };
  }
  
  if (isNaN(transactionData.rate) || transactionData.rate <= 0) {
    return {
      valid: false,
      message: 'Rate must be a positive number'
    };
  }
  
  return {
    valid: true,
    message: 'Transaction data is valid'
  };
}
