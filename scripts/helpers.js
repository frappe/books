function getIndexFormat(inp) {
  // converts:
  // ['This is an ', ,' interpolated ',' string.'] and
  // 'This is an ${variableA} interpolated ${variableB} string.'
  // to 'This is an ${0} interpolated ${1} string.'
  let string, snippets;
  if (typeof inp === 'string') {
    string = inp;
  } else if (inp instanceof Array) {
    snippets = inp;
  } else {
    throw new Error(`invalid input ${inp} of type ${typeof inp}`);
  }

  if (snippets === undefined) {
    snippets = getSnippets(string);
  }

  if (snippets.length === 1) {
    return snippets[0];
  }

  let str = '';
  snippets.forEach((s, i) => {
    if (i === snippets.length - 1) {
      str += s;
      return;
    }
    str += s + '${' + i + '}';
  });
  return str;
}

function getSnippets(string) {
  let start = 0;
  snippets = [...string.matchAll(/\${[^}]+}/g)].map((m) => {
    let end = m.index;
    let snip = string.slice(start, end);
    start = end + m[0].length;
    return snip;
  });

  snippets.push(string.slice(start));
  return snippets;
}

function getWhitespaceSanitized(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function getIndexList(s) {
  return [...s.matchAll(/\${([^}]+)}/g)].map(([_, i]) => parseInt(i));
}

function wrap(s) {
  return '`' + s + '`';
}

function splitCsvLine(line) {
  let t = true;
  const chars = [...line];
  const indices = chars
    .map((c, i) => {
      if (c === '`') {
        t = !t;
      }

      if (c === ',' && t) {
        return i;
      }

      return -1;
    })
    .filter((i) => i !== -1);

  let s = 0;
  const splits = indices.map((i) => {
    const split = line.slice(s, i);
    s = i + 1;
    return split.trim();
  });
  splits.push(line.slice(s).trim());
  return splits.filter((s) => s !== ',' && s !== '');
}

module.exports = {
  getIndexFormat,
  getWhitespaceSanitized,
  getSnippets,
  getIndexList,
  wrap,
  splitCsvLine,
};
