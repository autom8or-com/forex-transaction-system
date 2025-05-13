/**
 * Include HTML file in template
 * @param {string} filename - The filename to include
 * @return {string} The file content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper function to include progress indicator components
 * @return {string} HTML with CSS and JS references
 */
function includeProgressIndicator() {
  try {
    const cssContent = HtmlService.createHtmlOutputFromFile('progress-indicator.css').getContent();
    const jsContent = HtmlService.createHtmlOutputFromFile('progress-indicator.js').getContent();
    const overlayContent = HtmlService.createHtmlOutputFromFile('loading-overlay.html').getContent();
    
    return `
    <style>
      ${cssContent}
    </style>
    ${overlayContent}
    <script>
      ${jsContent}
    </script>
    `;
  } catch (e) {
    Logger.log("Error including progress indicator: " + e.toString());
    return `
    <!-- Progress indicator files not found. Run setupSystem() to create them. -->
    <div id="loadingOverlay" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p id="processingStatus">Processing...</p>
      </div>
    </div>
    <style>
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
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      button:disabled {
        background-color: #a9a9a9;
        cursor: not-allowed;
      }
    </style>
    <script>
      // Basic loading indicator functions
      function showLoadingOverlay(message) {
        document.getElementById('loadingOverlay').style.display = 'block';
        if (message) {
          document.getElementById('processingStatus').textContent = message;
        }
        
        // Disable buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          button.disabled = true;
        });
      }
      
      function hideLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Re-enable buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
          button.disabled = false;
        });
      }
    </script>
    `;
  }
}