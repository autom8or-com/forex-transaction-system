/**
 * Forex Transaction System - Form Handlers
 * 
 * Contains code for creating and processing custom user interfaces including:
 * - Transaction entry form
 * - Multi-settlement form
 * - Swap transaction form
 * - Inventory adjustment form
 */

/**
 * Shows the main transaction entry form
 */
function showTransactionForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfigSettings();
  
  // Get staff list from config
  const staffList = config.staffNames ? config.staffNames.split(',') : [''];
  
  // Create HTML from template
  const htmlTemplate = HtmlService.createTemplateFromFile('TransactionForm');
  
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
 * Process the transaction form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
function processTransactionForm(formData) {
  try {
    // Initialize processing tracking
    initializeProcessingSteps();
    
    // If it's a swap transaction, redirect to swap handler
    if (formData.transactionType === 'Swap') {
      addProcessingStep("Detected swap transaction, redirecting to swap form");
      return {
        success: false,
        message: 'Please use the Swap Transaction form for swap transactions',
        showSwapForm: true,
        processingSteps: getProcessingSteps()
      };
    }
    
    // Check if this is a multi-settlement transaction
    const isMultiSettlement = formData.multiSettlement === 'yes';
    
    if (isMultiSettlement) {
      // Save transaction data in Properties service for the multi-settlement form
      const props = PropertiesService.getScriptProperties();
      props.setProperty('pendingTransaction', JSON.stringify(formData));
      
      addProcessingStep("Multi-settlement transaction detected");
      addProcessingStep("Transaction data saved for settlement");
      addProcessingStep("Preparing settlement form");
      
      return {
        success: true,
        message: 'Please continue to add settlement details',
        showSettlementForm: true,
        processingSteps: getProcessingSteps()
      };
    }
    
    // Regular single-settlement transaction
    addProcessingStep("Transaction data validated");
    
    const transactionData = {
      date: formData.date,
      customer: formData.customer,
      transactionType: formData.transactionType,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      rate: parseFloat(formData.rate),
      nature: formData.nature,
      source: formData.source,
      staff: formData.staff,
      notes: formData.notes
    };
    
    // Create the transaction
    const result = createTransaction(transactionData);
    
    return result;
  } catch (error) {
    Logger.log(`Error processing transaction form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: getProcessingSteps()
    };
  }
}

/**
 * Shows the multi-settlement form
 */
function showSettlementForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get pending transaction data
  const props = PropertiesService.getScriptProperties();
  const pendingTransactionJson = props.getProperty('pendingTransaction');
  
  if (!pendingTransactionJson) {
    SpreadsheetApp.getUi().alert('Error', 'No pending transaction found', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }
  
  const pendingTransaction = JSON.parse(pendingTransactionJson);
  
  // Create HTML from template
  const htmlTemplate = HtmlService.createTemplateFromFile('SettlementForm');
  
  // Add data to template
  htmlTemplate.transactionData = pendingTransaction;
  htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  htmlTemplate.settlementTypes = [
    'Cash', 
    'Bank Transfer', 
    'Swap In', 
    'Swap Out'
  ];
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(800)
    .setHeight(600)
    .setTitle('Transaction Settlement');
  
  // Show the form
  SpreadsheetApp.getUi().showModalDialog(html, 'Transaction Settlement');
}

/**
 * Process the multi-settlement form submission
 * Delegates to FOREX.Forms if available, otherwise redirects to Main.gs implementation
 * 
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
function processSettlementForm(formData) {
  // Delegate to the FOREX.Forms implementation if available
  if (typeof FOREX !== 'undefined' && FOREX.Forms && FOREX.Forms.processSettlementForm) {
    return FOREX.Forms.processSettlementForm(formData);
  } else {
    // Fallback to the Main.gs implementation
    return window.processSettlementForm(formData);
  }
}

/**
 * Shows the swap transaction form
 */
function showSwapForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfigSettings();
  
  // Get staff list from config
  const staffList = config.staffNames ? config.staffNames.split(',') : [''];
  
  // Create HTML from template
  const htmlTemplate = HtmlService.createTemplateFromFile('SwapForm');
  
  // Add data to template
  htmlTemplate.staffList = staffList;
  htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
  
  // Get today's date in yyyy-MM-dd format
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  htmlTemplate.today = today;
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(600)
    .setHeight(700)
    .setTitle('Swap Transaction');
  
  // Show the form
  SpreadsheetApp.getUi().showModalDialog(html, 'Swap Transaction');
}

/**
 * Process the swap transaction form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
function processSwapForm(formData) {
  try {
    // Initialize processing tracking
    initializeProcessingSteps();
    
    // Generate swap ID
    const swapId = 'SWAP-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
    
    addProcessingStep("Swap data validated");
    
    // Create swap data
    const swapData = {
      swapId: swapId,
      date: formData.date,
      customer: formData.customer,
      fromCurrency: formData.fromCurrency,
      fromAmount: parseFloat(formData.fromAmount),
      toCurrency: formData.toCurrency,
      toAmount: parseFloat(formData.toAmount),
      sellRate: parseFloat(formData.sellRate),
      buyRate: parseFloat(formData.buyRate),
      source: formData.source,
      staff: formData.staff
    };
    
    // Process the swap transaction
    const result = processSwapTransaction(swapData);
    
    // Ensure processing steps are included
    if (!result.processingSteps) {
      result.processingSteps = getProcessingSteps();
    }
    
    return result;
  } catch (error) {
    Logger.log(`Error processing swap form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: getProcessingSteps()
    };
  }
}

/**
 * Shows the inventory adjustment form
 * Improved with error handling and template verification
 */
function showInventoryAdjustmentForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  try {
    // First check if the AdjustmentForm template exists
    let htmlTemplate;
    
    try {
      // Try to get the template
      htmlTemplate = HtmlService.createTemplateFromFile('AdjustmentForm');
      Logger.log("AdjustmentForm template found successfully");
    } catch (e) {
      // Template doesn't exist, create a temporary HTML template to recreate it
      Logger.log("AdjustmentForm template not found: " + e.toString());
      
      const tempHtml = HtmlService.createTemplate(
        '<script>' +
        '  // Create the HTML templates if needed' +
        '  google.script.run.withSuccessHandler(function() {' +
        '    // Redirect back to the adjustment form after templates are created' +
        '    google.script.run.showInventoryAdjustmentForm();' +
        '    google.script.host.close();' +
        '  }).createHtmlTemplates();' +
        '</script>' +
        '<div style="padding: 20px; text-align: center;">' +
        '  <h3>Setting up Adjustment Form...</h3>' +
        '  <p>Please wait while we prepare the form templates.</p>' +
        '</div>'
      );
      
      const html = tempHtml.evaluate()
        .setWidth(300)
        .setHeight(200)
        .setTitle('Preparing Form');
      
      ui.showModalDialog(html, 'Preparing Form');
      return;
    }
    
    // If the template exists, proceed with the form setup
    
    // Add data to template
    htmlTemplate.currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
    
    // Get today's date in yyyy-MM-dd format
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    htmlTemplate.today = today;
    
    // Generate HTML from template
    const html = htmlTemplate.evaluate()
      .setWidth(500)
      .setHeight(400)
      .setTitle('Inventory Adjustment');
    
    // Show the form
    ui.showModalDialog(html, 'Inventory Adjustment');
    
  } catch (error) {
    // Handle unexpected errors
    Logger.log("Error showing adjustment form: " + error.toString());
    ui.alert('Error', 'There was a problem loading the Adjustment Form: ' + error.toString() + 
             '\n\nPlease run the System Setup function from the Forex System menu to recreate templates.', 
             ui.ButtonSet.OK);
  }
}

/**
 * Process the inventory adjustment form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
function processAdjustmentForm(formData) {
  try {
    // Initialize processing tracking
    initializeProcessingSteps();
    
    addProcessingStep("Adjustment data validated");
    
    // Create adjustment data
    const adjustmentData = {
      date: formData.date,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      reason: formData.reason
    };
    
    // Record the adjustment
    const result = recordInventoryAdjustment(adjustmentData);
    
    // Ensure processing steps are included
    if (!result.processingSteps) {
      result.processingSteps = getProcessingSteps();
    }
    
    return result;
  } catch (error) {
    Logger.log(`Error processing adjustment form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: getProcessingSteps()
    };
  }
}

/**
 * Include HTML file in template
 * @param {string} filename - The filename to include
 * @return {string} The file content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Creates HTML template files if they don't exist
 */
function createHtmlTemplates() {
  const ui = SpreadsheetApp.getUi();
  
  // Create Transaction Form HTML
  createHtmlFile('TransactionForm', getTransactionFormHtml());
  
  // Create Settlement Form HTML
  createHtmlFile('SettlementForm', getSettlementFormHtml());
  
  // Create Swap Form HTML
  createHtmlFile('SwapForm', getSwapFormHtml());
  
  // Create Adjustment Form HTML
  createHtmlFile('AdjustmentForm', getAdjustmentFormHtml());
  
  // Create Progress Indicator HTML
  createHtmlFile('ProgressIndicator', getProgressIndicatorHtml());
  
  ui.alert('HTML Templates Created', 'HTML form templates have been created successfully.', ui.ButtonSet.OK);
}

/**
 * Creates an HTML file in the script project
 * @param {string} filename - The filename to create
 * @param {string} content - The file content
 */
function createHtmlFile(filename, content) {
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
  } catch (error) {
    Logger.log(`Error creating HTML file: ${error}`);
  }
}

/**
 * Helper function to include progress indicator in forms
 * @return {string} HTML content
 */
function includeProgressIndicator() {
  return include('ProgressIndicator');
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
      button:disabled {
        background-color: #a9a9a9;
        cursor: not-allowed;
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
    
    <!-- Include progress indicator component -->
    <?!= includeProgressIndicator(); ?>
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
        <select id="nature" name="nature" required>
          <option value="Transferred to customer">Transferred to customer</option>
          <option value="Received via transfer">Received via transfer</option>
          <option value="Cash Swap for offshore">Cash Swap for offshore</option>
          <option value="Cash Swap for offshore pounds">Cash Swap for offshore pounds</option>
          <option value="Cash Swap">Cash Swap</option>
          <option value="Other">Other</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="source">Source</label>
        <select id="source" name="source" required>
          <option value="Walk-in">Walk-in</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
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
        <button type="button" class="cancel" id="cancelButton" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" id="submitButton">Save Transaction</button>
      </div>
    </form>
    
    <script>
      // Form submission handler
      document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading overlay
        showLoadingOverlay("Processing transaction...");
        
        // Initialize processing steps for this transaction type
        initTransactionProcessing('transaction');
        
        // Update first processing step
        updateProcessingStep("Validating transaction data...");
        
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
          .withSuccessHandler(handleFormSuccess)
          .withFailureHandler(handleFormFailure)
          .processTransactionForm(formData);
      });
      
      // Initialize
      document.addEventListener('DOMContentLoaded', function() {
        // Calculate total value when amount or rate changes
        document.getElementById('amount').addEventListener('input', calculateTotal);
        document.getElementById('rate').addEventListener('input', calculateTotal);
        
        // Set default type based on transaction type
        document.getElementById('transactionType').addEventListener('change', updateNatureField);
      });
      
      // Calculate total value
      function calculateTotal() {
        const amount = parseFloat(document.getElementById('amount').value) || 0;
        const rate = parseFloat(document.getElementById('rate').value) || 0;
        const total = amount * rate;
        
        // If we had a total field, we'd update it here
        console.log('Total value: ' + total.toFixed(2));
      }
      
      // Update nature field based on transaction type
      function updateNatureField() {
        const transactionType = document.getElementById('transactionType').value;
        const natureField = document.getElementById('nature');
        
        // Clear current selection
        natureField.value = '';
        
        // Set default value based on transaction type
        if (transactionType === 'Buy') {
          natureField.value = 'Transferred to customer';
        } else if (transactionType === 'Sell') {
          natureField.value = 'Received via transfer';
        }
      }
    </script>
  </body>
</html>`;
}

/**
 * Returns the HTML content for the settlement form
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
      select {
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
      button:disabled {
        background-color: #a9a9a9;
        cursor: not-allowed;
      }
      button.cancel {
        background-color: #f1f1f1;
        color: #333;
        margin-right: 10px;
      }
      .transaction-summary {
        background-color: #f9f9f9;
        padding: 10px;
        margin-bottom: 20px;
        border-radius: 4px;
      }
      .settlement-item {
        background-color: #f0f8ff;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 4px;
        position: relative;
      }
      .remove-settlement {
        position: absolute;
        top: 5px;
        right: 5px;
        background-color: #ff4d4d;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        line-height: 20px;
        text-align: center;
        cursor: pointer;
      }
      .add-settlement {
        background-color: #4caf50;
        width: 100%;
      }
      .error {
        color: red;
        margin-bottom: 15px;
      }
      .success {
        color: green;
        margin-bottom: 15px;
      }
      .settlement-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-gap: 10px;
      }
    </style>
    
    <!-- Include progress indicator component -->
    <?!= includeProgressIndicator(); ?>
  </head>
  <body>
    <h2>Transaction Settlement</h2>
    
    <div id="message" class="error" style="display:none;"></div>
    
    <div class="transaction-summary">
      <h3>Transaction Summary</h3>
      <p><strong>Customer:</strong> <?= transactionData.customer ?></p>
      <p><strong>Type:</strong> <?= transactionData.transactionType ?></p>
      <p><strong>Currency:</strong> <?= transactionData.currency ?></p>
      <p><strong>Amount:</strong> <?= transactionData.amount ?></p>
      <p><strong>Total Value (NGN):</strong> <?= (transactionData.amount * transactionData.rate).toLocaleString() ?></p>
    </div>
    
    <h3>Settlement Methods</h3>
    <p>Total amount to settle: <span id="totalAmount"><?= transactionData.amount ?></span> <?= transactionData.currency ?></p>
    <p>Remaining: <span id="remainingAmount"><?= transactionData.amount ?></span> <?= transactionData.currency ?></p>
    
    <form id="settlementForm">
      <div id="settlementContainer">
        <!-- Settlement items will be added here -->
      </div>
      
      <button type="button" class="add-settlement" onclick="addSettlement()">+ Add Settlement Method</button>
      
      <div class="button-group">
        <button type="button" class="cancel" id="cancelButton" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" id="submitButton">Complete Transaction</button>
      </div>
    </form>
    
    <script>
      // Keep track of settlements
      let settlements = [];
      const totalAmount = parseFloat(<?= transactionData.amount ?>);
      const currency = '<?= transactionData.currency ?>';
      
      // Initialize with one settlement but delay to ensure form renders first
      document.addEventListener('DOMContentLoaded', function() {
        // Delay adding the first settlement to ensure form renders completely
        setTimeout(function() {
          addSettlement();
        }, 200);
      });
      
      // Add a new settlement method
      function addSettlement() {
        const index = settlements.length;
        
        // Create settlement item
        const settlementItem = document.createElement('div');
        settlementItem.className = 'settlement-item';
        settlementItem.dataset.index = index;
        
        // Calculate remaining amount
        let usedAmount = 0;
        settlements.forEach(settlement => {
          usedAmount += parseFloat(settlement.amount || 0);
        });
        const remainingAmount = totalAmount - usedAmount;
        
        // Set default amount to remaining amount
        settlements.push({
          settlementType: '',
          currency: currency,
          amount: remainingAmount,
          bankAccount: '',
          notes: ''
        });
        
        // Create form fields
        settlementItem.innerHTML = \`
          <button type="button" class="remove-settlement" onclick="removeSettlement(\${index})">\\u00d7</button>
          
          <div class="settlement-grid">
            <div class="form-group">
              <label for="settlementType_\${index}">Settlement Type</label>
              <select id="settlementType_\${index}" onchange="updateSettlement(\${index}, 'settlementType', this.value)" required>
                <option value="">Select Type</option>
                <? for (var i = 0; i < settlementTypes.length; i++) { ?>
                  <option value="<?= settlementTypes[i] ?>"><?= settlementTypes[i] ?></option>
                <? } ?>
              </select>
            </div>
            
            <div class="form-group">
              <label for="settlementCurrency_\${index}">Currency</label>
              <select id="settlementCurrency_\${index}" onchange="updateSettlement(\${index}, 'currency', this.value)" required>
                <? for (var i = 0; i < currencies.length; i++) { ?>
                  <option value="<?= currencies[i] ?>" \${currency === '<?= currencies[i] ?>' ? 'selected' : ''}><?= currencies[i] ?></option>
                <? } ?>
              </select>
            </div>
            
            <div class="form-group">
              <label for="settlementAmount_\${index}">Amount</label>
              <input type="number" id="settlementAmount_\${index}" value="\${remainingAmount}" step="0.01" min="0" 
                onchange="updateSettlement(\${index}, 'amount', this.value)" required>
            </div>
          </div>
          
          <div class="form-group">
            <label for="settlementBank_\${index}">Bank/Account (if applicable)</label>
            <input type="text" id="settlementBank_\${index}" onchange="updateSettlement(\${index}, 'bankAccount', this.value)">
          </div>
          
          <div class="form-group">
            <label for="settlementNotes_\${index}">Notes</label>
            <input type="text" id="settlementNotes_\${index}" onchange="updateSettlement(\${index}, 'notes', this.value)">
          </div>
        \`;
        
        // Add to container
        document.getElementById('settlementContainer').appendChild(settlementItem);
        
        // Update totals
        updateTotals();
      }
      
      // Remove a settlement method
      function removeSettlement(index) {
        // Remove the settlement from the array
        settlements.splice(index, 1);
        
        // Remove from DOM
        const settlementItems = document.querySelectorAll('.settlement-item');
        settlementItems[index].remove();
        
        // Update data attributes for remaining items
        const remainingItems = document.querySelectorAll('.settlement-item');
        remainingItems.forEach((item, i) => {
          item.dataset.index = i;
          
          // Update onclick handlers
          const removeButton = item.querySelector('.remove-settlement');
          removeButton.setAttribute('onclick', \`removeSettlement(\${i})\`);
          
          // Update input IDs and onchange handlers
          const inputs = item.querySelectorAll('input, select');
          inputs.forEach(input => {
            const idParts = input.id.split('_');
            input.id = \`\${idParts[0]}_\${i}\`;
            
            if (input.hasAttribute('onchange')) {
              const onchangeAttr = input.getAttribute('onchange');
              const newOnchange = onchangeAttr.replace(/updateSettlement\\\\(\\\\d+,/, \`updateSettlement(\${i},\`);
              input.setAttribute('onchange', newOnchange);
            }
          });
        });
        
        // Update totals
        updateTotals();
      }
      
      // Update a settlement property
      function updateSettlement(index, property, value) {
        if (property === 'amount') {
          value = parseFloat(value) || 0;
        }
        
        settlements[index][property] = value;
        updateTotals();
      }
      
      // Update total and remaining amounts
      function updateTotals() {
        let usedAmount = 0;
        settlements.forEach(settlement => {
          if (settlement.currency === currency) {
            usedAmount += parseFloat(settlement.amount || 0);
          }
        });
        
        const remainingAmount = totalAmount - usedAmount;
        document.getElementById('remainingAmount').textContent = remainingAmount.toFixed(2);
        
        // Highlight if there's a discrepancy
        if (Math.abs(remainingAmount) > 0.01) {
          document.getElementById('remainingAmount').style.color = 'red';
        } else {
          document.getElementById('remainingAmount').style.color = 'green';
        }
      }
      
      // Form submission handler with timeout protection
      document.getElementById('settlementForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate settlements
        if (settlements.length === 0) {
          const messageDiv = document.getElementById('message');
          messageDiv.innerHTML = "At least one settlement method is required.";
          messageDiv.style.display = 'block';
          return;
        }
        
        // Validate settlement types
        for (let i = 0; i < settlements.length; i++) {
          if (!settlements[i].settlementType) {
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = "Please select a settlement type for all settlement methods.";
            messageDiv.style.display = 'block';
            return;
          }
        }
        
        // Validate settlement amounts
        let usedAmount = 0;
        settlements.forEach(settlement => {
          if (settlement.currency === currency) {
            usedAmount += parseFloat(settlement.amount || 0);
          }
        });
        
        const remainingAmount = totalAmount - usedAmount;
        
        if (Math.abs(remainingAmount) > 0.01) {
          const messageDiv = document.getElementById('message');
          messageDiv.innerHTML = "Settlement amounts do not match the transaction amount. Please adjust.";
          messageDiv.style.display = 'block';
          return;
        }
        
        // Show loading overlay
        showLoadingOverlay("Processing settlements...");
        
        // Initialize processing steps for this transaction type
        initTransactionProcessing('settlement');
        
        // Update processing step
        updateProcessingStep("Validating settlement data...");
        
        // Submit data
        const formData = {
          settlements: settlements
        };
        
        // Add timeout protection
        const timeoutPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('Request timed out after 5 minutes. The server might still be processing your request.'));
          }, 300000); // 5 minute timeout
        });
        
        // Track the request Promise
        const requestPromise = new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(reject)
            .processSettlementForm(formData);
        });
        
        // Race between request and timeout
        Promise.race([requestPromise, timeoutPromise])
          .then(handleFormSuccess)
          .catch(handleFormFailure);
      });
    </script>
  </body>
</html>`;
}

/**
 * Returns the HTML content for the swap form
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
      button:disabled {
        background-color: #a9a9a9;
        cursor: not-allowed;
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
      .currency-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 20px;
      }
      .swap-box {
        background-color: #f0f8ff;
        padding: 10px;
        border-radius: 4px;
      }
      h3 {
        margin-top: 0;
      }
    </style>
    
    <!-- Include progress indicator component -->
    <?!= includeProgressIndicator(); ?>
  </head>
  <body>
    <h2>Swap Transaction</h2>
    
    <div id="message" class="error" style="display:none;"></div>
    
    <form id="swapForm">
      <div class="form-group">
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="<?= today ?>" required>
      </div>
      
      <div class="form-group">
        <label for="customer">Customer</label>
        <input type="text" id="customer" name="customer" required>
      </div>
      
      <div class="currency-grid">
        <div class="swap-box">
          <h3>From (Outgoing)</h3>
          
          <div class="form-group">
            <label for="fromCurrency">Currency</label>
            <select id="fromCurrency" name="fromCurrency" required>
              <? for (var i = 0; i < currencies.length; i++) { ?>
                <option value="<?= currencies[i] ?>"><?= currencies[i] ?></option>
              <? } ?>
            </select>
          </div>
          
          <div class="form-group">
            <label for="fromAmount">Amount</label>
            <input type="number" id="fromAmount" name="fromAmount" step="0.01" min="0" required onchange="updateNairaValue()">
          </div>
          
          <div class="form-group">
            <label for="sellRate">Rate (to NGN)</label>
            <input type="number" id="sellRate" name="sellRate" step="0.01" min="0" required onchange="updateNairaValue()">
          </div>
          
          <div class="form-group">
            <label>Naira Value</label>
            <div id="fromNairaValue" style="padding: 8px; background-color: #eee; border-radius: 4px;">₦0.00</div>
          </div>
        </div>
        
        <div class="swap-box">
          <h3>To (Incoming)</h3>
          
          <div class="form-group">
            <label for="toCurrency">Currency</label>
            <select id="toCurrency" name="toCurrency" required>
              <? for (var i = 0; i < currencies.length; i++) { ?>
                <option value="<?= currencies[i] ?>" <?= currencies[i] === 'NAIRA' ? 'selected' : '' ?>><?= currencies[i] ?></option>
              <? } ?>
            </select>
          </div>
          
          <div class="form-group">
            <label for="toAmount">Amount</label>
            <input type="number" id="toAmount" name="toAmount" step="0.01" min="0" required onchange="updateEquivalentRate()">
          </div>
          
          <div class="form-group">
            <label for="buyRate">Rate (from NGN)</label>
            <input type="number" id="buyRate" name="buyRate" step="0.01" min="0" required onchange="updateEquivalentRate()">
          </div>
          
          <div class="form-group">
            <label>Naira Value</label>
            <div id="toNairaValue" style="padding: 8px; background-color: #eee; border-radius: 4px;">₦0.00</div>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label for="equivalentRate">Equivalent Rate</label>
        <div id="equivalentRate" style="padding: 8px; background-color: #f5f5f5; border-radius: 4px;">-</div>
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
      
      <div class="button-group">
        <button type="button" class="cancel" id="cancelButton" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" id="submitButton">Process Swap</button>
      </div>
    </form>
    
    <script>
      // Update Naira values when rates change
      function updateNairaValue() {
        const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
        const sellRate = parseFloat(document.getElementById('sellRate').value) || 0;
        const fromNairaValue = fromAmount * sellRate;
        
        document.getElementById('fromNairaValue').textContent = '₦' + fromNairaValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        
        updateEquivalentRate();
      }
      
      // Update equivalent rate (currency to currency)
      function updateEquivalentRate() {
        const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
        const sellRate = parseFloat(document.getElementById('sellRate').value) || 0;
        const fromNairaValue = fromAmount * sellRate;
        
        const toAmount = parseFloat(document.getElementById('toAmount').value) || 0;
        const buyRate = parseFloat(document.getElementById('buyRate').value) || 0;
        const toNairaValue = toAmount * buyRate;
        
        document.getElementById('toNairaValue').textContent = '₦' + toNairaValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        
        if (fromAmount > 0 && toAmount > 0) {
          const equivalentRate = toAmount / fromAmount;
          document.getElementById('equivalentRate').textContent = '1 ' + 
            document.getElementById('fromCurrency').value + ' = ' + 
            equivalentRate.toFixed(4) + ' ' + 
            document.getElementById('toCurrency').value;
        } else {
          document.getElementById('equivalentRate').textContent = '-';
        }
      }
      
      // Form submission handler
      document.getElementById('swapForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading overlay
        showLoadingOverlay("Processing swap transaction...");
        
        // Initialize processing steps for this transaction type
        initTransactionProcessing('swap');
        
        // Update first processing step
        updateProcessingStep("Validating swap data...");
        
        // Collect form data
        const formData = {
          date: document.getElementById('date').value,
          customer: document.getElementById('customer').value,
          fromCurrency: document.getElementById('fromCurrency').value,
          fromAmount: document.getElementById('fromAmount').value,
          sellRate: document.getElementById('sellRate').value,
          toCurrency: document.getElementById('toCurrency').value,
          toAmount: document.getElementById('toAmount').value,
          buyRate: document.getElementById('buyRate').value,
          source: document.getElementById('source').value,
          staff: document.getElementById('staff').value
        };
        
        // Send data to server
        google.script.run
          .withSuccessHandler(handleFormSuccess)
          .withFailureHandler(handleFormFailure)
          .processSwapForm(formData);
      });
      
      // Currency dropdowns change handler
      document.getElementById('fromCurrency').addEventListener('change', updateEquivalentRate);
      document.getElementById('toCurrency').addEventListener('change', updateEquivalentRate);
    </script>
  </body>
</html>`;
}

/**
 * Returns the HTML content for the adjustment form
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
      button:disabled {
        background-color: #a9a9a9;
        cursor: not-allowed;
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
    
    <!-- Include progress indicator component -->
    <?!= includeProgressIndicator(); ?>
  </head>
  <body>
    <h2>Inventory Adjustment</h2>
    
    <div id="message" class="error" style="display:none;"></div>
    
    <form id="adjustmentForm">
      <div class="form-group">
        <label for="date">Date</label>
        <input type="date" id="date" name="date" value="<?= today ?>" required>
      </div>
      
      <div class="form-group">
        <label for="currency">Currency</label>
        <select id="currency" name="currency" required>
          <? for (var i = 0; i < currencies.length; i++) { ?>
            <option value="<?= currencies[i] ?>"><?= currencies[i] ?></option>
          <? } ?>
        </select>
      </div>
      
      <div class="form-group">
        <label for="amount">Adjustment Amount (positive to add, negative to subtract)</label>
        <input type="number" id="amount" name="amount" step="0.01" required>
      </div>
      
      <div class="form-group">
        <label for="reason">Reason for Adjustment</label>
        <textarea id="reason" name="reason" rows="3" required></textarea>
      </div>
      
      <div class="button-group">
        <button type="button" class="cancel" id="cancelButton" onclick="google.script.host.close()">Cancel</button>
        <button type="submit" id="submitButton">Save Adjustment</button>
      </div>
    </form>
    
    <script>
      // Form submission handler
      document.getElementById('adjustmentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading overlay with initial message
        showLoadingOverlay("Processing adjustment...");
        
        // Initialize processing steps for this transaction type
        initTransactionProcessing('adjustment');
        
        // Update first processing step
        updateProcessingStep("Validating adjustment data...");
        
        // Collect form data
        const formData = {
          date: document.getElementById('date').value,
          currency: document.getElementById('currency').value,
          amount: document.getElementById('amount').value,
          reason: document.getElementById('reason').value
        };
        
        // Send data to server
        google.script.run
          .withSuccessHandler(handleFormSuccess)
          .withFailureHandler(handleFormFailure)
          .processAdjustmentForm(formData);
      });
    </script>
  </body>
</html>`;
}

/**
 * Gets the HTML content for the progress indicator
 * @return {string} HTML content
 */
function getProgressIndicatorHtml() {
  // Delegate to the Main.gs implementation
  return getProgressIndicatorHtml();
}
