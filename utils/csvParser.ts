function unwrapDq(item: string): string {
  const s = item.at(0);
  const e = item.at(-1);
  if (s === '"' && e === '"') {
    return item.slice(1, -1);
  }

  return item;
}

function splitCsvBlock(text: string, splitter: string = '\r\n'): string[] {
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
  let rows = splitCsvBlock(text);
  if (rows.length === 1) {
    rows = splitCsvBlock(text, '\n');
  }
  return rows.map(splitCsvLine);
}
