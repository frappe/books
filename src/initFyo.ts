import { Fyo } from 'fyo';
import { getRegionalModels, models } from 'models';

export const fyo = new Fyo({ isTest: false, isElectron: true });

export async function initializeModels(dbPath: string, countryCode?: string) {
  if (countryCode) {
    countryCode = await fyo.db.createNewDatabase(dbPath, countryCode);
  } else {
    countryCode = await fyo.db.connectToDatabase(dbPath);
  }

  const regionalModels = await getRegionalModels(countryCode);
  await fyo.initializeAndRegister(models, regionalModels);
}
