export default async function initLibs(frappe) {
  const BaseMeta = await import('frappe/model/meta');
  const BaseDocument = await import('frappe/model/document');

  frappe.BaseDocument = BaseDocument.default;
  frappe.BaseMeta = BaseMeta.default;
}
