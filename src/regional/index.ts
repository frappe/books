import { Fyo } from 'fyo';
import { createEstonianRecords } from './ee/ee';
import { createIndianRecords } from './in/in';

export async function createRegionalRecords(country: string, fyo: Fyo) {
  if (country === 'India') {
    await createIndianRecords(fyo);
  } else if (country === 'Estonia') {
    await createEstonianRecords(fyo);
  }

  return;
}
