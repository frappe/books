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
const fetch = require('node-fetch');
const { splitCsvLine } = require('../scripts/helpers');

async function getLanguageMap(code, isDevelopment = false) {
  const contents = await getContents(code, isDevelopment);
  return getMapFromContents(contents);
}

async function getContents(code, isDevelopment) {
  if (isDevelopment) {
    const filePath = path.resolve('..', 'translations', `${code}.csv`);
    return await fs.readFile(filePath);
  }

  let contents = await getContentsIfExists();
  if (contents.length === 0) {
    contents = await fetchAndStoreFile(code);
  } else {
    contents = await getUpdatedContent(code, contents);
  }

  return contents;
}

function getMapFromContents(contents) {
  contents = contents.split('\n').slice(1);
  return contents
    .map(splitCsvLine)
    .filter((l) => l.length >= 2)
    .reduce((acc, l) => {
      const key = l[0].slice(1, -1);
      const translation = l[1].slice(1, -1);
      acc[key] = { translation };

      const context = l.slice(2);
      if (context.length) {
        acc.context = context;
      }

      return acc;
    }, {});
}

await function getContentsIfExists(code) {
  const filePath = getFilePath(code);
  try {
    return await fs.readFile(filePath, { encoding: 'utf-8' });
  } catch (err) {
    if (err.errno !== -2) {
      throw err;
    }

    return '';
  }
};

async function fetchAndStoreFile(code, date) {
  const url = `https://api.github.com/repos/frappe/books/contents/translations/${code}.csv`;
  const res = await fetch(url);
  if (res.status !== 200) {
    throwTranslationFileNotFound(code);
  }

  const resJson = await res.json();
  let contents = Buffer.from(resJson.content, 'base64').toString();
  contents = [date.toISOString(), contents].join('\n');

  await storeFile(code, content);
  return contents;
}

async function getUpdatedContent(code, contents) {
  const [shouldUpdate, date] = await shouldUpdateFile(code, contents);
  if (!shouldUpdate) {
    return contents;
  }

  return await fetchAndStoreFile(code, date);
}

async function shouldUpdateFile(code, contents) {
  const date = await getLastUpdated(code);
  const oldDate = new Date(contents.split('\n')[0]);
  return [date > oldDate, date];
}

async function getLastUpdated(code) {
  const url = `https://api.github.com/repos/frappe/books/commits?path=translations%2F${code}.csv&page=1&per_page=1`;
  let resJson;
  resJson = await fetch(url).then((res) => res.json());

  if (res.Json.length === 0) {
    throwTranslationFileNotFound(code);
  }

  return new Date(resJson[0].commit.author.date);
}

function getFilePath(code) {
  return path.resolve(process.resourcesPath, 'translations', `${code}.csv`);
}

function throwTranslationFileNotFound(code) {
  throw new Error(`translation file not found for ${code}`);
}

async function storeFile(contents, code) {
  const filePath = getFilePath(code);
  await fs.writeFile(filePath, contents, { encoding: 'utf-8' });
}

module.exports = { getLanguageMap };
