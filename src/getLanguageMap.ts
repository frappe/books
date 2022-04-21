/**
 * Language files are fetched from the frappe/books repo
 * the language files before storage have a ISO timestamp
 * prepended to the file.
 *
 * This timestamp denotes the commit datetime, update of the file
 * takes place only if a new update has been pushed.
 */

const fs = require('fs/promises');
const path = require('path');
const fetch = require('node-fetch').default;

import { splitCsvLine } from 'utils/translationHelpers';
import { LanguageMap } from 'utils/types';

const VALENTINES_DAY = 1644796800000;

export async function getLanguageMap(
  code: string,
  isDevelopment: boolean = false
): Promise<LanguageMap> {
  const contents = await getContents(code, isDevelopment);
  return getMapFromContents(contents);
}

async function getContents(code: string, isDevelopment: boolean) {
  if (isDevelopment) {
    const filePath = path.resolve('translations', `${code}.csv`);
    const contents = await fs.readFile(filePath, { encoding: 'utf-8' });
    return ['', contents].join('\n');
  }

  let contents = await getContentsIfExists(code);
  if (contents.length === 0) {
    contents = (await fetchAndStoreFile(code)) ?? contents;
  } else {
    contents = (await getUpdatedContent(code, contents)) ?? contents;
  }

  if (!contents || contents.length === 0) {
    throwCouldNotFetchFile(code);
  }

  return contents;
}

function getMapFromContents(contents: string): LanguageMap {
  const lines: string[] = contents.split('\n').slice(1);
  return lines
    .map((l) => splitCsvLine(l) as string[])
    .filter((l) => l.length >= 2)
    .reduce((acc, l) => {
      const key = l[0].slice(1, -1);
      const translation = l[1].slice(1, -1);
      acc[key] = { translation };

      const context = l.slice(2)[0];
      if (context?.length) {
        acc[key].context = context;
      }

      return acc;
    }, {} as LanguageMap);
}

async function getContentsIfExists(code: string): Promise<string> {
  const filePath = getFilePath(code);
  try {
    return await fs.readFile(filePath, { encoding: 'utf-8' });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }

    return '';
  }
}

async function fetchAndStoreFile(code: string, date?: Date) {
  let res = await fetch(
    `https://api.github.com/repos/frappe/books/contents/translations/${code}.csv`
  );

  let contents: string | undefined = undefined;
  if (res.status === 200) {
    const resJson = await res.json();
    contents = Buffer.from(resJson.content, 'base64').toString();
  } else {
    res = await fetch(
      `https://raw.githubusercontent.com/frappe/books/master/translations/${code}.csv`
    );
  }

  if (!contents && res.status === 200) {
    contents = await res.text();
  }

  if (!date && contents) {
    date = await getLastUpdated(code);
  }

  if (contents) {
    contents = [date!.toISOString(), contents].join('\n');
    await storeFile(code, contents);
  }
  return contents;
}

async function getUpdatedContent(code: string, contents: string) {
  const { shouldUpdate, date } = await shouldUpdateFile(code, contents);
  if (!shouldUpdate) {
    return contents;
  }

  return await fetchAndStoreFile(code, date);
}

async function shouldUpdateFile(code: string, contents: string) {
  const date = await getLastUpdated(code);
  const oldDate = new Date(contents.split('\n')[0]);
  const shouldUpdate = date > oldDate || +oldDate === VALENTINES_DAY;

  return { shouldUpdate, date };
}

async function getLastUpdated(code: string): Promise<Date> {
  const url = `https://api.github.com/repos/frappe/books/commits?path=translations%2F${code}.csv&page=1&per_page=1`;
  const resJson = await fetch(url).then((res: Response) => res.json());

  try {
    return new Date(resJson[0].commit.author.date);
  } catch {
    return new Date(VALENTINES_DAY);
  }
}

function getFilePath(code: string) {
  return path.resolve(process.resourcesPath, 'translations', `${code}.csv`);
}

function throwCouldNotFetchFile(code: string) {
  throw new Error(`Could not fetch translations for '${code}'.`);
}

async function storeFile(code: string, contents: string) {
  const filePath = getFilePath(code);
  const dirname = path.dirname(filePath);
  await fs.mkdir(dirname, { recursive: true });
  await fs.writeFile(filePath, contents, { encoding: 'utf-8' });
}
