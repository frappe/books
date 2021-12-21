import fs from 'fs/promises';
import { getSavePath } from '../src/utils';

function templateToInnerText(innerHTML) {
  const temp = document.createElement('template');
  temp.innerHTML = innerHTML.trim();
  return temp.content.firstChild.innerText;
}

function csvFormat(value) {
  if (typeof value === 'string') {
    return `"${value}"`;
  } else if (value === null) {
    return '';
  } else if (typeof value === 'object') {
    const innerHTML = value.template;
    if (!innerHTML) return '';
    return csvFormat(templateToInnerText(innerHTML));
  }
  return value;
}

async function exportCsv(reportName, getReportData) {
  const { rows, columns } = getReportData();

  const { filePath, canceled } = await getSavePath(reportName, 'csv');
  if (canceled || !filePath) return;

  const fieldnames = columns.map(({ fieldname }) => fieldname);
  const labels = columns.map(({ label }) => csvFormat(label));
  const csvRows = [
    labels.join(','),
    ...rows.map((row) => fieldnames.map((f) => csvFormat(row[f])).join(',')),
  ];
  await fs.writeFile(filePath, csvRows.join('\n'));
}

async function exportJson(reportName, getReportData) {
  const { rows, columns } = getReportData();

  const { filePath, canceled } = await getSavePath(reportName, 'json');
  if (canceled || !filePath) return;
}

export default function getCommonExportActions(reportName) {
  return [
    {
      group: 'Export',
      label: 'CSV',
      type: 'primary',
      action: async (getReportData) => {
        await exportCsv(reportName, getReportData);
      },
    },
    {
      group: 'Export',
      label: 'JSON',
      type: 'primary',
      action: async (getReportData) => {
        await exportJson(reportName, getReportData);
      },
    },
  ];
}
