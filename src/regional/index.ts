import { Fyo } from 'fyo';
import { createAustralianRecords } from './au/au';
import { createIndianRecords } from './in/in';

export async function createRegionalRecords(country: string, fyo: Fyo) {
  if (country === 'Australia') {
    await createAustralianRecords(fyo);
  }

  if (country === 'India') {
    await createIndianRecords(fyo);
  }

  return;
}
