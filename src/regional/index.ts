import { Fyo } from 'fyo';
import { createCzechRecords } from './cz/cz';
import { createIndianRecords } from './in/in';

export async function createRegionalRecords(country: string, fyo: Fyo) {
  if (country === 'Czech Republic') {
    await createCzechRecords(fyo);
  }

  if (country === 'India') {
    await createIndianRecords(fyo);
  }

  return;
}
