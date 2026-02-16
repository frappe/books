import { Fyo } from 'fyo';

/**
 * Creates New Zealand GST (Goods and Services Tax) templates during setup.
 *
 * Current New Zealand GST rates:
 * - 15% Standard rate (most goods and services)
 * -  9% Reduced rate (long-term accommodation, 28+ days)
 * -  0% Zero-rated (exports, international services)
 * -  0% Exempt (financial services, residential rent)
 */
export async function createNewZealandRecords(fyo: Fyo) {
  await createTaxes(fyo);
}

async function createTaxes(fyo: Fyo) {
  const taxAccount = 'GST';

  const taxes = [
    { name: 'GST-15', rate: 15 },
    { name: 'GST-9', rate: 9 },
    { name: 'GST-0', rate: 0 },
    { name: 'GST-Exempt', rate: 0 },
  ];

  for (const { name, rate } of taxes) {
    const newTax = fyo.doc.getNewDoc('Tax', {
      name,
      details: [{ account: taxAccount, rate }],
    });
    await newTax.sync();
  }
}
