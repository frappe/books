export default async function initLibs(frappe) {
  const utils = await import('../utils');
  const format = await import('../utils/format');
  const errors = await import('./errors');
  const BaseMeta = await import('frappe/model/meta');
  const BaseDocument = await import('frappe/model/document');

  Object.assign(frappe, utils.default);
  Object.assign(frappe, format.default);
  frappe.errors = errors.default;
  frappe.BaseDocument = BaseDocument.default;
  frappe.BaseMeta = BaseMeta.default;
}
