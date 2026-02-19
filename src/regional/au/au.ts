import { Fyo } from 'fyo';

/**
 * Creates Australian GST (Goods and Services Tax) templates during setup.
 *
 * Current Australian GST rates:
 * - 10% Standard rate (most goods and services)
 * -  0% GST-Free (basic food, health, education, exports)
 */
export async function createAustralianRecords(fyo: Fyo) {
  await createTaxes(fyo);
}

async function createTaxes(fyo: Fyo) {
  const taxAccount = 'GST';

  const taxes = [
    { name: 'GST-10', rate: 10 },
    { name: 'GST-Free', rate: 0 },
  ];

  for (const { name, rate } of taxes) {
    const newTax = fyo.doc.getNewDoc('Tax', {
      name,
      details: [{ account: taxAccount, rate }],
    });
    await newTax.sync();
  }
}
