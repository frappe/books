import { DatabaseManager } from '../../database/manager';

/* eslint-disable */
async function execute(dm: DatabaseManager) {

    const sourceTables = [
        "PurchaseInvoice", 
        "SalesInvoice", 
        "JournalEntry",
        "Payment", 
        "StockMovement", 
        "StockTransfer"
    ];

    await dm.db!.knex!('AccountingLedgerEntry')
        .select('name', 'date', 'referenceName')
        .then((trx: Array<{name: string; date: Date; referenceName: string;}> ) => {
            trx.forEach(async entry => {

                sourceTables.forEach(async table => {
                    await dm.db!.knex!
                    .select('name','date')
                    .from(table)
                    .where({ name: entry['referenceName'] })
                    .then(async (resp: Array<{name: string; date: Date;}>) => {
                        if (resp.length !== 0) {
                            
                            const dateTimeValue = new Date(resp[0]['date']);
                            await dm.db!.knex!('AccountingLedgerEntry')
                            .where({ name: entry['name'] })
                            .update({ date: dateTimeValue.toISOString() });
                        }
                    })
                });
            });
        });
}

export default { execute, beforeMigrate: true };
/* eslint-enable */