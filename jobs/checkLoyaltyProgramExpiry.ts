import { DatabaseManager } from '../backend/database/manager';
import { ModelNameEnum } from '../models/types';

export async function checkLoyaltyProgramExpiry() {
  const dm = new DatabaseManager();

  try {
    const currentDate = new Date();

    const loyaltyPrograms = await dm.db?.getAll(ModelNameEnum.LoyaltyProgram, {
      fields: ['name', 'toDate', 'status', 'isEnabled', 'maximumUse', 'used'],
      filters: {
        status: ['not in', ['Expired', 'Maxed']],
        isEnabled: true,
      },
    });

    if (loyaltyPrograms) {
      for (const program of loyaltyPrograms) {
        const maximumUse = Number(program.maximumUse) || 0;
        const used = Number(program.used) || 0;

        if (maximumUse > 0 && used >= maximumUse) {
          await dm.db?.knex!(ModelNameEnum.LoyaltyProgram)
            .where({ name: program.name })
            .update({
              status: 'Maxed',
              isEnabled: false,
            });
          continue;
        }

        if (program.toDate && new Date(String(program.toDate)) <= currentDate) {
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
