/**
 * Forex Transaction System - Templates Module
 * 
 * This file contains HTML template functions for the Forex Transaction System.
 * It includes all the form HTML templates and helpers for template inclusion.
 */

// Ensure the namespace exists
var FOREX = FOREX || {};
FOREX.Templates = FOREX.Templates || {};

/**
 * Returns the HTML content for the transaction form
 * @return {string} HTML content
 */
FOREX.Templates.getTransactionFormHtml = function() {
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
};

/**
 * Returns the HTML content for the settlement form
 * @return {string} HTML content
 */
FOREX.Templates.getSettlementFormHtml = function() {
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
};

/**
 * Returns the HTML content for the swap form
 * @return {string} HTML content
 */
FOREX.Templates.getSwapFormHtml = function() {
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
};

/**
 * Returns the HTML content for the adjustment form
 * @return {string} HTML content
 */
FOREX.Templates.getAdjustmentFormHtml = function() {
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
};

/**
 * Returns the HTML content for the progress indicator
 * @return {string} HTML content
 */
FOREX.Templates.getProgressIndicatorHtml = function() {
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
};

/**
 * Helper function to include progress indicator in forms
 * @return {string} HTML content
 */
function includeProgressIndicator() {
  return HtmlService.createHtmlOutputFromFile('ProgressIndicator').getContent();
}
