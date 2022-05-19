/**
 * Language files are packaged into the binary, if
 * newer files are available (if internet available)
 * then those will replace the current file.
 *
 * Language files are fetched from the frappe/books repo
 * the language files before storage have a ISO timestamp
 * prepended to the file.
 *
 * This timestamp denotes the commit datetime, update of the file
 * takes place only if a new update has been pushed.
 */

import { constants } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { splitCsvLine } from 'utils/translationHelpers';
import { LanguageMap } from 'utils/types';

const fetch = require('node-fetch').default;

const VALENTINES_DAY = 1644796800000;

export async function getLanguageMap(code: string): Promise<LanguageMap> {
  const contents = await getContents(code);
  return getMapFromContents(contents);
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

async function getContents(code: string) {
  let contents = await getContentsIfExists(code);
  if (contents.length === 0) {
    contents = (await fetchAndStoreFile(code)) || contents;
  } else {
    contents = (await getUpdatedContent(code, contents)) || contents;
  }

  if (!contents || contents.length === 0) {
    throwCouldNotFetchFile(code);
  }

  return contents;
}

async function getContentsIfExists(code: string): Promise<string> {
  const filePath = await getTranslationFilePath(code);
  if (!filePath) {
    return '';
  }

  return await fs.readFile(filePath, { encoding: 'utf-8' });
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

async function getTranslationFilePath(code: string) {
  let filePath = path.join(
    process.resourcesPath,
    `../translations/${code}.csv`
  );

  try {
    await fs.access(filePath, constants.R_OK);
  } catch {
    /**
     * This will be used for in Development mode
     */
    filePath = path.join(__dirname, `../translations/${code}.csv`);
  }

  try {
    await fs.access(filePath, constants.R_OK);
  } catch {
    return '';
  }

  return filePath;
}

function throwCouldNotFetchFile(code: string) {
  throw new Error(`Could not fetch translations for '${code}'.`);
}

async function storeFile(code: string, contents: string) {
  const filePath = await getTranslationFilePath(code);
  if (!filePath) {
    return;
  }

  const dirname = path.dirname(filePath);
  await fs.mkdir(dirname, { recursive: true });
  await fs.writeFile(filePath, contents, { encoding: 'utf-8' });
}
