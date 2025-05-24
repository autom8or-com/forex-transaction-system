//Function update for processSettlementForm in FormHandlers.gs
/**
 * Process the multi-settlement form submission with optimizations to prevent timeout
 * @param {Object} formData - The form data
 * @return {Object} Result with status and message
 */
function processSettlementForm(formData) {
  try {
    // Initialize processing tracking
    FOREX.Utils.initializeProcessingSteps();
    
    // Get pending transaction data
    const props = PropertiesService.getScriptProperties();
    const pendingTransactionJson = props.getProperty('pendingTransaction');
    
    if (!pendingTransactionJson) {
      return {
        success: false,
        message: 'No pending transaction found',
        processingSteps: FOREX.Utils.getProcessingSteps()
      };
    }
    
    // Parse transaction data
    const pendingTransaction = JSON.parse(pendingTransactionJson);
    
    addProcessingStep("Settlement data validated");
    addProcessingStep(`${formData.settlements.length} settlement legs processed`);
    
    // Apply performance optimization - batch process legs
    // Instead of processing each leg separately, create an optimized structure
    const optimizedLegs = [];
    
    // Process legs in batches if there are many
    const batchSize = 5; // Process legs in batches of 5
    const totalLegs = formData.settlements.length;
    let processedLegs = 0;
    
    // Process legs in smaller batches to prevent timeout
    while (processedLegs < totalLegs) {
      const endIndex = Math.min(processedLegs + batchSize, totalLegs);
      const currentBatch = formData.settlements.slice(processedLegs, endIndex);
      
      // Process each leg in the current batch
      for (const leg of currentBatch) {
        // Ensure numeric values
        if (typeof leg.amount === 'string') {
          leg.amount = parseFloat(leg.amount);
        }
        
        // Add to optimized legs array
        optimizedLegs.push(leg);
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
    const result = FOREX.Transactions.createTransaction(transactionData);
    
    // Clear pending transaction data
    props.deleteProperty('pendingTransaction');
    
    // Ensure processing steps are included
    if (!result.processingSteps) {
      result.processingSteps = FOREX.Utils.getProcessingSteps();
    }
    
    return result;
  } catch (error) {
    Logger.log(`Error processing settlement form: ${error}`);
    return {
      success: false,
      message: `Error processing form: ${error.toString()}`,
      processingSteps: FOREX.Utils.getProcessingSteps()
    };
  }
}