import frappe from 'frappe';

function getTablesToConvert() {
  // Do not change loops to map, doesn't work for some reason.
  const toConvert = [];
  for (let key in frappe.models) {
    const model = frappe.models[key];

    const fieldsToConvert = [];
    for (let i in model.fields) {
      const field = model.fields[i];

      if (field.fieldtype === 'Currency') {
        fieldsToConvert.push(field.fieldname);
      }
    }

    if (fieldsToConvert.length > 0 && !model.isSingle && !model.basedOn) {
      toConvert.push({ name: key, fields: fieldsToConvert });
    }
  }

  return toConvert;
}

export default async function execute() {
  const toConvert = getTablesToConvert();
  for (let { name, fields } of toConvert) {
    const rows = await frappe.db.knex(name);
    const convertedRows = rows.map((row) => {
      for (let field of fields) {
        row[field] = frappe.pesa(row[field] ?? 0).store;
      }

      if ('numberFormat' in row) {
        delete row.numberFormat;
      }

      return row;
    });
    await frappe.db.prestigeTheTable(name, convertedRows);
  }
}
