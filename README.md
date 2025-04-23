# Forex Transaction System

A comprehensive Google Apps Script-based system for tracking forex transactions, managing currency inventory, and generating reports.

![Forex Transaction System](https://img.shields.io/badge/Google%20Apps%20Script-Forex%20System-blue)

## Overview

The Forex Transaction System is a complete solution for forex transaction tracking, built on Google Sheets and Google Apps Script. It provides powerful features for managing currency transactions, tracking inventory, and generating analytical reports.

### Key Features

- **Transaction Tracking**: Record buy, sell, and swap transactions with comprehensive details
- **Multi-Settlement Support**: Handle complex transactions with multiple settlement methods
- **Currency Inventory Management**: Automatically track and reconcile currency balances
- **Running Balances**: View currency balances after each transaction
- **Customizable Reports**: Generate daily, staff performance, and customer analytics reports
- **Interactive Dashboard**: Real-time overview of key metrics
- **Data Validation**: Ensure data consistency and accuracy
- **User-Friendly Forms**: Easy-to-use forms for data entry
- **Customizable Configuration**: Adapt the system to your specific needs

## System Architecture

The system consists of several integrated components:

### Core Sheets

1. **Transactions**: Primary data storage for all forex transactions
2. **Transaction_Legs**: Manages split settlements and complex transaction components
3. **Daily_Inventory**: Tracks currency balances over time
4. **Config**: System settings and configuration
5. **Dashboard**: Visual overview of key metrics

### Script Files

1. **Main.gs**: Core functionality and menu setup
2. **TransactionProcessor.gs**: Transaction management
3. **InventoryManager.gs**: Currency balance calculations
4. **FormHandlers.gs**: Custom transaction forms
5. **ReportGenerator.gs**: Automated reports
6. **Utilities.gs**: Helper functions
7. **Config.gs**: System settings

### HTML Forms

1. **TransactionForm.html**: For entering new transactions
2. **SettlementForm.html**: For handling multi-settlement transactions
3. **SwapForm.html**: For swap transactions
4. **AdjustmentForm.html**: For inventory adjustments

## Transaction Types

The system supports several transaction types:

### Buy Transactions
When you purchase foreign currency from a customer.

### Sell Transactions
When you sell foreign currency to a customer.

### Swap Transactions
Currency-to-currency exchanges, which are processed as linked buy/sell pairs.

### Multi-Settlement Transactions
Transactions that involve multiple payment methods or settlement legs.

## Inventory Management

The system maintains accurate inventory balances for each currency:

- **Daily Tracking**: Balances are tracked day by day
- **Running Balances**: See currency balance after each transaction
- **Auto-Reconciliation**: Automatic validation of transaction totals vs. inventory
- **Adjustments**: Record inventory adjustments with reasons

## Reporting Capabilities

Generate various reports to analyze your forex business:

- **Daily Transaction Reports**: Summarize transactions for any day
- **Staff Performance Reports**: Evaluate staff activity and performance
- **Customer Analytics**: Track customer behavior and transaction history
- **Currency Analysis**: Monitor currency volume and trends
- **Automated Email Reports**: Schedule reports to be sent automatically

## Getting Started

Please refer to the [Installation Guide](INSTALLATION.md) for detailed setup instructions.

### Quick Start

1. Create a new Google Sheet
2. Go to Extensions → Apps Script
3. Copy the code files from this repository
4. Run the `setupSystem` function
5. Start using the system via the "Forex System" menu

## Customization

The system is highly customizable:

- Add/modify currencies
- Customize transaction types
- Adjust report formats
- Modify form layouts
- Change validation rules

## Advanced Features

### Transaction Settlements

The system can handle complex settlement scenarios:

- Split settlements across multiple payment methods
- Different currencies for payment legs
- Bank transfers and cash payments
- Swap transactions

### Currency Exchange Rates

Track and manage exchange rates with:

- Buy/sell rates for each transaction
- Swap rates for currency-to-currency exchanges
- Rate history tracking
- Rate analysis reports

### Automated Workflows

Save time with automated features:

- Automatic inventory updates
- Scheduled reports
- Email notifications
- Data validation checks

## Limitations and Considerations

- The system is designed for Google Sheets and requires internet connectivity
- Performance may be affected with very large transaction volumes (10,000+ records)
- Custom forms require Apps Script permissions
- Concurrent editing by multiple users is supported but may occasionally cause conflicts

## Contributing

Contributions to improve the system are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built using Google Apps Script
- Inspired by the needs of forex bureaus and currency exchange operations
- Special thanks to contributors and testers

---

For questions, support, or feature requests, please [open an issue](https://github.com/autom8or-com/forex-transaction-system/issues).
