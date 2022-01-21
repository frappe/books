import frappe from 'frappe';
import importCharts from '../accounting/importCOA';
import registerReportMethods from '../reports';

export default function registerServerMethods() {
  registerReportMethods();

  frappe.registerMethod({
    method: 'import-coa',
    async handler() {
      await importCharts();
    },
  });
}
