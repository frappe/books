import { Fyo } from 'fyo';
import { createCzechRecords } from './cz/cz';
import { createIndianRecords } from './in/in';
import { createSlovakRecords } from './sk/sk';

export async function createRegionalRecords(country: string, fyo: Fyo) {
  if (country === 'Czech Republic') {
    await createCzechRecords(fyo);
  }

  if (country === 'India') {
    await createIndianRecords(fyo);
  }

  if (country === 'Slovakia') {
    await createSlovakRecords(fyo);
  }

  return;
}
