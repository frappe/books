import { Fyo, t } from 'fyo';
import { Action } from 'fyo/model/types';
import { Verb } from 'fyo/telemetry/types';
import { getSavePath, saveData, showExportInFolder } from 'src/utils/ipcCalls';
import { getIsNullOrUndef } from 'utils';
import { generateCSV } from 'utils/csvParser';
import { Report } from './Report';
import { ExportExtention, ReportCell } from './types';

interface JSONExport {
  columns: { fieldname: string; label: string }[];
  rows: Record<string, unknown>[];
  filters: Record<string, string>;
  timestamp: string;
  reportName: string;
  softwareName: string;
  softwareVersion: string;
}

export default function getCommonExportActions(report: Report): Action[] {
  const exportExtention = ['csv', 'json'] as ExportExtention[];

  return exportExtention.map((ext) => ({
    group: t`Export`,
    label: ext.toUpperCase(),
    type: 'primary',
    action: async () => {
      await exportReport(ext, report);
    },
  }));
}

async function exportReport(extention: ExportExtention, report: Report) {
  const { filePath, canceled } = await getSavePath(
    report.reportName,
    extention
  );

  if (canceled || !filePath) {
    return;
  }

  let data = '';

  if (extention === 'csv') {
    data = getCsvData(report);
  } else if (extention === 'json') {
    data = getJsonData(report);
  }

  if (!data.length) {
    return;
  }

  await saveExportData(data, filePath);
  report.fyo.telemetry.log(Verb.Exported, report.reportName, { extention });
}

function getJsonData(report: Report): string {
  const exportObject: JSONExport = {
    columns: [],
    rows: [],
    filters: {},
    timestamp: '',
    reportName: '',
    softwareName: '',
    softwareVersion: '',
  };

  const columns = report.columns;
  const displayPrecision =
    (report.fyo.singles.SystemSettings?.displayPrecision as number) ?? 2;

  /**
   * Set columns as list of fieldname, label
   */
  exportObject.columns = columns.map(({ fieldname, label }) => ({
    fieldname,
    label,
  }));

  /**
   * Set rows as fieldname: value map
   */
  for (const row of report.reportData) {
    if (row.isEmpty) {
      continue;
    }

    const rowObj: Record<string, unknown> = {};
    for (const c in row.cells) {
      const { label } = columns[c];
      const cell = getValueFromCell(row.cells[c], displayPrecision);
      rowObj[label] = cell;
    }

    exportObject.rows.push(rowObj);
  }

  /**
   * Set filter map
   */
  for (const { fieldname } of report.filters) {
    const value = report.get(fieldname);
    if (getIsNullOrUndef(value)) {
      continue;
    }

    exportObject.filters[fieldname] = String(value);
  }

  /**
   * Metadata
   */
  exportObject.timestamp = new Date().toISOString();
  exportObject.reportName = report.reportName;
  exportObject.softwareName = 'Frappe Books';
  exportObject.softwareVersion = report.fyo.store.appVersion;

  return JSON.stringify(exportObject);
}

export function getCsvData(report: Report): string {
  const csvMatrix = convertReportToCSVMatrix(report);
  return generateCSV(csvMatrix);
}

function convertReportToCSVMatrix(report: Report): unknown[][] {
  const displayPrecision =
    (report.fyo.singles.SystemSettings?.displayPrecision as number) ?? 2;
  const reportData = report.reportData;
  const columns = report.columns!;

  const csvdata: unknown[][] = [];
  csvdata.push(columns.map((c) => c.label));
  for (const row of reportData) {
    if (row.isEmpty) {
      csvdata.push(Array(row.cells.length).fill(''));
      continue;
    }

    const csvrow: unknown[] = [];
    for (const c in row.cells) {
      const cell = getValueFromCell(row.cells[c], displayPrecision);
      csvrow.push(cell);
    }

    csvdata.push(csvrow);
  }

  return csvdata;
}

function getValueFromCell(cell: ReportCell, displayPrecision: number) {
  const rawValue = cell.rawValue;

  if (rawValue instanceof Date) {
    return rawValue.toISOString();
  }

  if (typeof rawValue === 'number') {
    const value = rawValue.toFixed(displayPrecision);

    /**
     * remove insignificant zeroes
     */
    if (value.endsWith('0'.repeat(displayPrecision))) {
      return value.slice(0, -displayPrecision - 1);
    }

    return value;
  }

  if (getIsNullOrUndef(cell)) {
    return '';
  }

  return rawValue;
}

export async function saveExportData(
  data: string,
  filePath: string,
  message?: string
) {
  await saveData(data, filePath);
  message ??= t`Export Successful`;
  showExportInFolder(message, filePath);
}
