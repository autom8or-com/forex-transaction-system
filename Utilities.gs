/**
 * Forex Transaction System - Utilities
 * 
 * Contains utility functions used across the system:
 * - Date handling
 * - Formatting
 * - Validation
 * - Export functions
 * - Sheet management
 */

/**
 * Get the first day of the current month
 * @return {Date} First day of the month
 */
function getFirstDayOfMonth() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

/**
 * Get the last day of the current month
 * @return {Date} Last day of the month
 */
function getLastDayOfMonth() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0);
}

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date - The date to format
 * @return {string} Formatted date
 */
function formatDateYMD(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Format a date with a friendly display format
 * @param {Date} date - The date to format
 * @return {string} Formatted date
 */
function formatDateFriendly(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM d, yyyy');
}

/**
 * Format a number with commas and 2 decimal places
 * @param {number} num - The number to format
 * @return {string} Formatted number
 */
function formatCurrency(num) {
  if (typeof num !== 'number') return num;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Validate a transaction object
 * @param {Object} transaction - Transaction data to validate
 * @return {Object} Validation result with success flag and message
 */
function validateTransaction(transaction) {
  // Required fields
  const requiredFields = [
    'date',
    'customer',
    'transactionType',
    'currency',
    'amount',
    'rate'
  ];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!transaction[field]) {
      return {
        success: false,
        message: `Missing required field: ${field}`
      };
    }
  }
  
  // Validate date
  if (!(transaction.date instanceof Date) && isNaN(new Date(transaction.date).getTime())) {
    return {
      success: false,
      message: 'Invalid date'
    };
  }
  
  // Validate transaction type
  if (!['Buy', 'Sell', 'Swap'].includes(transaction.transactionType)) {
    return {
      success: false,
      message: 'Invalid transaction type. Must be "Buy", "Sell", or "Swap"'
    };
  }
  
  // Validate currency
  if (!['USD', 'GBP', 'EUR', 'NAIRA'].includes(transaction.currency)) {
    return {
      success: false,
      message: 'Invalid currency. Must be "USD", "GBP", "EUR", or "NAIRA"'
    };
  }
  
  // Validate amount and rate
  if (isNaN(parseFloat(transaction.amount)) || parseFloat(transaction.amount) <= 0) {
    return {
      success: false,
      message: 'Invalid amount. Must be a positive number'
    };
  }
  
  if (isNaN(parseFloat(transaction.rate)) || parseFloat(transaction.rate) <= 0) {
    return {
      success: false,
      message: 'Invalid rate. Must be a positive number'
    };
  }
  
  return {
    success: true,
    message: 'Transaction validation successful'
  };
}

/**
 * Exports transaction data to CSV
 * @param {Date} startDate - Start date for export
 * @param {Date} endDate - End date for export
 * @return {string} CSV data as string
 */
function exportTransactionsToCSV(startDate, endDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  
  // Format dates for comparison
  const startDateString = formatDateYMD(startDate);
  const endDateString = formatDateYMD(endDate);
  
  // Get all transactions and headers
  const data = transactionSheet.getDataRange().getValues();
  const headers = data[0];
  const dateColumnIndex = headers.indexOf('Date');
  
  // Filter transactions by date
  const filteredData = [headers];
  
  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][dateColumnIndex];
    if (!rowDate) continue;
    
    const rowDateString = formatDateYMD(rowDate);
    
    if (rowDateString >= startDateString && rowDateString <= endDateString) {
      filteredData.push(data[i]);
    }
  }
  
  // Convert to CSV
  const csvRows = [];
  
  for (const row of filteredData) {
    // Format dates in the row for CSV
    const formattedRow = row.map((cell, index) => {
      if (index === dateColumnIndex && cell instanceof Date) {
        return formatDateYMD(cell);
      }
      
      // Handle commas in strings
      if (typeof cell === 'string' && cell.includes(',')) {
        return `"${cell}"`;
      }
      
      return cell;
    });
    
    csvRows.push(formattedRow.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Creates a backup of the entire spreadsheet as a new file
 * @param {string} suffix - Optional suffix to add to the filename
 * @return {Object} Result with success flag and message
 */
function createBackup(suffix) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const today = new Date();
    const dateString = formatDateYMD(today);
    
    // Create filename
    const originalName = ss.getName();
    const backupName = `${originalName} - Backup ${dateString}${suffix ? ' ' + suffix : ''}`;
    
    // Create a copy in the same folder
    const file = DriveApp.getFileById(ss.getId());
    const folder = file.getParents().next();
    const backup = file.makeCopy(backupName, folder);
    
    return {
      success: true,
      message: `Backup created: ${backupName}`,
      backupId: backup.getId(),
      backupUrl: backup.getUrl()
    };
  } catch (error) {
    Logger.log(`Error creating backup: ${error}`);
    return {
      success: false,
      message: `Error creating backup: ${error.toString()}`
    };
  }
}

/**
 * Gets column letter for a column index
 * @param {number} columnIndex - 1-based column index
 * @return {string} Column letter(s)
 */
function getColumnLetter(columnIndex) {
  let temp, letter = '';
  
  while (columnIndex > 0) {
    temp = (columnIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    columnIndex = (columnIndex - temp - 1) / 26;
  }
  
  return letter;
}

/**
 * Gets column index for a column letter
 * @param {string} columnLetter - Column letter(s)
 * @return {number} 1-based column index
 */
function getColumnIndex(columnLetter) {
  columnLetter = columnLetter.toUpperCase();
  let sum = 0;
  
  for (let i = 0; i < columnLetter.length; i++) {
    sum = sum * 26;
    sum = sum + (columnLetter.charCodeAt(i) - 64);
  }
  
  return sum;
}

/**
 * Adds a QUERY formula to a cell that calculates from the transactions sheet
 * @param {Sheet} sheet - The sheet to add the formula to
 * @param {number} row - The row number (1-based)
 * @param {number} column - The column number (1-based)
 * @param {string} queryString - The query string to use
 */
function addQueryFormula(sheet, row, column, queryString) {
  const formula = `=QUERY(${SHEET_TRANSACTIONS}!$A$2:$Z, "${queryString}")`;
  sheet.getRange(row, column).setFormula(formula);
}

/**
 * Creates a pivot table from the transactions sheet
 * @param {Object} options - Pivot table options
 * @return {Range} Range containing the pivot table
 */
function createPivotTable(options) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(options.targetSheet);
  
  // Clear target range if specified
  if (options.clearRange) {
    targetSheet.getRange(options.targetRange).clear();
  }
  
  // Get source range
  const sourceSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
  const sourceRange = sourceSheet.getDataRange();
  
  // Create pivot table
  const pivotTableParams = {
    source: sourceRange,
    destination: targetSheet.getRange(options.targetRange)
  };
  
  const pivotTable = targetSheet.createPivotTable(pivotTableParams);
  
  // Add row groups
  if (options.rows) {
    options.rows.forEach(row => {
      pivotTable.addRowGroup(row);
    });
  }
  
  // Add column groups
  if (options.columns) {
    options.columns.forEach(column => {
      pivotTable.addColumnGroup(column);
    });
  }
  
  // Add values
  if (options.values) {
    options.values.forEach(value => {
      pivotTable.addPivotValue(
        value.field,
        value.summarizeFunction || SpreadsheetApp.PivotTableSummarizeFunction.SUM
      );
    });
  }
  
  // Add filters
  if (options.filters) {
    options.filters.forEach(filter => {
      const pivotFilter = pivotTable.addFilter(filter.field);
      
      if (filter.filterCriteria) {
        pivotFilter.setFilterCriteria(filter.filterCriteria);
      }
    });
  }
  
  return targetSheet.getRange(options.targetRange);
}

/**
 * Shows a simple alert message
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 */
function showAlert(title, message) {
  const ui = SpreadsheetApp.getUi();
  ui.alert(title, message, ui.ButtonSet.OK);
}

/**
 * Shows a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @return {boolean} True if user clicked "Yes", false otherwise
 */
function showConfirmation(title, message) {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(title, message, ui.ButtonSet.YES_NO);
  
  return response === ui.Button.YES;
}

/**
 * Shows a loading message in a lightweight dialog
 * @param {string} message - Message to display
 * @return {HtmlOutput} The HTML dialog
 */
function showLoading(message) {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 15px;
        text-align: center;
      }
      .loader {
        border: 8px solid #f3f3f3;
        border-radius: 50%;
        border-top: 8px solid #3498db;
        width: 60px;
        height: 60px;
        margin: 20px auto;
        animation: spin 2s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="loader"></div>
    <p>${message || 'Loading...'}</p>
  </body>
</html>`;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(300)
    .setHeight(200);
  
  SpreadsheetApp.getUi().showModelessDialog(htmlOutput, 'Loading');
  
  return htmlOutput;
}

/**
 * Creates a new sheet with basic formatting
 * @param {string} sheetName - Name of the new sheet
 * @param {Array} headers - Array of header titles
 * @param {boolean} activate - Whether to activate the new sheet
 * @return {Sheet} The new sheet
 */
function createFormattedSheet(sheetName, headers, activate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if sheet already exists
  let sheet = ss.getSheetByName(sheetName);
  
  if (sheet) {
    // Clear existing sheet
    sheet.clear();
  } else {
    // Create new sheet
    sheet = ss.insertSheet(sheetName);
  }
  
  // Add headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285F4')
    .setFontColor('white');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  // Activate sheet if requested
  if (activate) {
    sheet.activate();
  }
  
  return sheet;
}

/**
 * Gets today's date at midnight
 * @return {Date} Today at midnight
 */
function getTodayMidnight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Generates a unique ID with a specified prefix
 * @param {string} prefix - Prefix for the ID
 * @return {string} Unique ID
 */
function generateUniqueId(prefix) {
  const timestamp = new Date().getTime().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * Checks if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @return {boolean} True if same day
 */
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets the day of the week as a string
 * @param {Date} date - The date
 * @return {string} Day of the week
 */
function getDayOfWeek(date) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  
  return days[date.getDay()];
}

/**
 * Parses a CSV string into a 2D array
 * @param {string} csvString - CSV data as string
 * @param {boolean} hasHeader - Whether the CSV has a header row
 * @return {Array} 2D array of CSV data
 */
function parseCSV(csvString, hasHeader) {
  const rows = csvString.split('\n');
  const result = [];
  
  for (let i = hasHeader ? 1 : 0; i < rows.length; i++) {
    // Skip empty rows
    if (rows[i].trim() === '') continue;
    
    // Handle quoted fields with commas
    const row = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let j = 0; j < rows[i].length; j++) {
      const char = rows[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add the last field
    row.push(currentField);
    
    result.push(row);
  }
  
  return result;
}

/**
 * Converts a 2D array to CSV
 * @param {Array} data - 2D array of data
 * @return {string} CSV data as string
 */
function convertToCSV(data) {
  const csvRows = [];
  
  for (const row of data) {
    const csvRow = row.map(cell => {
      // Handle strings with commas
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    
    csvRows.push(csvRow.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Handles errors and logs them
 * @param {Error} error - The error object
 * @param {string} source - Source of the error
 * @param {boolean} showAlert - Whether to show an alert
 */
function handleError(error, source, showAlert) {
  const errorMessage = `Error in ${source}: ${error.toString()}`;
  Logger.log(errorMessage);
  
  if (error.stack) {
    Logger.log(`Stack trace: ${error.stack}`);
  }
  
  if (showAlert) {
    SpreadsheetApp.getUi().alert('Error', errorMessage, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Adds a timestamp to a string
 * @param {string} text - The text to add a timestamp to
 * @return {string} Text with timestamp
 */
function addTimestamp(text) {
  const now = new Date();
  const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  
  return `[${timestamp}] ${text}`;
}

/**
 * Gets the week number for a date
 * @param {Date} date - The date
 * @return {number} Week number (1-53)
 */
function getWeekNumber(date) {
  // Clone date to avoid modifying the original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday: current date + 4 - current day number
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate week number: Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  
  return weekNumber;
}

/**
 * Gets the month name for a date
 * @param {Date} date - The date
 * @return {string} Month name
 */
function getMonthName(date) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  
  return months[date.getMonth()];
}

/**
 * Gets the last day of a month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @return {number} Last day of the month
 */
function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Gets the quarter for a date
 * @param {Date} date - The date
 * @return {number} Quarter (1-4)
 */
function getQuarter(date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Gets the ISO week date (YYYY-Www) for a date
 * @param {Date} date - The date
 * @return {string} ISO week date
 */
function getISOWeekDate(date) {
  // Clone date to avoid modifying the original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday: current date + 4 - current day number
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  
  // Get year
  const year = d.getUTCFullYear();
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(year, 0, 1));
  
  // Calculate week number: Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  
  // Format: YYYY-Www
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
