import { Fyo } from 'fyo';
import Doc from 'fyo/model/doc';
import { Action } from 'fyo/model/types';
import { pesa } from 'pesa';

export function slug(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
      return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function getRandomString() {
  return Math.random().toString(36).substr(3);
}

export async function sleep(seconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

export function range(n: number) {
  return Array(n)
    .fill(null)
    .map((_, i) => i);
}

export function unique(list: unknown[], key = (it: unknown) => String(it)) {
  const seen: Record<string, boolean> = {};
  return list.filter((item) => {
    const k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
}

export function getDuplicates(array: unknown[]) {
  const duplicates: unknown[] = [];
  for (const i in array) {
    const previous = array[parseInt(i) - 1];
    const current = array[i];

    if (current === previous) {
      if (!duplicates.includes(current)) {
        duplicates.push(current);
      }
    }
  }
  return duplicates;
}

export function isPesa(value: unknown): boolean {
  return value instanceof pesa().constructor;
}

export function getActions(doc: Doc, fyo: Fyo): Action[] {
  const Model = fyo.models[doc.schemaName];
  if (Model === undefined) {
    return [];
  }

  return Model.getActions(fyo);
}
