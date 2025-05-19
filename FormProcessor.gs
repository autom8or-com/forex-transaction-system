/**
 * FOREX Transaction System - Form Processor
 *
 * Contains optimized and consolidated form processing functions for:
 * - Settlement Form
 * - InventoryAdjustment Form
 *
 * This file will consolidate the implementations from multiple places into a single
 * source of truth to avoid conflicts and improve maintainability.
 */

/**
 * Optimized and consolidated implementation of the Settlement Form processor
 * Fixes the "Cannot read properties of undefined (reading 'settlements')" error
 * 
 * @param {Object} formData - The settlement form data
 * @return {Object} Result with status and processing information
 */
function processSettlementForm(formData) {
  try {
    // Initialize processing tracking
    initializeProcessingSteps();
    
    // Get pending transaction data
    const props = PropertiesService.getScriptProperties();
    const pendingTransactionJson = props.getProperty('pendingTransaction');
    
    if (!pendingTransactionJson) {
      return {
        success: false,
        message: 'No pending transaction found',
        processingSteps: getProcessingSteps()
      };
    }
    
    // Parse transaction data
    const pendingTransaction = JSON.parse(pendingTransactionJson);
    
    // Defensive check for formData and settlements array
    if (!formData || !formData.settlements || !Array.isArray(formData.settlements)) {
      return {
        success: false,
        message: 'Invalid settlement data structure',
        processingSteps: getProcessingSteps()
      };
    }
    
    addProcessingStep("Settlement data validated");
    addProcessingStep(`${formData.settlements.length} settlement legs processed`);
    
    // Process legs in batches to prevent timeouts
    const batchSize = 5; // Process legs in batches of 5
    const totalLegs = formData.settlements.length;
    let processedLegs = 0;
    const optimizedLegs = [];
    
    // Process legs in smaller batches for better performance
    while (processedLegs < totalLegs) {
      const endIndex = Math.min(processedLegs + batchSize, totalLegs);
      const currentBatch = formData.settlements.slice(processedLegs, endIndex);
      
      // Process each leg in the current batch
      for (const leg of currentBatch) {
        // Ensure all required fields exist with defaults
        optimizedLegs.push({
          settlementType: leg.settlementType || '',
          currency: leg.currency || pendingTransaction.currency,
          // Ensure amount is a number, not a string
          amount: parseFloat(leg.amount) || 0,
          bankAccount: leg.bankAccount || '',
          notes: leg.notes || ''
        });
      }
      
      processedLegs = endIndex;
    }
    
    // Create transaction with optimized settlement legs
    const transactionData = {
      date: pendingTransaction.date,
      customer: pendingTransaction.customer,
      transactionType: pendingTransaction.transactionType,
      currency: pendingTransaction.currency,
      amount: parseFloat(pendingTransaction.amount),
      rate: parseFloat(pendingTransaction.rate),
      nature: pendingTransaction.nature,
      source: pendingTransaction.source,
      staff: pendingTransaction.staff,
      notes: pendingTransaction.notes,
      legs: optimizedLegs
    };
    
    // Create the transaction
    const result = createTransaction(transactionData);
    
    // Clear pending transaction data
    props.deleteProperty('pendingTransaction');
    
    // Ensure processing steps are included
    if (!result.processingSteps) {
      result.processingSteps = getProcessingSteps();
    }
    
    return result;
  } catch (error) {
    Logger.log(`Error processing settlement form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: getProcessingSteps()
    };
  }
}
