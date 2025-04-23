/**
 * Forex Transaction System - Report Generator
 * 
 * Handles all reporting functionality including:
 * - Daily transaction summaries
 * - Staff performance reports
 * - Currency analysis
 * - Customer analytics
 * - PDF report generation
 */

/**
 * Generates a daily summary report
 * @param {Date} reportDate - Optional date for the report (defaults to today)
 * @return {Object} Report data
 */
function generateDailyReport(reportDate) {
  try {
    const date = reportDate || new Date();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
    
    // Format date for display and comparison
    const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const displayDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM d, yyyy');
    
    // Get all transactions for the day
    const transactions = transactionSheet.getDataRange().getValues();
    const headers = transactions[0];
    
    // Find column indices
    const dateCol = headers.indexOf('Date');
    const customerCol = headers.indexOf('Customer');
    const typeCol = headers.indexOf('Transaction Type');
    const currencyCol = headers.indexOf('Currency');
    const amountCol = headers.indexOf('Amount');
    const rateCol = headers.indexOf('Rate');
    const valueCol = headers.indexOf('Value (NGN)');
    const staffCol = headers.indexOf('Staff');
    
    // Filter transactions for the specified date
    const dailyTransactions = [];
    
    for (let i = 1; i < transactions.length; i++) {
      const txDate = transactions[i][dateCol];
      if (!txDate) continue;
      
      const txDateString = Utilities.formatDate(txDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      if (txDateString === dateString) {
        dailyTransactions.push({
          id: transactions[i][0],
          customer: transactions[i][customerCol],
          type: transactions[i][typeCol],
          currency: transactions[i][currencyCol],
          amount: transactions[i][amountCol],
          rate: transactions[i][rateCol],
          value: transactions[i][valueCol],
          staff: transactions[i][staffCol]
        });
      }
    }
    
    // Prepare summary data
    const currencies = ['USD', 'GBP', 'EUR', 'NAIRA'];
    const summary = {
      totalTransactions: dailyTransactions.length,
      totalValueNGN: 0,
      currencies: {}
    };
    
    // Initialize currency summary
    currencies.forEach(currency => {
      summary.currencies[currency] = {
        buys: 0,
        buyAmount: 0,
        buyValueNGN: 0,
        sells: 0,
        sellAmount: 0,
        sellValueNGN: 0
      };
    });
    
    // Calculate summary data
    dailyTransactions.forEach(tx => {
      summary.totalValueNGN += tx.value;
      
      if (tx.type === 'Buy') {
        summary.currencies[tx.currency].buys++;
        summary.currencies[tx.currency].buyAmount += tx.amount;
        summary.currencies[tx.currency].buyValueNGN += tx.value;
      } else if (tx.type === 'Sell') {
        summary.currencies[tx.currency].sells++;
        summary.currencies[tx.currency].sellAmount += tx.amount;
        summary.currencies[tx.currency].sellValueNGN += tx.value;
      }
    });
    
    // Get inventory figures for each currency
    const inventory = {};
    
    currencies.forEach(currency => {
      const inventoryData = findInventoryForDateAndCurrency(date, currency);
      
      if (inventoryData) {
        inventory[currency] = {
          openingBalance: inventoryData.openingBalance,
          purchases: inventoryData.purchases,
          sales: inventoryData.sales,
          adjustments: inventoryData.adjustments,
          closingBalance: inventoryData.closingBalance
        };
      } else {
        inventory[currency] = {
          openingBalance: 0,
          purchases: 0,
          sales: 0,
          adjustments: 0,
          closingBalance: 0
        };
      }
    });
    
    // Create the report
    const report = {
      date: dateString,
      displayDate: displayDate,
      summary: summary,
      inventory: inventory,
      transactions: dailyTransactions
    };
    
    // Show the report in a modal dialog
    showDailyReportModal(report);
    
    return report;
  } catch (error) {
    Logger.log(`Error generating daily report: ${error}`);
    SpreadsheetApp.getUi().alert(`Error generating report: ${error.toString()}`);
    
    return {
      success: false,
      message: `Error generating report: ${error.toString()}`
    };
  }
}

/**
 * Shows the daily report in a modal dialog
 * @param {Object} report - Report data
 */
function showDailyReportModal(report) {
  const htmlTemplate = HtmlService.createTemplate(getDailyReportHtml());
  
  // Add data to template
  htmlTemplate.report = report;
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(800)
    .setHeight(600)
    .setTitle(`Daily Report: ${report.displayDate}`);
  
  // Show the dialog
  SpreadsheetApp.getUi().showModalDialog(html, `Daily Report: ${report.displayDate}`);
}

/**
 * Gets the HTML template for the daily report
 * @return {string} HTML content
 */
function getDailyReportHtml() {
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
      h2 {
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 10px;
        color: #3c4043;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 5px;
      }
      .summary-panel {
        background-color: #f8f9fa;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .summary-label {
        font-weight: bold;
        color: #5f6368;
      }
      .summary-value {
        font-weight: bold;
      }
      .currency-summary {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      .currency-card {
        background-color: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 10px;
      }
      .currency-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 10px;
        color: #3c4043;
      }
      .inventory-summary {
        margin-bottom: 20px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th {
        background-color: #4285f4;
        color: white;
        font-weight: normal;
        text-align: left;
        padding: 8px;
      }
      td {
        padding: 8px;
        border-bottom: 1px solid #e0e0e0;
      }
      tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      .value-positive {
        color: #0f9d58;
      }
      .value-negative {
        color: #ea4335;
      }
      .button-group {
        text-align: right;
        margin-top: 20px;
      }
      button {
        padding: 8px 16px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .print-button {
        background-color: #5f6368;
        margin-right: 10px;
      }
      @media print {
        .button-group {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <h1>Daily Transaction Report: <?= report.displayDate ?></h1>
    
    <div class="summary-panel">
      <div class="summary-row">
        <span class="summary-label">Total Transactions:</span>
        <span class="summary-value"><?= report.summary.totalTransactions ?></span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Value (NGN):</span>
        <span class="summary-value">₦<?= formatNumber(report.summary.totalValueNGN) ?></span>
      </div>
    </div>
    
    <h2>Currency Summary</h2>
    
    <div class="currency-summary">
      <? for (const currency in report.summary.currencies) { ?>
        <div class="currency-card">
          <div class="currency-title"><?= currency ?></div>
          <div class="summary-row">
            <span>Buy Transactions:</span>
            <span><?= report.summary.currencies[currency].buys ?></span>
          </div>
          <div class="summary-row">
            <span>Buy Amount:</span>
            <span><?= formatNumber(report.summary.currencies[currency].buyAmount) ?></span>
          </div>
          <div class="summary-row">
            <span>Buy Value (NGN):</span>
            <span>₦<?= formatNumber(report.summary.currencies[currency].buyValueNGN) ?></span>
          </div>
          <div class="summary-row">
            <span>Sell Transactions:</span>
            <span><?= report.summary.currencies[currency].sells ?></span>
          </div>
          <div class="summary-row">
            <span>Sell Amount:</span>
            <span><?= formatNumber(report.summary.currencies[currency].sellAmount) ?></span>
          </div>
          <div class="summary-row">
            <span>Sell Value (NGN):</span>
            <span>₦<?= formatNumber(report.summary.currencies[currency].sellValueNGN) ?></span>
          </div>
        </div>
      <? } ?>
    </div>
    
    <h2>Inventory</h2>
    
    <div class="inventory-summary">
      <table>
        <thead>
          <tr>
            <th>Currency</th>
            <th>Opening Balance</th>
            <th>Purchases</th>
            <th>Sales</th>
            <th>Adjustments</th>
            <th>Closing Balance</th>
          </tr>
        </thead>
        <tbody>
          <? for (const currency in report.inventory) { ?>
            <tr>
              <td><?= currency ?></td>
              <td><?= formatNumber(report.inventory[currency].openingBalance) ?></td>
              <td><?= formatNumber(report.inventory[currency].purchases) ?></td>
              <td><?= formatNumber(report.inventory[currency].sales) ?></td>
              <td><?= formatNumber(report.inventory[currency].adjustments) ?></td>
              <td><?= formatNumber(report.inventory[currency].closingBalance) ?></td>
            </tr>
          <? } ?>
        </tbody>
      </table>
    </div>
    
    <h2>Transactions</h2>
    
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Type</th>
          <th>Currency</th>
          <th>Amount</th>
          <th>Rate</th>
          <th>Value (NGN)</th>
          <th>Staff</th>
        </tr>
      </thead>
      <tbody>
        <? for (let i = 0; i < report.transactions.length; i++) { ?>
          <tr>
            <td><?= report.transactions[i].id ?></td>
            <td><?= report.transactions[i].customer ?></td>
            <td><?= report.transactions[i].type ?></td>
            <td><?= report.transactions[i].currency ?></td>
            <td><?= formatNumber(report.transactions[i].amount) ?></td>
            <td><?= formatNumber(report.transactions[i].rate) ?></td>
            <td>₦<?= formatNumber(report.transactions[i].value) ?></td>
            <td><?= report.transactions[i].staff ?></td>
          </tr>
        <? } ?>
      </tbody>
    </table>
    
    <div class="button-group">
      <button class="print-button" onclick="window.print()">Print Report</button>
      <button onclick="google.script.host.close()">Close</button>
    </div>
    
    <script>
      // Format number with commas
      function formatNumber(num) {
        if (typeof num !== 'number') return num;
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    </script>
  </body>
</html>`;
}

/**
 * Finds inventory data for a specific date and currency
 * @param {Date} date - The date to search for
 * @param {string} currency - The currency to search for
 * @return {Object|null} Inventory data or null if not found
 */
function findInventoryForDateAndCurrency(date, currency) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inventorySheet = ss.getSheetByName(SHEET_DAILY_INVENTORY);
  
  // Format date for comparison
  const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  // Get all inventory data
  const inventoryData = inventorySheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < inventoryData.length; i++) {
    if (!inventoryData[i][0]) continue; // Skip empty rows
    
    const rowDate = inventoryData[i][0];
    const rowDateString = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    if (rowDateString === dateString && inventoryData[i][1] === currency) {
      return {
        openingBalance: inventoryData[i][2],
        purchases: inventoryData[i][3],
        sales: inventoryData[i][4],
        adjustments: inventoryData[i][5],
        closingBalance: inventoryData[i][6]
      };
    }
  }
  
  return null;
}

/**
 * Generates a staff performance report
 * @param {Date} startDate - Optional start date for the report
 * @param {Date} endDate - Optional end date for the report
 * @return {Object} Report data
 */
function generateStaffReport(startDate, endDate) {
  try {
    // Default to current month if no dates provided
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Format dates for display and comparison
    const startDateString = Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const endDateString = Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const displayDateRange = `${Utilities.formatDate(start, Session.getScriptTimeZone(), 'MMMM d, yyyy')} - ${Utilities.formatDate(end, Session.getScriptTimeZone(), 'MMMM d, yyyy')}`;
    
    // Get all transactions
    const transactions = transactionSheet.getDataRange().getValues();
    const headers = transactions[0];
    
    // Find column indices
    const dateCol = headers.indexOf('Date');
    const typeCol = headers.indexOf('Transaction Type');
    const currencyCol = headers.indexOf('Currency');
    const amountCol = headers.indexOf('Amount');
    const valueCol = headers.indexOf('Value (NGN)');
    const staffCol = headers.indexOf('Staff');
    
    // Filter transactions for the date range
    const filteredTransactions = [];
    
    for (let i = 1; i < transactions.length; i++) {
      const txDate = transactions[i][dateCol];
      if (!txDate) continue;
      
      const txDateString = Utilities.formatDate(txDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      if (txDateString >= startDateString && txDateString <= endDateString) {
        filteredTransactions.push({
          date: txDate,
          type: transactions[i][typeCol],
          currency: transactions[i][currencyCol],
          amount: transactions[i][amountCol],
          value: transactions[i][valueCol],
          staff: transactions[i][staffCol]
        });
      }
    }
    
    // Group by staff
    const staffPerformance = {};
    
    filteredTransactions.forEach(tx => {
      const staff = tx.staff;
      
      if (!staffPerformance[staff]) {
        staffPerformance[staff] = {
          totalTransactions: 0,
          totalValueNGN: 0,
          buys: 0,
          buyValueNGN: 0,
          sells: 0,
          sellValueNGN: 0,
          currencies: {},
          dailyActivity: {}
        };
      }
      
      // Update overall stats
      staffPerformance[staff].totalTransactions++;
      staffPerformance[staff].totalValueNGN += tx.value;
      
      // Update buy/sell stats
      if (tx.type === 'Buy') {
        staffPerformance[staff].buys++;
        staffPerformance[staff].buyValueNGN += tx.value;
      } else if (tx.type === 'Sell') {
        staffPerformance[staff].sells++;
        staffPerformance[staff].sellValueNGN += tx.value;
      }
      
      // Update currency stats
      if (!staffPerformance[staff].currencies[tx.currency]) {
        staffPerformance[staff].currencies[tx.currency] = {
          transactions: 0,
          amount: 0,
          valueNGN: 0
        };
      }
      
      staffPerformance[staff].currencies[tx.currency].transactions++;
      staffPerformance[staff].currencies[tx.currency].amount += tx.amount;
      staffPerformance[staff].currencies[tx.currency].valueNGN += tx.value;
      
      // Update daily activity
      const txDateString = Utilities.formatDate(tx.date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (!staffPerformance[staff].dailyActivity[txDateString]) {
        staffPerformance[staff].dailyActivity[txDateString] = {
          transactions: 0,
          valueNGN: 0
        };
      }
      
      staffPerformance[staff].dailyActivity[txDateString].transactions++;
      staffPerformance[staff].dailyActivity[txDateString].valueNGN += tx.value;
    });
    
    // Calculate totals across all staff
    const totals = {
      totalTransactions: filteredTransactions.length,
      totalValueNGN: 0,
      buys: 0,
      buyValueNGN: 0,
      sells: 0,
      sellValueNGN: 0
    };
    
    Object.values(staffPerformance).forEach(staff => {
      totals.totalValueNGN += staff.totalValueNGN;
      totals.buys += staff.buys;
      totals.buyValueNGN += staff.buyValueNGN;
      totals.sells += staff.sells;
      totals.sellValueNGN += staff.sellValueNGN;
    });
    
    // Create the report
    const report = {
      startDate: startDateString,
      endDate: endDateString,
      displayDateRange: displayDateRange,
      staffPerformance: staffPerformance,
      totals: totals
    };
    
    // Show the report in a modal dialog
    showStaffReportModal(report);
    
    return report;
  } catch (error) {
    Logger.log(`Error generating staff report: ${error}`);
    SpreadsheetApp.getUi().alert(`Error generating report: ${error.toString()}`);
    
    return {
      success: false,
      message: `Error generating report: ${error.toString()}`
    };
  }
}

/**
 * Shows the staff report in a modal dialog
 * @param {Object} report - Report data
 */
function showStaffReportModal(report) {
  const htmlTemplate = HtmlService.createTemplate(getStaffReportHtml());
  
  // Add data to template
  htmlTemplate.report = report;
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(800)
    .setHeight(600)
    .setTitle(`Staff Performance: ${report.displayDateRange}`);
  
  // Show the dialog
  SpreadsheetApp.getUi().showModalDialog(html, `Staff Performance: ${report.displayDateRange}`);
}

/**
 * Gets the HTML template for the staff report
 * @return {string} HTML content
 */
function getStaffReportHtml() {
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
      h2 {
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 10px;
        color: #3c4043;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 5px;
      }
      .summary-panel {
        background-color: #f8f9fa;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .summary-label {
        font-weight: bold;
        color: #5f6368;
      }
      .summary-value {
        font-weight: bold;
      }
      .staff-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
      }
      .staff-card {
        background-color: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 15px;
      }
      .staff-name {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 15px;
        color: #3c4043;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 20px;
      }
      th {
        background-color: #4285f4;
        color: white;
        font-weight: normal;
        text-align: left;
        padding: 8px;
      }
      td {
        padding: 8px;
        border-bottom: 1px solid #e0e0e0;
      }
      tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      .button-group {
        text-align: right;
        margin-top: 20px;
      }
      button {
        padding: 8px 16px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .print-button {
        background-color: #5f6368;
        margin-right: 10px;
      }
      @media print {
        .button-group {
          display: none;
        }
      }
      .chart-container {
        width: 100%;
        height: 200px;
        margin-bottom: 20px;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <h1>Staff Performance Report: <?= report.displayDateRange ?></h1>
    
    <div class="summary-panel">
      <div class="summary-row">
        <span class="summary-label">Total Transactions:</span>
        <span class="summary-value"><?= report.totals.totalTransactions ?></span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Value (NGN):</span>
        <span class="summary-value">₦<?= formatNumber(report.totals.totalValueNGN) ?></span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Buy Transactions:</span>
        <span class="summary-value"><?= report.totals.buys ?></span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Buy Value (NGN):</span>
        <span class="summary-value">₦<?= formatNumber(report.totals.buyValueNGN) ?></span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Sell Transactions:</span>
        <span class="summary-value"><?= report.totals.sells ?></span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Sell Value (NGN):</span>
        <span class="summary-value">₦<?= formatNumber(report.totals.sellValueNGN) ?></span>
      </div>
    </div>
    
    <div class="chart-container">
      <canvas id="staffChart"></canvas>
    </div>
    
    <h2>Staff Performance</h2>
    
    <div class="staff-grid">
      <? for (const staff in report.staffPerformance) { ?>
        <div class="staff-card">
          <div class="staff-name"><?= staff ?></div>
          <div class="summary-row">
            <span>Total Transactions:</span>
            <span><?= report.staffPerformance[staff].totalTransactions ?></span>
          </div>
          <div class="summary-row">
            <span>Total Value (NGN):</span>
            <span>₦<?= formatNumber(report.staffPerformance[staff].totalValueNGN) ?></span>
          </div>
          <div class="summary-row">
            <span>Buy Transactions:</span>
            <span><?= report.staffPerformance[staff].buys ?></span>
          </div>
          <div class="summary-row">
            <span>Buy Value (NGN):</span>
            <span>₦<?= formatNumber(report.staffPerformance[staff].buyValueNGN) ?></span>
          </div>
          <div class="summary-row">
            <span>Sell Transactions:</span>
            <span><?= report.staffPerformance[staff].sells ?></span>
          </div>
          <div class="summary-row">
            <span>Sell Value (NGN):</span>
            <span>₦<?= formatNumber(report.staffPerformance[staff].sellValueNGN) ?></span>
          </div>
          
          <h3>Currency Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Currency</th>
                <th>Transactions</th>
                <th>Amount</th>
                <th>Value (NGN)</th>
              </tr>
            </thead>
            <tbody>
              <? for (const currency in report.staffPerformance[staff].currencies) { ?>
                <tr>
                  <td><?= currency ?></td>
                  <td><?= report.staffPerformance[staff].currencies[currency].transactions ?></td>
                  <td><?= formatNumber(report.staffPerformance[staff].currencies[currency].amount) ?></td>
                  <td>₦<?= formatNumber(report.staffPerformance[staff].currencies[currency].valueNGN) ?></td>
                </tr>
              <? } ?>
            </tbody>
          </table>
        </div>
      <? } ?>
    </div>
    
    <div class="button-group">
      <button class="print-button" onclick="window.print()">Print Report</button>
      <button onclick="google.script.host.close()">Close</button>
    </div>
    
    <script>
      // Format number with commas
      function formatNumber(num) {
        if (typeof num !== 'number') return num;
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
      
      // Create chart
      document.addEventListener('DOMContentLoaded', function() {
        const staffData = <?= JSON.stringify(report.staffPerformance) ?>;
        
        // Prepare data for chart
        const labels = Object.keys(staffData);
        const buyData = labels.map(staff => staffData[staff].buyValueNGN);
        const sellData = labels.map(staff => staffData[staff].sellValueNGN);
        
        // Create chart
        const ctx = document.getElementById('staffChart').getContext('2d');
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Buy Value (NGN)',
                data: buyData,
                backgroundColor: 'rgba(66, 133, 244, 0.6)',
                borderColor: 'rgba(66, 133, 244, 1)',
                borderWidth: 1
              },
              {
                label: 'Sell Value (NGN)',
                data: sellData,
                backgroundColor: 'rgba(219, 68, 55, 0.6)',
                borderColor: 'rgba(219, 68, 55, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '₦' + value.toLocaleString();
                  }
                }
              }
            }
          }
        });
      });
    </script>
  </body>
</html>`;
}

/**
 * Generates a customer analytics report
 * @param {Date} startDate - Optional start date for the report
 * @param {Date} endDate - Optional end date for the report
 * @return {Object} Report data
 */
function generateCustomerReport(startDate, endDate) {
  try {
    // Default to current month if no dates provided
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const transactionSheet = ss.getSheetByName(SHEET_TRANSACTIONS);
    
    // Format dates for display and comparison
    const startDateString = Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const endDateString = Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const displayDateRange = `${Utilities.formatDate(start, Session.getScriptTimeZone(), 'MMMM d, yyyy')} - ${Utilities.formatDate(end, Session.getScriptTimeZone(), 'MMMM d, yyyy')}`;
    
    // Get all transactions
    const transactions = transactionSheet.getDataRange().getValues();
    const headers = transactions[0];
    
    // Find column indices
    const dateCol = headers.indexOf('Date');
    const customerCol = headers.indexOf('Customer');
    const typeCol = headers.indexOf('Transaction Type');
    const currencyCol = headers.indexOf('Currency');
    const amountCol = headers.indexOf('Amount');
    const valueCol = headers.indexOf('Value (NGN)');
    
    // Filter transactions for the date range
    const filteredTransactions = [];
    
    for (let i = 1; i < transactions.length; i++) {
      const txDate = transactions[i][dateCol];
      if (!txDate) continue;
      
      const txDateString = Utilities.formatDate(txDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      
      if (txDateString >= startDateString && txDateString <= endDateString) {
        filteredTransactions.push({
          date: txDate,
          customer: transactions[i][customerCol],
          type: transactions[i][typeCol],
          currency: transactions[i][currencyCol],
          amount: transactions[i][amountCol],
          value: transactions[i][valueCol]
        });
      }
    }
    
    // Group by customer
    const customerAnalytics = {};
    
    filteredTransactions.forEach(tx => {
      const customer = tx.customer;
      
      if (!customerAnalytics[customer]) {
        customerAnalytics[customer] = {
          totalTransactions: 0,
          totalValueNGN: 0,
          buys: 0,
          buyValueNGN: 0,
          sells: 0,
          sellValueNGN: 0,
          currencies: {},
          lastTransaction: null
        };
      }
      
      // Update overall stats
      customerAnalytics[customer].totalTransactions++;
      customerAnalytics[customer].totalValueNGN += tx.value;
      
      // Track last transaction
      if (!customerAnalytics[customer].lastTransaction || tx.date > customerAnalytics[customer].lastTransaction) {
        customerAnalytics[customer].lastTransaction = tx.date;
      }
      
      // Update buy/sell stats
      if (tx.type === 'Buy') {
        customerAnalytics[customer].buys++;
        customerAnalytics[customer].buyValueNGN += tx.value;
      } else if (tx.type === 'Sell') {
        customerAnalytics[customer].sells++;
        customerAnalytics[customer].sellValueNGN += tx.value;
      }
      
      // Update currency stats
      if (!customerAnalytics[customer].currencies[tx.currency]) {
        customerAnalytics[customer].currencies[tx.currency] = {
          transactions: 0,
          amount: 0,
          valueNGN: 0
        };
      }
      
      customerAnalytics[customer].currencies[tx.currency].transactions++;
      customerAnalytics[customer].currencies[tx.currency].amount += tx.amount;
      customerAnalytics[customer].currencies[tx.currency].valueNGN += tx.value;
    });
    
    // Sort customers by total value
    const sortedCustomers = Object.keys(customerAnalytics).sort((a, b) => {
      return customerAnalytics[b].totalValueNGN - customerAnalytics[a].totalValueNGN;
    });
    
    // Create the report
    const report = {
      startDate: startDateString,
      endDate: endDateString,
      displayDateRange: displayDateRange,
      customerAnalytics: customerAnalytics,
      sortedCustomers: sortedCustomers,
      totalCustomers: sortedCustomers.length,
      totalTransactions: filteredTransactions.length
    };
    
    // Show the report in a modal dialog
    showCustomerReportModal(report);
    
    return report;
  } catch (error) {
    Logger.log(`Error generating customer report: ${error}`);
    SpreadsheetApp.getUi().alert(`Error generating report: ${error.toString()}`);
    
    return {
      success: false,
      message: `Error generating report: ${error.toString()}`
    };
  }
}

/**
 * Shows the customer report in a modal dialog
 * @param {Object} report - Report data
 */
function showCustomerReportModal(report) {
  const htmlTemplate = HtmlService.createTemplate(getCustomerReportHtml());
  
  // Add data to template
  htmlTemplate.report = report;
  
  // Generate HTML from template
  const html = htmlTemplate.evaluate()
    .setWidth(800)
    .setHeight(600)
    .setTitle(`Customer Analytics: ${report.displayDateRange}`);
  
  // Show the dialog
  SpreadsheetApp.getUi().showModalDialog(html, `Customer Analytics: ${report.displayDateRange}`);
}

/**
 * Gets the HTML template for the customer report
 * @return {string} HTML content
 */
function getCustomerReportHtml() {
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
      h2 {
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 10px;
        color: #3c4043;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 5px;
      }
      .summary-panel {
        background-color: #f8f9fa;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 20px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .summary-label {
        font-weight: bold;
        color: #5f6368;
      }
      .summary-value {
        font-weight: bold;
      }
      .customer-card {
        background-color: #f8f9fa;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 15px;
      }
      .customer-name {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 15px;
        color: #3c4043;
      }
      .customer-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      th {
        background-color: #4285f4;
        color: white;
        font-weight: normal;
        text-align: left;
        padding: 8px;
      }
      td {
        padding: 8px;
        border-bottom: 1px solid #e0e0e0;
      }
      tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      .button-group {
        text-align: right;
        margin-top: 20px;
      }
      button {
        padding: 8px 16px;
        background-color: #4285f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .print-button {
        background-color: #5f6368;
        margin-right: 10px;
      }
      @media print {
        .button-group {
          display: none;
        }
      }
      .chart-container {
        width: 100%;
        height: 250px;
        margin-bottom: 20px;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <h1>Customer Analytics Report: <?= report.displayDateRange ?></h1>
    
    <div class="summary-panel">
      <div class="summary-row">
        <span class="summary-label">Active Customers:</span>
        <span class="summary-value"><?= report.totalCustomers ?></span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Total Transactions:</span>
        <span class="summary-value"><?= report.totalTransactions ?></span>
      </div>
    </div>
    
    <div class="chart-container">
      <canvas id="customerChart"></canvas>
    </div>
    
    <h2>Top Customers</h2>
    
    <? for (let i = 0; i < Math.min(report.sortedCustomers.length, 10); i++) { ?>
      <? const customer = report.sortedCustomers[i]; ?>
      <? const data = report.customerAnalytics[customer]; ?>
      
      <div class="customer-card">
        <div class="customer-name"><?= customer ?></div>
        
        <div class="customer-details">
          <div>
            <div class="summary-row">
              <span>Total Transactions:</span>
              <span><?= data.totalTransactions ?></span>
            </div>
            <div class="summary-row">
              <span>Total Value (NGN):</span>
              <span>₦<?= formatNumber(data.totalValueNGN) ?></span>
            </div>
            <div class="summary-row">
              <span>Buy Transactions:</span>
              <span><?= data.buys ?></span>
            </div>
            <div class="summary-row">
              <span>Sell Transactions:</span>
              <span><?= data.sells ?></span>
            </div>
            <div class="summary-row">
              <span>Last Transaction:</span>
              <span><?= formatDate(data.lastTransaction) ?></span>
            </div>
          </div>
          
          <div>
            <h3>Currency Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Transactions</th>
                  <th>Value (NGN)</th>
                </tr>
              </thead>
              <tbody>
                <? for (const currency in data.currencies) { ?>
                  <tr>
                    <td><?= currency ?></td>
                    <td><?= data.currencies[currency].transactions ?></td>
                    <td>₦<?= formatNumber(data.currencies[currency].valueNGN) ?></td>
                  </tr>
                <? } ?>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    <? } ?>
    
    <div class="button-group">
      <button class="print-button" onclick="window.print()">Print Report</button>
      <button onclick="google.script.host.close()">Close</button>
    </div>
    
    <script>
      // Format number with commas
      function formatNumber(num) {
        if (typeof num !== 'number') return num;
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
      
      // Format date
      function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString();
      }
      
      // Create chart
      document.addEventListener('DOMContentLoaded', function() {
        const customerData = <?= JSON.stringify(report.customerAnalytics) ?>;
        const sortedCustomers = <?= JSON.stringify(report.sortedCustomers) ?>;
        
        // Take top 10 customers
        const topCustomers = sortedCustomers.slice(0, 10);
        
        // Prepare data for chart
        const labels = topCustomers;
        const values = topCustomers.map(customer => customerData[customer].totalValueNGN);
        
        // Create chart
        const ctx = document.getElementById('customerChart').getContext('2d');
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Transaction Value (NGN)',
                data: values,
                backgroundColor: 'rgba(66, 133, 244, 0.6)',
                borderColor: 'rgba(66, 133, 244, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '₦' + value.toLocaleString();
                  }
                }
              }
            }
          }
        });
      });
    </script>
  </body>
</html>`;
}

/**
 * Generates and emails a daily report
 * @param {string} email - Email address to send the report to
 * @param {Date} reportDate - Optional date for the report (defaults to today)
 * @return {Object} Result with status and message
 */
function emailDailyReport(email, reportDate) {
  try {
    const date = reportDate || new Date();
    const dateString = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const displayDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMMM d, yyyy');
    
    // Generate report data
    const report = generateDailyReport(date);
    
    // Create HTML for email
    const htmlTemplate = HtmlService.createTemplate(getDailyReportHtml());
    htmlTemplate.report = report;
    const htmlBody = htmlTemplate.evaluate().getContent();
    
    // Send email
    MailApp.sendEmail({
      to: email,
      subject: `Forex Transaction Daily Report: ${displayDate}`,
      htmlBody: htmlBody
    });
    
    return {
      success: true,
      message: `Report sent to ${email}`
    };
  } catch (error) {
    Logger.log(`Error sending email report: ${error}`);
    return {
      success: false,
      message: `Error sending email report: ${error.toString()}`
    };
  }
}

/**
 * Sets up a schedule to automatically email reports
 * @param {string} email - Email address to send reports to
 * @param {string} frequency - Frequency (daily, weekly, monthly)
 * @return {Object} Result with status and message
 */
function setupReportSchedule(email, frequency) {
  try {
    // Save to Config sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(SHEET_CONFIG);
    
    // Find report email setting
    const configData = configSheet.getDataRange().getValues();
    let emailRow = -1;
    let frequencyRow = -1;
    
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0] === 'Report Email') {
        emailRow = i + 1; // +1 because array is 0-based but sheet is 1-based
      } else if (configData[i][0] === 'Report Frequency') {
        frequencyRow = i + 1;
      }
    }
    
    // Update or add email setting
    if (emailRow > 0) {
      configSheet.getRange(emailRow, 2).setValue(email);
    } else {
      configSheet.appendRow(['Report Email', email, 'Email address for automated reports']);
    }
    
    // Update or add frequency setting
    if (frequencyRow > 0) {
      configSheet.getRange(frequencyRow, 2).setValue(frequency);
    } else {
      configSheet.appendRow(['Report Frequency', frequency, 'Frequency for automated reports (daily, weekly, monthly)']);
    }
    
    // Set up trigger based on frequency
    deleteTriggers_();
    
    if (frequency === 'daily') {
      ScriptApp.newTrigger('sendScheduledReport')
        .timeBased()
        .everyDays(1)
        .atHour(7)
        .create();
    } else if (frequency === 'weekly') {
      ScriptApp.newTrigger('sendScheduledReport')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.MONDAY)
        .atHour(7)
        .create();
    } else if (frequency === 'monthly') {
      ScriptApp.newTrigger('sendScheduledReport')
        .timeBased()
        .onMonthDay(1)
        .atHour(7)
        .create();
    }
    
    return {
      success: true,
      message: `Report schedule set to ${frequency} for ${email}`
    };
  } catch (error) {
    Logger.log(`Error setting up report schedule: ${error}`);
    return {
      success: false,
      message: `Error setting up report schedule: ${error.toString()}`
    };
  }
}

/**
 * Deletes all existing report triggers
 */
function deleteTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'sendScheduledReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

/**
 * Sends a scheduled report based on configuration
 */
function sendScheduledReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(SHEET_CONFIG);
    
    // Get email and frequency from config
    const configData = configSheet.getDataRange().getValues();
    let email = '';
    let frequency = 'daily';
    
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0] === 'Report Email') {
        email = configData[i][1];
      } else if (configData[i][0] === 'Report Frequency') {
        frequency = configData[i][1];
      }
    }
    
    if (!email) {
      Logger.log('No email address configured for reports');
      return;
    }
    
    // Generate report for previous day/week/month
    const today = new Date();
    let reportDate = new Date();
    
    if (frequency === 'daily') {
      reportDate.setDate(today.getDate() - 1); // Yesterday
    } else if (frequency === 'weekly') {
      reportDate.setDate(today.getDate() - 7); // Last week
    } else if (frequency === 'monthly') {
      reportDate.setMonth(today.getMonth() - 1); // Last month
    }
    
    // Send email
    emailDailyReport(email, reportDate);
    
  } catch (error) {
    Logger.log(`Error sending scheduled report: ${error}`);
  }
}

/**
 * Format number for display
 * @param {number} num - Number to format
 * @return {string} Formatted number
 */
function formatNumber(num) {
  if (typeof num !== 'number') return num;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
