# Forex Transaction System - Installation Guide

This guide provides step-by-step instructions for setting up the Forex Transaction System in your Google Sheets environment.

## Prerequisites

- A Google account with access to Google Sheets and Google Drive
- Basic familiarity with Google Sheets
- Basic understanding of Google Apps Script (not required for regular users)

## Installation Steps

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Rename it to "Forex Transaction System" or your preferred name

### Step 2: Open the Apps Script Editor

1. In your Google Sheet, click on **Extensions** in the menu bar
2. Select **Apps Script**
3. This will open the Apps Script editor in a new tab

### Step 3: Copy and Import the Scripts

1. Delete any code in the default `Code.gs` file
2. Create the following script files by clicking the "+" button next to "Files":
   - `Main.gs`
   - `TransactionProcessor.gs`
   - `InventoryManager.gs`
   - `FormHandlers.gs`
   - `ReportGenerator.gs`
   - `Utilities.gs`
   - `Config.gs`

3. Create the following HTML files by clicking the "+" button and selecting "HTML":
   - `TransactionForm.html`
   - `SettlementForm.html`
   - `SwapForm.html`
   - `AdjustmentForm.html`

4. Copy and paste the code from this repository into each corresponding file

### Step 4: Save the Project

1. Click the disk icon or press Ctrl+S (Cmd+S on Mac) to save all files
2. Name your project "Forex Transaction System" in the project settings

### Step 5: Run the Setup Function

1. In the Apps Script editor, select the `setupSystem` function from the dropdown menu
2. Click the "Run" button (play icon)
3. You will be prompted to authorize the script - follow the prompts to grant necessary permissions
4. The script will create all required sheets and set up the system

### Step 6: Add Custom Menu

The script automatically adds a custom menu to your Google Sheet when you open it. To manually add the menu:

1. Return to your Google Sheet
2. Refresh the page
3. You should now see a "Forex System" menu in the menu bar
4. If you don't see it, manually run the `onOpen` function from the Apps Script editor

## System Overview

The Forex Transaction System consists of several interconnected sheets:

### Transactions Sheet
The primary data entry point that stores all transaction records.

### Transaction_Legs Sheet
Stores details of transaction settlement methods, especially for complex transactions with multiple settlement types.

### Daily_Inventory Sheet
Tracks currency balances over time, automatically updated from transactions.

### Config Sheet
Contains system settings and configuration values.

### Dashboard Sheet
Provides a quick overview of current inventory and recent transactions.

## Features

- **Transaction Management**: Record buy, sell, and swap transactions
- **Multi-Settlement Support**: Handle transactions with multiple settlement methods
- **Inventory Tracking**: Automatically track currency balances
- **Reporting**: Generate various reports for analysis
- **Dashboard**: View key metrics at a glance

## Usage Instructions

### Adding a New Transaction

1. Click on **Forex System** in the menu bar
2. Select **New Transaction**
3. Fill in the transaction details in the form
4. For transactions with multiple settlement methods, select "Yes" for "Multiple Settlement Methods"
5. Click "Save Transaction"

### Viewing Daily Inventory

1. Navigate to the "Daily_Inventory" sheet
2. View the balance history for each currency

### Generating Reports

1. Click on **Forex System** in the menu bar
2. Under the "Reports" submenu, select the desired report type
3. Configure report parameters if prompted
4. View the generated report

### System Configuration

1. Click on **Forex System** in the menu bar
2. Select **System Setup**
3. Navigate to the Config sheet
4. Adjust settings as needed

## Troubleshooting

### Common Issues

**Problem**: Transaction form doesn't open
**Solution**: Refresh the Google Sheet and try again. Ensure you've granted all necessary permissions.

**Problem**: Error when adding a transaction
**Solution**: Check the transaction data for any invalid values. Currency amounts must be positive numbers.

**Problem**: Inventory not updating
**Solution**: Check the "Auto Update Inventory" setting in the Config sheet. It should be set to "TRUE".

### Getting Support

If you encounter issues or have questions, please:

1. Check this guide and the repository README for information
2. Look at the Apps Script logs for error messages:
   - In the Apps Script editor, click on "View" > "Logs"
3. Submit an issue on the GitHub repository

## Extending the System

The system is designed to be easily extended and customized:

- Add new currency types in the Config sheet
- Modify form layouts in the HTML files
- Add new report types by extending the ReportGenerator.gs file

## Security Considerations

This system handles financial data, so consider these security recommendations:

1. Limit access to the Google Sheet to only authorized personnel
2. Regularly back up your transaction data
3. Consider implementing additional validation rules for transactions
4. Review Apps Script permissions to ensure they're appropriate for your needs

## Regular Maintenance

For optimal performance, periodically:

1. Archive old transactions to keep the active sheet manageable
2. Verify that inventory calculations are accurate
3. Check for any discrepancies between transaction totals and inventory balances
4. Update the system configuration as your business needs change
