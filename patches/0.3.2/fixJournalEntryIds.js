import { getPaddedName } from '@/utils';
import frappe from 'frappe';
import { journalEntryTypeMap } from '../../models/doctype/JournalEntry/JournalEntry';

export async function getCorrectedJournalEntries() {
  const jes = await frappe.db.knex('JournalEntry');
  const names = new Set();
  const duplicates = [];

  for (const je of jes) {
    if (je.name in journalEntryTypeMap) {
      const entryType = je.name;
      je.name = je.entryType;
      je.entryType = entryType;
    }

    if (names.has(je.name)) {
      duplicates.push(je);
    } else {
      names.add(je.name);
    }
  }

  if (duplicates.length === 0) {
    return { jes, currentMap: {}, nsMap: {} };
  }

  const nameMap = getNameMap(names);
  const nsMap = await getNumberSeriesMap(nameMap);
  const currentMap = {};

  const editedMap = {};

  for (const je of duplicates) {
    const { prefix } = getNumPrefix(je.name);
    if (prefix.length === 0) {
      je.name = `${je.name}-${Math.random().toString(36).slice(2, 7)}`;
      continue;
    }

    const newNum = nameMap[prefix].at(-1) + 1;
    nameMap[prefix].push(newNum);
    currentMap[prefix] = newNum;

    const newName = getPaddedName(prefix, newNum, nsMap[prefix].padZeros);
    editedMap[je.name] = newName;
    je.name = newName;
  }

  return { jes, currentMap, nsMap };
}

async function updateCurrent(currentMap, nsMap) {
  for (const name in currentMap) {
    nsMap[name].update({ current: currentMap[name] });
  }
}

async function getNumberSeriesMap(nameMap) {
  const nsMap = {};
  for (const name in nameMap) {
    nsMap[name] = await frappe.getDoc('NumberSeries', name);
  }
  return nsMap;
}

function getNumPrefix(name) {
  const mo = name.match(/(\D+)(\d+)$/);
  const np = { num: '', prefix: '' };
  if (!mo) {
    return np;
  }

  np.prefix = mo[1] ?? '';
  np.num = mo[2] ?? '';
  return np;
}

function getNameMap(names) {
  const nameMap = {};
  for (const name of names) {
    const { num, prefix } = getNumPrefix(name);
    if (prefix.length === 0) {
      continue;
    }

    nameMap[prefix] ??= [];
    nameMap[prefix].push(parseInt(num));
  }

  for (const name in nameMap) {
    nameMap[name].sort();
  }

  return nameMap;
}

export default async function execute() {
  const { jes, currentMap, nsMap } = await getCorrectedJournalEntries();
  await frappe.db.prestigeTheTable('JournalEntry', jes);
  if (Object.keys(currentMap).length) {
    updateCurrent(currentMap, nsMap);
  }
}
