import { Fyo } from 'fyo';
// EE: Estonian setup records (native regional pattern)
import { createEstonianRecords } from './ee/ee';
import { createIndianRecords } from './in/in';

export async function createRegionalRecords(country: string, fyo: Fyo) {
  if (country === 'India') {
    await createIndianRecords(fyo);
  } else if (country === 'Estonia') {
    // EE: Estonian setup records
    await createEstonianRecords(fyo);
  }

  return;
}
