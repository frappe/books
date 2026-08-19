export function parseCSV(text: string): string[][] {
  //  Works on RFC 4180 csv
  let rows = splitCsvBlock(text);
  if (rows.length === 1) {
    rows = splitCsvBlock(text, '\n');
  }
  return rows.map(splitCsvLine);
}

export function generateCSV(matrix: unknown[][]): string {
  // Generates RFC 4180 csv
  const formattedRows = getFormattedRows(matrix);
  return formattedRows.join('\r\n');
}

function splitCsvBlock(text: string, splitter = '\r\n'): string[] {
  if (!text.endsWith(splitter)) {
    text += splitter;
  }
  const lines = [];
  let line = '';
  let inDq = false;

  for (let i = 0; i <= text.length; i++) {
    const c = text[i];

    if (
      c === '"' &&
      ((c[i + 1] === '"' && c[i + 2] === '"') || c[i + 1] !== '"')
    ) {
      inDq = !inDq;
    }

    const isEnd = [...splitter]
      .slice(1)
      .map((s, j) => text[i + j + 1] === s)
      .every(Boolean);

    if (!inDq && c === splitter[0] && isEnd) {
      lines.push(line);
      line = '';
      i = i + splitter.length - 1;
      continue;
    }

    line += c;
  }

  return lines;
}

export function splitCsvLine(line: string): string[] {
  line += ',';

  const items = [];
  let item = '';
  let inDq = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (
      c === '"' &&
      ((c[i + 1] === '"' && c[i + 2] === '"') || c[i + 1] !== '"')
    ) {
      inDq = !inDq;
    }

    if (!inDq && c === ',') {
      item = unwrapDq(item);
      item = item.replaceAll('""', '"');
      items.push(item);
      item = '';
      continue;
    }

    item += c;
  }

  return items;
}

function unwrapDq(item: string): string {
  const s = item.at(0);
  const e = item.at(-1);
  if (s === '"' && e === '"') {
    return item.slice(1, -1);
  }

  return item;
}

function getFormattedRows(matrix: unknown[][]): string[] {
  const formattedMatrix: string[] = [];
  for (const row of matrix) {
    const formattedRow: string[] = [];
    for (const item of row) {
      const formattedItem = getFormattedItem(item);
      formattedRow.push(formattedItem);
    }
    formattedMatrix.push(formattedRow.join(','));
  }

  return formattedMatrix;
}

function getFormattedItem(item: unknown): string {
  if (typeof item === 'string') {
    return formatStringToCSV(item);
  }

  if (item === null || item === undefined) {
    return '';
  }

  if (typeof item === 'object') {
    return item.toString();
  }

  return String(item);
}

function formatStringToCSV(item: string): string {
  let shouldDq = false;
  if (item.match(/^".*"$/)) {
    shouldDq = true;
    item = item.slice(1, -1);
  }

  if (item.match(/"/)) {
    shouldDq = true;
    item = item.replaceAll('"', '""');
  }

  if (item.match(/,|\s/)) {
    shouldDq = true;
  }

  if (shouldDq) {
    return '"' + item + '"';
  }

  return item;
}
