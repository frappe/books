import { DatabaseManager } from '../backend/database/manager';
import { ModelNameEnum } from '../models/types';

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

    if (loyaltyPrograms) {
      for (const program of loyaltyPrograms) {
        if (program.toDate && new Date(program.toDate) <= currentDate) {
          await dm.db?.knex!(ModelNameEnum.LoyaltyProgram)
            .where({ name: program.name })
            .update({
              status: 'Expired',
              isEnabled: false,
            });
        }
      }
    }

    const result = {
      timestamp: currentDate.toISOString(),
    };

    return result;
  } catch (error) {
    throw error;
  } finally {
    await dm.call('close');
  }
}

checkLoyaltyProgramExpiry().catch((error) => {
  throw error;
});
