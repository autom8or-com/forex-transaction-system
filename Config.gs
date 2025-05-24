/**
 * Forex Transaction System - Configuration
 * 
 * Handles system configuration including:
 * - Loading settings from Config sheet
 * - Saving settings to Config sheet
 * - Default values
 * - User preferences
 */

/**
 * Default system configuration values
 */
const DEFAULT_CONFIG = {
  transactionIdPrefix: 'TX-',
  defaultCurrency: 'USD',
  staffNames: 'Femi,Taiye',
  autoUpdateInventory: 'TRUE',
  reportEmail: '',
  reportFrequency: 'daily',
  transactionTypes: 'Buy,Sell,Swap',
  currencies: 'USD,GBP,EUR,NAIRA',
  logLevel: 'INFO'
};

/**
 * Gets all configuration settings from the Config sheet
 * @return {Object} Configuration settings
 */
function getAllConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(SHEET_CONFIG);
    
    if (!configSheet) {
      Logger.log('Config sheet not found. Using default values.');
      return DEFAULT_CONFIG;
    }
    
    const configData = configSheet.getDataRange().getValues();
    const config = {};
    
    // Skip header row
    for (let i = 1; i < configData.length; i++) {
      const setting = configData[i][0];
      const value = configData[i][1];
      
      if (setting) {
        config[FOREX.Utils.camelCase(setting)] = value;
      }
    }
    
    // Fill in any missing settings with defaults
    for (const key in DEFAULT_CONFIG) {
      if (!config[key]) {
        config[key] = DEFAULT_CONFIG[key];
      }
    }
    
    return config;
  } catch (error) {
    Logger.log(`Error getting config: ${error}`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Gets a specific configuration setting
 * @param {string} key - Setting key
 * @param {any} defaultValue - Default value if not found
 * @return {any} Setting value
 */
function getConfig(key, defaultValue) {
  const config = getAllConfig();
  return config[key] !== undefined ? config[key] : defaultValue;
}

/**
 * Updates a configuration setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @return {boolean} Success flag
 */
function updateConfig(key, value) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName(SHEET_CONFIG);
    
    // Create Config sheet if it doesn't exist
    if (!configSheet) {
      configSheet = createConfigSheet();
    }
    
    // Find the setting row
    const configData = configSheet.getDataRange().getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < configData.length; i++) {
      const setting = configData[i][0];
      
      if (setting === unCamelCase(key)) {
        rowIndex = i + 1; // +1 because array is 0-based but sheet is 1-based
        break;
      }
    }
    
    // Update or add the setting
    if (rowIndex > 0) {
      configSheet.getRange(rowIndex, 2).setValue(value);
    } else {
      configSheet.appendRow([unCamelCase(key), value, '']);
    }
    
    return true;
  } catch (error) {
    Logger.log(`Error updating config: ${error}`);
    return false;
  }
}

/**
 * Updates multiple configuration settings
 * @param {Object} settings - Key-value pairs of settings
 * @return {boolean} Success flag
 */
function updateMultipleConfig(settings) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName(SHEET_CONFIG);
    
    // Create Config sheet if it doesn't exist
    if (!configSheet) {
      configSheet = createConfigSheet();
    }
    
    // Get current config
    const configData = configSheet.getDataRange().getValues();
    const updates = [];
    const additions = [];
    
    // Process each setting
    for (const key in settings) {
      const value = settings[key];
      const settingName = unCamelCase(key);
      let found = false;
      
      // Look for existing setting
      for (let i = 1; i < configData.length; i++) {
        if (configData[i][0] === settingName) {
          updates.push({
            row: i + 1, // +1 because array is 0-based but sheet is 1-based
            value: value
          });
          found = true;
          break;
        }
      }
      
      // Add new setting if not found
      if (!found) {
        additions.push([settingName, value, '']);
      }
    }
    
    // Apply updates
    for (const update of updates) {
      configSheet.getRange(update.row, 2).setValue(update.value);
    }
    
    // Add new settings
    if (additions.length > 0) {
      const lastRow = configSheet.getLastRow();
      configSheet.getRange(lastRow + 1, 1, additions.length, 3).setValues(additions);
    }
    
    return true;
  } catch (error) {
    Logger.log(`Error updating multiple config: ${error}`);
    return false;
  }
}

/**
 * Creates the Config sheet with default settings
 * @return {Sheet} The Config sheet
 */
function createConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheet
  const configSheet = ss.insertSheet(SHEET_CONFIG);
  
  // Set up headers
  const headers = ['Setting', 'Value', 'Description'];
  configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  // Add default settings
  const defaultSettings = [];
  
  for (const key in DEFAULT_CONFIG) {
    defaultSettings.push([unCamelCase(key), DEFAULT_CONFIG[key], getSettingDescription(key)]);
  }
  
  configSheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
  
  // Format sheet
  configSheet.autoResizeColumns(1, 3);
  
  // Protect the sheet with warning
  const protection = configSheet.protect().setDescription('Config Protection');
  protection.setWarningOnly(true);
  
  return configSheet;
}

/**
 * Gets the description for a setting
 * @param {string} key - Setting key
 * @return {string} Setting description
 */
function getSettingDescription(key) {
  const descriptions = {
    transactionIdPrefix: 'Prefix for transaction IDs',
    defaultCurrency: 'Default currency for new transactions',
    staffNames: 'Comma-separated list of staff names',
    autoUpdateInventory: 'Automatically update inventory on new transactions',
    reportEmail: 'Email to send reports to',
    reportFrequency: 'Frequency for automated reports (daily, weekly, monthly)',
    transactionTypes: 'Available transaction types',
    currencies: 'Available currencies',
    logLevel: 'Logging level (DEBUG, INFO, WARN, ERROR)'
  };
  
  return descriptions[key] || '';
}

/**
 * Resets all configuration settings to defaults
 * @return {boolean} Success flag
 */
function resetConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let configSheet = ss.getSheetByName(SHEET_CONFIG);
    
    // Create or clear Config sheet
    if (configSheet) {
      configSheet.clear();
    } else {
      configSheet = ss.insertSheet(SHEET_CONFIG);
    }
    
    // Set up headers
    const headers = ['Setting', 'Value', 'Description'];
    configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    
    // Add default settings
    const defaultSettings = [];
    
    for (const key in DEFAULT_CONFIG) {
      defaultSettings.push([unCamelCase(key), DEFAULT_CONFIG[key], getSettingDescription(key)]);
    }
    
    configSheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
    
    // Format sheet
    configSheet.autoResizeColumns(1, 3);
    
    return true;
  } catch (error) {
    Logger.log(`Error resetting config: ${error}`);
    return false;
  }
}

/**
 * Converts camelCase to Title Case With Spaces
 * @param {string} str - camelCase string
 * @return {string} Title Case With Spaces
 */
function unCamelCase(str) {
  // Insert space before capital letters, then capitalize first letter
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, function(str) { return str.toUpperCase(); })
    .trim();
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
 * Gets all staff names as an array
 * @return {Array} Staff names
 */
function getAllStaff() {
  const staffNames = getConfig('staffNames', DEFAULT_CONFIG.staffNames);
  return staffNames.split(',').map(name => name.trim());
}

/**
 * Gets all currencies as an array
 * @return {Array} Currencies
 */
function getAllCurrencies() {
  const currencies = getConfig('currencies', DEFAULT_CONFIG.currencies);
  return currencies.split(',').map(currency => currency.trim());
}

/**
 * Gets all transaction types as an array
 * @return {Array} Transaction types
 */
function getAllTransactionTypes() {
  const types = getConfig('transactionTypes', DEFAULT_CONFIG.transactionTypes);
  return types.split(',').map(type => type.trim());
}

/**
 * Sets up the system configuration through a user interface
 */
function showConfigUI() {
  const htmlTemplate = HtmlService.createTemplate(getConfigHtml());
  
  // Get current config
  const config = getAllConfig();
  htmlTemplate.config = config;
  
  // Generate HTML
  const html = htmlTemplate.evaluate()
    .setWidth(600)
    .setHeight(500)
    .setTitle('System Configuration');
  
  // Show dialog
  SpreadsheetApp.getUi().showModalDialog(html, 'System Configuration');
}

/**
 * Gets the HTML for the configuration UI
 * @return {string} HTML content
 */
function getConfigHtml() {
  return `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 15px;
        font-size: 14px;
      }
      h1 {
        font-size: 20px;
        margin-bottom: 15px;
        color: #3c4043;
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
      input[type="email"], 
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
      button.reset {
        background-color: #ea4335;
        float: left;
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
    <h1>System Configuration</h1>
    
    <div id="message" style="display:none;"></div>
    
    <form id="configForm">
      <div class="form-group">
        <label for="transactionIdPrefix">Transaction ID Prefix</label>
        <input type="text" id="transactionIdPrefix" name="transactionIdPrefix" value="<?= config.transactionIdPrefix || 'TX-' ?>">
      </div>
      
      <div class="form-group">
        <label for="defaultCurrency">Default Currency</label>
        <input type="text" id="defaultCurrency" name="defaultCurrency" value="<?= config.defaultCurrency || 'USD' ?>">
      </div>
      
      <div class="form-group">
        <label for="staffNames">Staff Names (comma-separated)</label>
        <input type="text" id="staffNames" name="staffNames" value="<?= config.staffNames || 'Femi,Taiye' ?>">
      </div>
      
      <div class="form-group">
        <label for="currencies">Currencies (comma-separated)</label>
        <input type="text" id="currencies" name="currencies" value="<?= config.currencies || 'USD,GBP,EUR,NAIRA' ?>">
      </div>
      
      <div class="form-group">
        <label for="transactionTypes">Transaction Types (comma-separated)</label>
        <input type="text" id="transactionTypes" name="transactionTypes" value="<?= config.transactionTypes || 'Buy,Sell,Swap' ?>">
      </div>
      
      <div class="form-group">
        <label for="autoUpdateInventory">Auto Update Inventory</label>
        <select id="autoUpdateInventory" name="autoUpdateInventory">
          <option value="TRUE" <?= config.autoUpdateInventory === 'TRUE' ? 'selected' : '' ?>>Yes</option>
          <option value="FALSE" <?= config.autoUpdateInventory === 'FALSE' ? 'selected' : '' ?>>No</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="reportEmail">Report Email</label>
        <input type="email" id="reportEmail" name="reportEmail" value="<?= config.reportEmail || '' ?>">
      </div>
      
      <div class="form-group">
        <label for="reportFrequency">Report Frequency</label>
        <select id="reportFrequency" name="reportFrequency">
          <option value="daily" <?= config.reportFrequency === 'daily' ? 'selected' : '' ?>>Daily</option>
          <option value="weekly" <?= config.reportFrequency === 'weekly' ? 'selected' : '' ?>>Weekly</option>
          <option value="monthly" <?= config.reportFrequency === 'monthly' ? 'selected' : '' ?>>Monthly</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="logLevel">Log Level</label>
        <select id="logLevel" name="logLevel">
          <option value="DEBUG" <?= config.logLevel === 'DEBUG' ? 'selected' : '' ?>>Debug</option>
          <option value="INFO" <?= config.logLevel === 'INFO' ? 'selected' : '' ?>>Info</option>
          <option value="WARN" <?= config.logLevel === 'WARN' ? 'selected' : '' ?>>Warning</option>
          <option value="ERROR" <?= config.logLevel === 'ERROR' ? 'selected' : '' ?>>Error</option>
        </select>
      </div>
      
      <div class="button-group">
        <button type="button" class="reset" onclick="resetConfig()">Reset to Defaults</button>
        <button type="button" class="cancel" onclick="google.script.host.close()">Cancel</button>
        <button type="submit">Save Configuration</button>
      </div>
    </form>
    
    <script>
      // Form submission handler
      document.getElementById('configForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
          transactionIdPrefix: document.getElementById('transactionIdPrefix').value,
          defaultCurrency: document.getElementById('defaultCurrency').value,
          staffNames: document.getElementById('staffNames').value,
          currencies: document.getElementById('currencies').value,
          transactionTypes: document.getElementById('transactionTypes').value,
          autoUpdateInventory: document.getElementById('autoUpdateInventory').value,
          reportEmail: document.getElementById('reportEmail').value,
          reportFrequency: document.getElementById('reportFrequency').value,
          logLevel: document.getElementById('logLevel').value
        };
        
        // Send data to server
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onFailure)
          .saveConfig(formData);
      });
      
      // Reset configuration handler
      function resetConfig() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
          google.script.run
            .withSuccessHandler(function(result) {
              if (result.success) {
                window.location.reload();
              } else {
                onFailure(result);
              }
            })
            .withFailureHandler(onFailure)
            .resetAllConfig();
        }
      }
      
      // Success handler
      function onSuccess(result) {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = result.message;
        messageDiv.className = 'success';
        messageDiv.style.display = 'block';
        
        // Close dialog after delay
        setTimeout(function() {
          google.script.host.close();
        }, 2000);
      }
      
      // Failure handler
      function onFailure(error) {
        const messageDiv = document.getElementById('message');
        messageDiv.innerHTML = typeof error === 'string' ? error : error.message || 'An error occurred';
        messageDiv.className = 'error';
        messageDiv.style.display = 'block';
      }
    </script>
  </body>
</html>`;
}

/**
 * Saves configuration from the UI
 * @param {Object} formData - Form data
 * @return {Object} Result with status and message
 */
function saveConfig(formData) {
  try {
    // Update all settings
    updateMultipleConfig(formData);
    
    return {
      success: true,
      message: 'Configuration saved successfully'
    };
  } catch (error) {
    Logger.log(`Error saving config: ${error}`);
    return {
      success: false,
      message: `Error saving configuration: ${error.toString()}`
    };
  }
}

/**
 * Resets all configuration to defaults and returns result
 * @return {Object} Result with status and message
 */
function resetAllConfig() {
  const success = resetConfig();
  
  return {
    success: success,
    message: success ? 'Configuration reset to defaults' : 'Error resetting configuration'
  };
}

/**
 * Gets user preferences for the script
 * @return {Object} User preferences
 */
function getUserPreferences() {
  const scriptProperties = PropertiesService.getUserProperties();
  const prefsJson = scriptProperties.getProperty('userPreferences');
  
  if (prefsJson) {
    try {
      return JSON.parse(prefsJson);
    } catch (e) {
      Logger.log(`Error parsing user preferences: ${e}`);
    }
  }
  
  return {};
}

/**
 * Saves user preferences
 * @param {Object} preferences - User preferences
 */
function saveUserPreferences(preferences) {
  const scriptProperties = PropertiesService.getUserProperties();
  scriptProperties.setProperty('userPreferences', JSON.stringify(preferences));
}

/**
 * Gets a specific user preference
 * @param {string} key - Preference key
 * @param {any} defaultValue - Default value if not found
 * @return {any} Preference value
 */
function getUserPreference(key, defaultValue) {
  const prefs = getUserPreferences();
  return prefs[key] !== undefined ? prefs[key] : defaultValue;
}

/**
 * Sets a specific user preference
 * @param {string} key - Preference key
 * @param {any} value - Preference value
 */
function setUserPreference(key, value) {
  const prefs = getUserPreferences();
  prefs[key] = value;
  saveUserPreferences(prefs);
}
