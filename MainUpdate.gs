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
  
  // Create progress indicator files
  createProgressIndicatorFiles();
  
  ui.alert('Setup Complete', 'The Forex Transaction System has been set up successfully.', ui.ButtonSet.OK);
}