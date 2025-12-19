import { parentPort } from 'worker_threads';
import { DatabaseManager } from '../backend/database/manager';
import { ModelNameEnum } from '../models/types';

if (parentPort) {
  parentPort.postMessage({ type: 'check-loyalty-program-expiry' });
}

export async function checkLoyaltyProgramExpiry() {
  const dm = new DatabaseManager();

  try {
    const currentDate = new Date();

    const loyaltyPrograms = (await dm.db?.getAll(ModelNameEnum.LoyaltyProgram, {
      fields: ['name', 'toDate', 'status', 'isEnabled'],
      filters: {
        status: ['!=', 'Expired'],
        isEnabled: true,
      },
    })) as Array<{
      name: string;
      toDate: string;
      status: string;
      isEnabled: boolean;
    }>;

    let expiredCount = 0;
    let processedCount = 0;

    if (loyaltyPrograms) {
      for (const program of loyaltyPrograms) {
        processedCount++;

        if (program.toDate && new Date(program.toDate) <= currentDate) {
          await dm.db?.knex!(ModelNameEnum.LoyaltyProgram)
            .where({ name: program.name })
            .update({
              status: 'Expired',
              isEnabled: false,
            });

          expiredCount++;
        }
      }
    }

    const result = {
      timestamp: currentDate.toISOString(),
      processedPrograms: processedCount,
      expiredPrograms: expiredCount,
      message: `Loyalty program expiry check completed. ${expiredCount} programs expired out of ${processedCount} processed.`,
    };

    if (parentPort) {
      parentPort.postMessage({
        type: 'loyalty-program-expiry-complete',
        data: result,
      });
    }

    return result;
  } catch (error) {
    const errorResult = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Loyalty program expiry check failed',
    };

    if (parentPort) {
      parentPort.postMessage({
        type: 'loyalty-program-expiry-error',
        data: errorResult,
      });
    }

    throw error;
  } finally {
    await dm.call('close');
  }
}

checkLoyaltyProgramExpiry().catch((error) => {
  const errorResult = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : 'Unknown error',
    message: 'Loyalty program expiry check failed',
  };

  if (parentPort) {
    parentPort.postMessage({
      type: 'loyalty-program-expiry-error',
      data: errorResult,
    });
  }
});
