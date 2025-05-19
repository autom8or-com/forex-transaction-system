/**
 * Test suite for the Templates module and related functionality
 */

/**
 * Test the template initialization and usage
 */
function testTemplatesModule() {
  Logger.log("Starting Templates module test...");
  
  try {
    // Make sure the namespace is initialized
    if (typeof FOREX === 'undefined' || typeof FOREX.Templates === 'undefined') {
      throw new Error("FOREX.Templates namespace is not defined. Make sure it's properly loaded.");
    }
    
    Logger.log("FOREX.Templates namespace is properly defined.");
    
    // Test each template getter function
    const templateFunctions = [
      'getTransactionFormHtml',
      'getSettlementFormHtml',
      'getSwapFormHtml',
      'getAdjustmentFormHtml',
      'getProgressIndicatorHtml'
    ];
    
    templateFunctions.forEach(function(funcName) {
      if (typeof FOREX.Templates[funcName] !== 'function') {
        throw new Error(`FOREX.Templates.${funcName} is not a function`);
      }
      
      const html = FOREX.Templates[funcName]();
      if (!html || typeof html !== 'string' || html.length < 10) {
        throw new Error(`FOREX.Templates.${funcName} did not return valid HTML`);
      }
      
      Logger.log(`FOREX.Templates.${funcName} returned ${html.length} characters of HTML`);
    });
    
    // Test FOREX.Utils.createHtmlTemplates
    if (typeof FOREX.Utils === 'undefined' || typeof FOREX.Utils.createHtmlTemplates !== 'function') {
      throw new Error("FOREX.Utils.createHtmlTemplates is not defined or not a function.");
    }
    
    Logger.log("FOREX.Utils.createHtmlTemplates is properly defined.");
    
    // Test core initialization of templates
    FOREX.Core.init();
    
    // Test global functions are properly mapped
    const globalFunctions = [
      'getTransactionFormHtml',
      'getSettlementFormHtml',
      'getSwapFormHtml', 
      'getAdjustmentFormHtml',
      'getProgressIndicatorHtml'
    ];
    
    globalFunctions.forEach(function(funcName) {
      if (typeof window[funcName] !== 'function') {
        throw new Error(`Global ${funcName} is not mapped correctly`);
      }
      
      Logger.log(`Global ${funcName} is properly mapped`);
    });
    
    Logger.log("Templates module test completed successfully!");
    return true;
  } catch (error) {
    Logger.log(`Templates module test failed: ${error}`);
    return false;
  }
}
