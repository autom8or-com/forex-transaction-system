/**
 * Process the settlement form submission
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
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
    
    const pendingTransaction = JSON.parse(pendingTransactionJson);
    
    addProcessingStep("Settlement data validated");
    addProcessingStep(`${formData.settlements.length} settlement legs processed`);
    
    // Ensure settlement amounts are parsed as numbers
    const settlements = formData.settlements.map(settlement => {
      return {
        ...settlement,
        amount: parseFloat(settlement.amount)
      };
    });
    
    // Create transaction with settlement legs
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
      legs: settlements
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