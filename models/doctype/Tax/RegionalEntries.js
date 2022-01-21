import frappe from 'frappe';

export default async function generateTaxes(country) {
  if (country === 'India') {
    const GSTs = {
      GST: [28, 18, 12, 6, 5, 3, 0.25, 0],
      IGST: [28, 18, 12, 6, 5, 3, 0.25, 0],
      'Exempt-GST': [0],
      'Exempt-IGST': [0],
    };
    let newTax = await frappe.getNewDoc('Tax');

    for (const type of Object.keys(GSTs)) {
      for (const percent of GSTs[type]) {
        const name = `${type}-${percent}`;

        // Not cross checking cause hardcoded values.
        await frappe.db.knex('Tax').where({ name }).del();
        await frappe.db.knex('TaxDetail').where({ parent: name }).del();

        const details = getTaxDetails(type, percent);
        await newTax.set({ name, details });
        await newTax.insert();
      }
    }
  }
}

function getTaxDetails(type, percent) {
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
