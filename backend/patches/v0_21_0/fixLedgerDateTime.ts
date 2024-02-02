import { DatabaseManager } from '../../database/manager';

/* eslint-disable */
async function execute(dm: DatabaseManager) {
    await dm.db!.knex!('AccountingLedgerEntry')
        .select('name', 'date')
        .then((trx: Array<{name: string; date: Date;}> ) => {
            trx.forEach(async entry => {
                const entryDate = new Date(entry['date']);
                const timeZoneOffset = entryDate.getTimezoneOffset();
                const offsetMinutes = timeZoneOffset % 60;
                const offsetHours = (timeZoneOffset - offsetMinutes) / 60;

                let daysToAdd = 0; // If behind or at GMT/Zulu time, don't need to add a day
                if (timeZoneOffset < 0) {
                    // If ahead of GMT/Zulu time, need to advance a day forward first
                    daysToAdd = 1; 
                }

                entryDate.setDate(entryDate.getDate() + daysToAdd);
                entryDate.setHours(0 - offsetHours);
                entryDate.setMinutes(0 - offsetMinutes);
                entryDate.setSeconds(0);
                entryDate.setMilliseconds(0);

                await dm.db!.knex!('AccountingLedgerEntry')
                    .where({ name: entry['name'] })
                    .update({ date: entryDate.toISOString() });
            });
        });
}

export default { execute, beforeMigrate: true };
/* eslint-enable */