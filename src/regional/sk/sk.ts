import { Fyo } from 'fyo';

/**
 * Creates Slovak DPH (VAT) tax templates during company setup.
 *
 * Current Slovak VAT rates (effective 2025):
 * - 23% Standard rate (most goods and services)
 * - 19% First reduced rate (food, passenger transport, medical, hotels, culture)
 * -  5% Second reduced rate (basic foodstuffs, pharmaceuticals, books, periodicals)
 * -  0% Exempt (financial services, insurance, postal, education, health)
 */
export async function createSlovakRecords(fyo: Fyo) {
  await createTaxes(fyo);
}

async function createTaxes(fyo: Fyo) {
  const taxAccount = 'DPH';

  const taxes = [
    { name: 'DPH-23', rate: 23 },
    { name: 'DPH-19', rate: 19 },
    { name: 'DPH-5', rate: 5 },
    { name: 'Oslobodené od DPH', rate: 0 },
  ];

  for (const { name, rate } of taxes) {
    const newTax = fyo.doc.getNewDoc('Tax', {
      name,
      details: [{ account: taxAccount, rate }],
    });
    await newTax.sync();
  }
}
