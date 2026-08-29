import { Fyo } from 'fyo';

/**
 * Creates Czech Republic DPH (VAT) tax templates during company setup.
 *
 * Current Czech VAT rates:
 * - 21% Standard rate (most goods and services)
 * - 12% Reduced rate (food, passenger transport, medical, hotels, culture)
 * -  0% Exempt (financial services, insurance, postal, education, health)
 */
export async function createCzechRecords(fyo: Fyo) {
  await createTaxes(fyo);
}

async function createTaxes(fyo: Fyo) {
  const taxAccount = 'DPH';

  const taxes = [
    { name: 'DPH-21', rate: 21 },
    { name: 'DPH-12', rate: 12 },
    { name: 'DPH-0', rate: 0 },
    { name: 'Osvobozeno od DPH', rate: 0 },
  ];

  for (const { name, rate } of taxes) {
    const newTax = fyo.doc.getNewDoc('Tax', {
      name,
      details: [{ account: taxAccount, rate }],
    });
    await newTax.sync();
  }
}
