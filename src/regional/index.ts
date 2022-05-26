import { Fyo } from 'fyo';
import { createIndianRecords } from './in/in';

export async function createRegionalRecords(country: string, fyo: Fyo) {
  if (country === 'India') {
    await createIndianRecords(fyo);
  }

  return;
}
