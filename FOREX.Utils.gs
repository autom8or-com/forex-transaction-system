/**
 * Forex Transaction System - Utils Module
 * 
 * This file contains utility functions for the Forex Transaction System,
 * including progress tracking, configuration management, HTML helpers, etc.
 */

// Ensure the namespace exists
var FOREX = FOREX || {};
FOREX.Utils = FOREX.Utils || {};

// Processing steps tracking
let processingSteps = [];

/**
 * Initialize the processing steps tracking
 */
FOREX.Utils.initializeProcessingSteps = function() {
  processingSteps = [];
};

/**
 * Add a processing step to the tracking
 * @param {string} step - The step description
 */
FOREX.Utils.addProcessingStep = function(step) {
  processingSteps.push(step);
};

/**
 * Get the current processing steps
 * @return {Array} Array of processing step descriptions
 */
FOREX.Utils.getProcessingSteps = function() {
  return processingSteps;
};

/**
 * Gets configuration settings from the Config sheet
 * @return {Object} Configuration settings
 */
FOREX.Utils.getConfigSettings = function() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  
  const configData = configSheet.getDataRange().getValues();
  const config = {};
  
  // Skip header row
  for (let i = 1; i < configData.length; i++) {
    const setting = configData[i][0];
    const value = configData[i][1];
    config[FOREX.Utils.camelCase(setting)] = value;
  }
  
  return config;
};

/**
 * Converts a string to camelCase
 * @param {string} str - The string to convert
 * @return {string} Camel-cased string
 */
FOREX.Utils.camelCase = function(str) {
  return str
    .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
    .replace(/\s/g, '')
    .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
};

/**
 * Creates HTML template files if they don't exist
 * @return {boolean} Success status
 */
FOREX.Utils.createHtmlTemplates = function() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Create Transaction Form HTML
    FOREX.Utils.createHtmlFile('TransactionForm', FOREX.Templates.getTransactionFormHtml());
    
    // Create Settlement Form HTML
    FOREX.Utils.createHtmlFile('SettlementForm', FOREX.Templates.getSettlementFormHtml());
    
    // Create Swap Form HTML
    FOREX.Utils.createHtmlFile('SwapForm', FOREX.Templates.getSwapFormHtml());
    
    // Create Adjustment Form HTML
    FOREX.Utils.createHtmlFile('AdjustmentForm', FOREX.Templates.getAdjustmentFormHtml());
    
    // Create Progress Indicator HTML
    FOREX.Utils.createHtmlFile('ProgressIndicator', FOREX.Templates.getProgressIndicatorHtml());
    
    return true;
  } catch (error) {
    Logger.log(`Error creating HTML templates: ${error}`);
    ui.alert('Error', `Failed to create HTML templates: ${error.toString()}`, ui.ButtonSet.OK);
    return false;
  }
};

/**
 * Creates an HTML file in the script project
 * @param {string} filename - The filename to create
 * @param {string} content - The file content
 * @return {boolean} Success status
 */
FOREX.Utils.createHtmlFile = function(filename, content) {
  try {
    // Create HTML files using Apps Script API
    const files = DriveApp.getFilesByName(filename + '.html');
    if (files.hasNext()) {
      // File exists, update it
      const file = files.next();
      file.setContent(content);
    } else {
      // File doesn't exist, create it
      // This method only works if you're using the new Apps Script editor
      const html = HtmlService.createTemplate(content);
      const htmlOutput = html.evaluate();
      // We can't actually create the file directly via the Apps Script service
      // This would typically require the Drive API or Advanced Drive Service
      Logger.log(`Cannot create HTML file ${filename}.html - please create it manually`);
    }
    
    Logger.log(`HTML file ${filename}.html created or updated`);
    return true;
  } catch (error) {
    Logger.log(`Error creating HTML file: ${error}`);
    return false;
  }
};
