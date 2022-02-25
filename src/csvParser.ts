function unwrapDq(item: string): string {
  const s = item.at(0);
  const e = item.at(-1);
  if (s === '"' && e === '"') {
    return item.slice(1, -1);
  }

  return item;
}

function splitCsvBlock(text: string): string[] {
  if (!text.endsWith('\r\n')) {
    text += '\r\n';
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

    if (!inDq && c === '\r' && text[i + 1] === '\n') {
      lines.push(line);
      line = '';
      i = i + 1;
      continue;
    }

    line += c;
  }

  return lines;
}

function splitCsvLine(line: string): string[] {
  if (line.at(-1) !== ',') {
    // if conforming to spec, it should not end with ','
    line += ',';
  }

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

export function parseCSV(text: string): string[][] {
  //  Works on RFC 4180
  const rows = splitCsvBlock(text);
  return rows.map(splitCsvLine);
}
