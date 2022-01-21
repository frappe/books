import frappe from 'frappe';

async function setAugmentedModel(model, regionalInfo) {
  const getAugmentedModel = (
    await import('./doctype/' + model + '/RegionalChanges')
  ).default;
  const augmentedModel = getAugmentedModel(regionalInfo);
  frappe.models[model] = augmentedModel;
  frappe.models[model].augmented = 1;
}

export default async function regionalModelUpdates(regionalInfo) {
  for (let model in frappe.models) {
    const { regional, basedOn, augmented } = frappe.models[model];
    if (!regional || basedOn || augmented) {
      continue;
    }
    await setAugmentedModel(model, regionalInfo);
  }
}
