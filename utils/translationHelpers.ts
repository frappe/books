/**
 * Properties of a schema which are to be translated,
 * irrespective of nesting.
 */
export const schemaTranslateables = [
  'label',
  'description',
  'placeholder',
  'section',
  'tab',
];

export function getIndexFormat(inp: string | string[]) {
  /**
   * converts:
   * ['This is an ', ,' interpolated ',' string.'] and
   * 'This is an ${variableA} interpolated ${variableB} string.'
   * to 'This is an ${0} interpolated ${1} string.'
   */

  let string: string | undefined = undefined;
  let snippets: string[] | undefined = undefined;

  if (typeof inp === 'string') {
    string = inp;
  } else if (inp instanceof Array) {
    snippets = inp;
  } else {
    throw new Error(`invalid input ${inp} of type ${typeof inp}`);
  }

  if (snippets === undefined) {
    snippets = getSnippets(string as string);
  }

  if (snippets.length === 1) {
    return snippets[0];
  }

  let str = '';
  snippets.forEach((s, i) => {
    if (i === snippets!.length - 1) {
      str += s;
      return;
    }
    str += s + '${' + i + '}';
  });

  return str;
}

export function getSnippets(str: string) {
  let start = 0;
  const snippets = [...str.matchAll(/\${[^}]+}/g)].map((m) => {
    const end = m.index;
    if (end === undefined) {
      return '';
    }
    const snip = str.slice(start, end);
    start = end + m[0].length;
    return snip;
  });

  snippets.push(str.slice(start));
  return snippets;
}

export function getWhitespaceSanitized(str: string) {
  return str.replace(/\s+/g, ' ').trim();
}

export function getIndexList(str: string) {
  return [...str.matchAll(/\${([^}]+)}/g)].map(([_, i]) => parseInt(i));
}
