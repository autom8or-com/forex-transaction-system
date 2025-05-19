# Files to Delete After Refactoring

After the refactoring is complete and the new modular code structure has been fully tested and merged, the following files can be safely deleted as their functionality has been consolidated into the new namespaced modules:

## Form Handlers
- `FormHandlers-Settlement.gs` - Consolidated into `FOREX.Forms.gs`
- `processSettlementForm.gs` - Consolidated into `FOREX.Forms.gs`

## Inventory Management
- `InventoryManager.gs` - Consolidated into `FOREX.Inventory.gs`

## Transaction Processing
The following files will be obsolete once the new code structure is fully implemented and tested:

- Original form handling functions in `FormHandlers.gs` 
- Original code in `TransactionProcessor.gs`
- Original inventory management functions in `Main.gs`

Note: Do not delete these files until all functionality has been properly migrated, tested, and the new code is working as expected in production.

## Migration Strategy

1. Implement and test all functionality in the new namespaced modules
2. Update all references to use the new namespaced functions
3. Create a backup of the original files
4. Delete the obsolete files once everything is functioning correctly

## Conflict Resolution

If during deletion, there are conflicts or issues that arise:

1. Immediately stop the deletion process
2. Check the logs for any functions that might still be referencing the deleted files
3. Update those references to use the new namespaced versions
4. Resume the deletion process once all references have been updated
