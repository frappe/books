import frappe from 'frappe';

export type TaxType = 'GST' | 'IGST' | 'Exempt-GST' | 'Exempt-IGST';

export default async function generateTaxes(country: string) {
  if (country === 'India') {
    const GSTs = {
      GST: [28, 18, 12, 6, 5, 3, 0.25, 0],
      IGST: [28, 18, 12, 6, 5, 3, 0.25, 0],
      'Exempt-GST': [0],
      'Exempt-IGST': [0],
    };
    const newTax = await frappe.doc.getEmptyDoc('Tax');

    for (const type of Object.keys(GSTs)) {
      for (const percent of GSTs[type as TaxType]) {
        const name = `${type}-${percent}`;

        // Not cross checking cause hardcoded values.
        await frappe.db.delete('Tax', name);

        const details = getTaxDetails(type as TaxType, percent);
        await newTax.set({ name, details });
        await newTax.insert();
      }
    }
  }
}

function getTaxDetails(type: TaxType, percent: number) {
  if (type === 'GST') {
    return [
      {
        account: 'CGST',
        rate: percent / 2,
      },
      {
        account: 'SGST',
        rate: percent / 2,
      },
    ];
  } else {
    return [
      {
        account: type.toString().split('-')[0],
        rate: percent,
      },
    ];
  }
}
