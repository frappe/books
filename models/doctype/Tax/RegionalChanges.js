module.exports = async function generateTaxes(country) {
  if (country === 'India') {
    const GSTs = {
      GST: [28, 18, 12, 6, 5, 3, 0.25, 0],
      IGST: [28, 18, 12, 6, 5, 3, 0.25, 0],
      'Exempt-GST': [0],
      'Exempt-IGST': [0]
    };
    let newTax = await frappe.getNewDoc('Tax');
    for (const type of Object.keys(GSTs)) {
      for (const percent of GSTs[type]) {
        if (type === 'GST') {
          await newTax.set({
            name: `${type}-${percent}`,
            details: [
              {
                account: 'CGST',
                rate: percent / 2
              },
              {
                account: 'SGST',
                rate: percent / 2
              }
            ]
          });
        } else {
          await newTax.set({
            name: `${type}-${percent}`,
            details: [
              {
                account: type.toString().split('-')[0],
                rate: percent
              }
            ]
          });
        }
        await newTax.insert();
      }
    }
  }
};
