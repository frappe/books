const fs = require('fs/promises');
const path = require('path');
const {
  getIndexFormat,
  getWhitespaceSanitized,
  wrap,
  splitCsvLine,
} = require('./helpers');

const translationsFolder = path.resolve(__dirname, '..', 'translations');
const PATTERN = /(?<!\w)t`([^`]+)`/g;

function shouldIgnore(p, ignoreList) {
  return ignoreList.includes(p.split(path.sep).at(-1));
}

async function getFileList(root, ignoreList) {
  const contents = await fs.readdir(root);
  const files = [];
  const promises = [];

  for (let c of contents) {
    const absPath = path.resolve(root, c);
    const isDir = (await fs.stat(absPath)).isDirectory();

    if (isDir && !shouldIgnore(absPath, ignoreList)) {
      const pr = getFileList(absPath, ignoreList).then((fl) => {
        files.push(...fl);
      });
      promises.push(pr);
    } else if (absPath.match(/\.(js|ts|vue)$/) !== null) {
      files.push(absPath);
    }
  }

  await Promise.all(promises);
  return files;
}

async function getFileContents(fileList) {
  const contents = [];
  const promises = [];
  for (let file of fileList) {
    const pr = fs.readFile(file, { encoding: 'utf-8' }).then((c) => {
      contents.push([file, c]);
    });
    promises.push(pr);
  }
  await Promise.all(promises);
  return contents;
}

async function getAllTStringsMap(contents) {
  const strings = new Map();
  const promises = [];

  contents.forEach(([f, c]) => {
    const pr = getTStrings(c).then((ts) => {
      if (ts.length === 0) {
        return;
      }
      strings.set(f, ts);
    });
    promises.push(pr);
  });

  await Promise.all(promises);
  return strings;
}

function getTStrings(content) {
  return new Promise((resolve) => {
    const tStrings = tStringFinder(content);
    resolve(tStrings);
  });
}

function tStringFinder(content) {
  return [...content.matchAll(PATTERN)].map(([_, t]) => {
    t = getIndexFormat(t);
    return getWhitespaceSanitized(t);
  });
}

function mapToTStringArray(tMap) {
  const tSet = new Set();
  for (let k of tMap.keys()) {
    tMap.get(k).forEach((s) => tSet.add(s));
  }
  const tArray = [...tSet];
  return tArray.sort();
}

function printHelp() {
  const shouldPrint = process.argv.findIndex((i) => i === '-h') !== -1;
  if (shouldPrint) {
    console.log(
      `Usage: ` +
        `\tyarn script:translate\n` +
        `\tyarn script:translate -h\n` +
        `\tyarn script:translate -l [language_code]\n` +
        `\n` +
        `Example: $ yarn script:translate -l de\n` +
        `\n` +
        `Description:\n` +
        `\tPassing a language code will create a '.csv' file in\n` +
        `\tthe 'translations' subdirectory. Translated strings are to\n` +
        `\tbe added to this file.\n\n` +
        `\tCalling the script without args will update the translation csv\n` +
        `\tfile with new strings if any. Existing translations won't\n` +
        `\tbe removed.\n` +
        `\n` +
        `Parameters:\n` +
        `\tlanguage_code : An ISO 693-1 code or a locale identifier.\n` +
        `\n` +
        `Reference:\n` +
        `\tISO 693-1 codes: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes\n` +
        `\tLocale identifier: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation`
    );
  }
  return shouldPrint;
}

function getLanguageCode() {
  const i = process.argv.findIndex((i) => i === '-l');
  if (i === -1) {
    return '';
  }
  return process.argv[i + 1] ?? '';
}

function getTranslationFilePath(languageCode) {
  return path.resolve(translationsFolder, `${languageCode}.csv`);
}

async function regenerateTranslation(tArray, path) {
  // Removes old strings, adds new strings
  const contents = await fs.readFile(path, { encoding: 'utf-8' });
  const map = new Map();

  // Populate map
  contents
    .split('\n')
    .filter((l) => l.length)
    .map(splitCsvLine)
    .forEach((l) => {
      if (l[1] === '' || !l[1]) {
        return;
      }

      map.set(l[0].trim(), l.slice(1));
    });

  const regenContent = tArray
    .map((l) => {
      const source = wrap(l);
      const translations = map.get(source);
      return [source, ...(translations ?? [])].join(',');
    })
    .join('\n');
  await fs.writeFile(path, regenContent, { encoding: 'utf-8' });
  console.log(`\tregenerated: ${path}`);
}

async function regenerateTranslations(languageCode, tArray) {
  // regenerate one file
  if (languageCode) {
    const path = getTranslationFilePath(languageCode);
    regenerateTranslation(tArray, path);
    return;
  }

  // regenerate all translation files
  console.log(`Language code not passed, regenerating all translations.`);
  const contents = (await fs.readdir(translationsFolder)).filter((f) =>
    f.endsWith('.csv')
  );
  contents.forEach((f) =>
    regenerateTranslation(tArray, path.resolve(translationsFolder, f))
  );
}

async function writeTranslations(languageCode, tArray) {
  const path = getTranslationFilePath(languageCode);
  try {
    const stat = await fs.stat(path);
    if (!stat.isFile()) {
      throw new Error(`${path} is not a translation file`);
    }

    console.log(
      `Existing file found for '${languageCode}': ${path}\n` +
        `regenerating it's translations.`
    );
    regenerateTranslations(languageCode, tArray);
  } catch (err) {
    if (err.errno !== -2) {
      throw err;
    }

    const content = tArray.map(wrap).join(',\n') + ',';
    await fs.writeFile(path, content, { encoding: 'utf-8' });
    console.log(`Generated translation file for '${languageCode}': ${path}`);
  }
}

async function run() {
  if (printHelp()) {
    return;
  }

  const root = path.resolve(__dirname, '..');
  const ignoreList = ['node_modules', 'dist_electron', 'scripts'];
  const languageCode = getLanguageCode();

  console.log();
  const fileList = await getFileList(root, ignoreList);
  const contents = await getFileContents(fileList);
  const tMap = await getAllTStringsMap(contents);
  const tArray = mapToTStringArray(tMap);

  try {
    await fs.stat(translationsFolder);
  } catch (err) {
    if (err.errno !== -2) {
      throw err;
    }

    await fs.mkdir(translationsFolder);
  }

  if (languageCode === '') {
    regenerateTranslations('', tArray);
    return;
  }

  writeTranslations(languageCode, tArray);
}

run();
