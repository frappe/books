import { createIndianRecords } from './in/in';

export async function createRegionalRecords(country: string) {
  if (country === 'India') {
    await createIndianRecords();
  }

  return;
}
