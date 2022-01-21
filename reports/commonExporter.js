import frappe from 'frappe';
import { getSavePath, saveData, showExportInFolder } from '../src/utils';

function templateToInnerText(innerHTML) {
  const temp = document.createElement('template');
  temp.innerHTML = innerHTML.trim();
  return temp.content.firstChild.innerText;
}

function deObjectify(value) {
  if (typeof value !== 'object') return value;
  if (value === null) return '';

  const innerHTML = value.template;
  if (!innerHTML) return '';
  return templateToInnerText(innerHTML);
}

function csvFormat(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  } else if (value === null) {
    return '';
  } else if (typeof value === 'object') {
    const innerHTML = value.template;
    if (!innerHTML) return '';
    return csvFormat(deObjectify(value));
  }
  return value;
}

export async function exportCsv(rows, columns, filePath) {
  const fieldnames = columns.map(({ fieldname }) => fieldname);
  const labels = columns.map(({ label }) => csvFormat(label));
  const csvRows = [
    labels.join(','),
    ...rows.map((row) => fieldnames.map((f) => csvFormat(row[f])).join(',')),
  ];

  saveExportData(csvRows.join('\n'), filePath);
}

async function exportJson(rows, columns, filePath, filters, reportName) {
  const exportObject = {};
  const fieldnames = columns.map(({ fieldname }) => fieldname);

  exportObject.columns = columns.map(({ fieldname, label }) => ({
    fieldname,
    label,
  }));

  exportObject.rows = rows.map((row) =>
    fieldnames.reduce((acc, f) => {
      acc[f] = deObjectify(row[f]);
      return acc;
    }, {})
  );

  exportObject.filters = Object.keys(filters)
    .filter((name) => filters[name] !== null && filters[name] !== undefined)
    .reduce((acc, name) => {
      acc[name] = filters[name];
      return acc;
    }, {});

  exportObject.timestamp = new Date().toISOString();
  exportObject.reportName = reportName;
  exportObject.softwareName = 'Frappe Books';
  exportObject.softwareVersion = frappe.store.appVersion;

  await saveExportData(JSON.stringify(exportObject), filePath);
}

async function exportReport(extention, reportName, getReportData) {
  const { rows, columns, filters } = getReportData();

  const { filePath, canceled } = await getSavePath(reportName, extention);
  if (canceled || !filePath) return;

  switch (extention) {
    case 'csv':
      await exportCsv(rows, columns, filePath);
      return;
    case 'json':
      await exportJson(rows, columns, filePath, filters, reportName);
      return;
    default:
      return;
  }
}

export default function getCommonExportActions(reportName) {
  return ['csv', 'json'].map((ext) => ({
    group: 'Export',
    label: ext.toUpperCase(),
    type: 'primary',
    action: async (getReportData) =>
      await exportReport(ext, reportName, getReportData),
  }));
}

export async function saveExportData(data, filePath) {
  await saveData(data, filePath);
  showExportInFolder(frappe._('Export Successful'), filePath);
}
