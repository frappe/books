import { DocValue, DocValueMap } from 'fyo/core/types';
import { Verb } from 'fyo/telemetry/types';
import { Field } from 'schemas/types';
import { fyo } from 'src/initFyo';
import { getSavePath, saveData, showExportInFolder } from 'src/utils/ipcCalls';

interface JSONExport {
  columns: { fieldname: string; label: string }[];
  rows: Record<string, DocValue>[];
  filters: Record<string, string>;
  timestamp: string;
  reportName: string;
  softwareName: string;
  softwareVersion: string;
}

type GetReportData = () => {
  rows: DocValueMap[];
  columns: Field[];
  filters: Record<string, string>;
};

type TemplateObject = { template: string };

function templateToInnerText(innerHTML: string): string {
  const temp = document.createElement('template');
  temp.innerHTML = innerHTML.trim();
  // @ts-ignore
  return temp.content.firstChild!.innerText;
}

function deObjectify(value: TemplateObject | DocValue) {
  if (typeof value !== 'object') return value;
  if (value === null) return '';

  const innerHTML = (value as TemplateObject).template;
  if (!innerHTML) return '';
  return templateToInnerText(innerHTML);
}

function csvFormat(value: TemplateObject | DocValue): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  } else if (value === null) {
    return '';
  } else if (typeof value === 'object') {
    const innerHTML = (value as TemplateObject).template;

    if (!innerHTML) return '';
    return csvFormat(deObjectify(value as TemplateObject));
  }

  return String(value);
}

export async function exportCsv(
  rows: DocValueMap[],
  columns: Field[],
  filePath: string
) {
  const fieldnames = columns.map(({ fieldname }) => fieldname);
  const labels = columns.map(({ label }) => csvFormat(label));
  const csvRows = [
    labels.join(','),
    ...rows.map((row) =>
      fieldnames.map((f) => csvFormat(row[f] as DocValue)).join(',')
    ),
  ];

  saveExportData(csvRows.join('\n'), filePath);
}

async function exportJson(
  rows: DocValueMap[],
  columns: Field[],
  filePath: string,
  filters: Record<string, string>,
  reportName: string
) {
  const exportObject: JSONExport = {
    columns: [],
    rows: [],
    filters: {},
    timestamp: '',
    reportName: '',
    softwareName: '',
    softwareVersion: '',
  };
  const fieldnames = columns.map(({ fieldname }) => fieldname);

  exportObject.columns = columns.map(({ fieldname, label }) => ({
    fieldname,
    label,
  }));

  exportObject.rows = rows.map((row) =>
    fieldnames.reduce((acc, f) => {
      const value = row[f];
      if (value === undefined) {
        acc[f] = '';
      } else {
        acc[f] = deObjectify(value as DocValue | TemplateObject);
      }

      return acc;
    }, {} as Record<string, DocValue>)
  );

  exportObject.filters = Object.keys(filters)
    .filter((name) => filters[name] !== null && filters[name] !== undefined)
    .reduce((acc, name) => {
      acc[name] = filters[name];
      return acc;
    }, {} as Record<string, string>);

  exportObject.timestamp = new Date().toISOString();
  exportObject.reportName = reportName;
  exportObject.softwareName = 'Frappe Books';
  exportObject.softwareVersion = fyo.store.appVersion;

  await saveExportData(JSON.stringify(exportObject), filePath);
}

async function exportReport(
  extention: string,
  reportName: string,
  getReportData: GetReportData
) {
  const { rows, columns, filters } = getReportData();

  const { filePath, canceled } = await getSavePath(reportName, extention);
  if (canceled || !filePath) return;

  switch (extention) {
    case 'csv':
      await exportCsv(rows, columns, filePath);
      break;
    case 'json':
      await exportJson(rows, columns, filePath, filters, reportName);
      break;
    default:
      return;
  }

  fyo.telemetry.log(Verb.Exported, reportName, { extention });
}

export default function getCommonExportActions(reportName: string) {
  return ['csv', 'json'].map((ext) => ({
    group: fyo.t`Export`,
    label: ext.toUpperCase(),
    type: 'primary',
    action: async (getReportData: GetReportData) =>
      await exportReport(ext, reportName, getReportData),
  }));
}

export async function saveExportData(data: string, filePath: string) {
  await saveData(data, filePath);
  showExportInFolder(fyo.t`Export Successful`, filePath);
}
