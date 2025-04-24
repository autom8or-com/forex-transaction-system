# Forex Transaction System - Form Troubleshooting Guide

If you're experiencing issues with the transaction forms not displaying properly, follow this guide to resolve the problem.

## Common Issues and Solutions

### Issue: "Not Implemented" error message

**Symptom**: When clicking on "New Transaction" in the Forex System menu, you see a popup message saying "Not Implemented. The transaction form will be implemented in FormHandlers.gs" instead of the actual transaction form.

**Cause**: This happens when the HTML template files are missing or when there's a conflict between the placeholder implementations in Main.gs and the actual implementations in FormHandlers.gs.

**Solution**:

1. Run the setup system function to ensure all HTML templates are created:
   - Click on **Forex System** in the menu
   - Click on **System Setup**
   - Click **Yes** when prompted to confirm

2. If the issue persists after setup, try these steps:
   - Reload the spreadsheet (refresh your browser)
   - Try the New Transaction menu item again

### Issue: "Template not found" or similar error

**Symptom**: When clicking on "New Transaction", you get an error about templates not being found.

**Solution**:

1. Make sure all necessary HTML files are created:
   - Open the Apps Script editor (Extensions > Apps Script)
   - Look for the following HTML files in the file list on the left:
     - TransactionForm.html
     - SettlementForm.html
     - SwapForm.html
     - AdjustmentForm.html
   
2. If any are missing, you can manually create them:
   - Click the "+" icon next to Files
   - Select "HTML"
   - Name it accordingly (e.g., "TransactionForm")
   - Paste the content from FormHandlers.gs (look for the getXXXHtml functions)

### Issue: Form displays but doesn't submit properly

**Symptom**: The form appears, but when you click "Save Transaction" nothing happens or you get errors.

**Solution**:

1. Check your browser console for errors (press F12 to open developer tools)
2. Make sure all required script files are present:
   - Main.gs
   - FormHandlers.gs
   - TransactionProcessor.gs
   - Config.gs

3. Ensure the HTML templates have proper script references:
   - Check that form submission handlers use the correct function names
   - Verify that the HTML templates include all necessary JavaScript code

## Manual Form Creation

If the automatic form setup isn't working, you can manually create the forms:

1. Open the Apps Script editor (Extensions > Apps Script)
2. Look for the function called `createHtmlTemplates()` in FormHandlers.gs
3. Run this function directly from the editor by:
   - Select the function name in the dropdown at the top
   - Click the "Run" button (play icon)
4. Grant any necessary permissions when prompted

## Advanced Troubleshooting

If none of the above solutions work, try these advanced steps:

1. Check for conflicts between function names:
   - In Apps Script, functions with the same name in different files can cause conflicts
   - Make sure showTransactionForm() is only defined once or has proper delegation

2. Verify configuration access:
   - The forms depend on config values from the Config sheet
   - Make sure this sheet exists and has the expected values

3. Reset the system:
   - As a last resort, you can completely reset the system:
   - Run setupSystem() from the Apps Script editor
   - This will recreate all sheets and templates

## Need More Help?

If you continue to experience issues, please:

1. Check the console logs:
   - In the Apps Script editor, click on "View" > "Logs"
   - Look for any error messages that might indicate the source of the problem

2. Make sure all script files are properly saved:
   - In the Apps Script editor, press Ctrl+S (or Cmd+S on Mac) to save all files
   - Look for any error indicators in the file list

3. Check script authorization:
   - Some script functions require authorization to run
   - Try running a simple function like setupSystem() directly from the editor
   - Follow the authorization prompts if they appear
