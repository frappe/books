/**
 * General purpose utils used by the frontend.
 */
import Doc from 'fyo/model/doc';
import { isPesa } from 'fyo/utils';
import Money from 'pesa/dist/types/src/money';
import { fyo } from 'src/initFyo';

export function stringifyCircular(
  obj: unknown,
  ignoreCircular: boolean = false,
  convertDocument: boolean = false
) {
  const cacheKey: string[] = [];
  const cacheValue: unknown[] = [];

  return JSON.stringify(obj, (key, value) => {
    if (typeof value !== 'object' || value === null) {
      cacheKey.push(key);
      cacheValue.push(value);
      return value;
    }

    if (cacheValue.includes(value)) {
      const circularKey = cacheKey[cacheValue.indexOf(value)] || '{self}';
      return ignoreCircular ? undefined : `[Circular:${circularKey}]`;
    }

    cacheKey.push(key);
    cacheValue.push(value);

    if (convertDocument && value instanceof Doc) {
      return value.getValidDict();
    }

    return value;
  });
}

export function fuzzyMatch(keyword: string, candidate: string) {
  const keywordLetters = [...keyword];
  const candidateLetters = [...candidate];

  let keywordLetter = keywordLetters.shift();
  let candidateLetter = candidateLetters.shift();

  let isMatch = true;
  let distance = 0;

  while (keywordLetter && candidateLetter) {
    if (keywordLetter.toLowerCase() === candidateLetter.toLowerCase()) {
      keywordLetter = keywordLetters.shift();
    } else {
      distance += 1;
    }

    candidateLetter = candidateLetters.shift();
  }

  if (keywordLetter !== undefined) {
    distance = -1;
    isMatch = false;
  } else {
    distance += candidateLetters.length;
  }

  return { isMatch, distance };
}

export function formatXLabels(label: string) {
  // Format: Mmm YYYY -> Mm YY
  const splits = label.split(' ');
  const month = splits[0];
  const year = splits[1].slice(2);

  return `${month} ${year}`;
}

export function convertPesaValuesToFloat(obj: Record<string, unknown>) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (!isPesa(value)) {
      return;
    }

    obj[key] = (value as Money).float;
  });
}

export async function getIsSetupComplete() {
  try {
    const { setupComplete } = await fyo.doc.getSingle('AccountingSettings');
    return !!setupComplete;
  } catch {
    return false;
  }
}
