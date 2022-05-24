/**
 * And so should not contain and platforma specific imports.
 */
export function getValueMapFromList<T, K extends keyof T, V extends keyof T>(
  list: T[],
  key: K,
  valueKey: V,
  filterUndefined: boolean = true
): Record<string, unknown> {
  if (filterUndefined) {
    list = list.filter(
      (f) =>
        (f[valueKey] as unknown) !== undefined &&
        (f[key] as unknown) !== undefined
    );
  }

  return list.reduce((acc, f) => {
    const keyValue = String(f[key]);
    const value = f[valueKey];
    acc[keyValue] = value;
    return acc;
  }, {} as Record<string, unknown>);
}

export function getRandomString(): string {
  const randomNumber = Math.random().toString(36).slice(2, 8);
  const currentTime = Date.now().toString(36);
  return `${randomNumber}-${currentTime}`;
}

export async function sleep(durationMilliseconds: number = 1000) {
  return new Promise((r) => setTimeout(() => r(null), durationMilliseconds));
}

export function getMapFromList<T, K extends keyof T>(
  list: T[],
  name: K
): Record<string, T> {
  const acc: Record<string, T> = {};
  for (const t of list) {
    const key = t[name];
    if (key === undefined) {
      continue;
    }

    acc[String(key)] = t;
  }
  return acc;
}

export function getDefaultMapFromList<T, K extends keyof T, D>(
  list: T[] | string[],
  defaultValue: D,
  name?: K
): Record<string, D> {
  const acc: Record<string, D> = {};
  if (typeof list[0] === 'string') {
    for (const l of list as string[]) {
      acc[l] = defaultValue;
    }

    return acc;
  }

  if (!name) {
    return {};
  }

  for (const l of list as T[]) {
    const key = String(l[name]);
    acc[key] = defaultValue;
  }

  return acc;
}

export function getListFromMap<T>(map: Record<string, T>): T[] {
  return Object.keys(map).map((n) => map[n]);
}

export function getIsNullOrUndef(value: unknown): boolean {
  return value === null || value === undefined;
}

export function titleCase(phrase: string): string {
  return phrase
    .split(' ')
    .map((word) => {
      const wordLower = word.toLowerCase();
      if (['and', 'an', 'a', 'from', 'by', 'on'].includes(wordLower)) {
        return wordLower;
      }
      return wordLower[0].toUpperCase() + wordLower.slice(1);
    })
    .join(' ');
}

export function invertMap(map: Record<string, string>): Record<string, string> {
  const keys = Object.keys(map);
  const inverted: Record<string, string> = {};
  for (const key of keys) {
    const val = map[key];
    inverted[val] = key;
  }

  return inverted;
}

export function time<K, T>(func: (...args: K[]) => T, ...args: K[]): T {
  const name = func.name;
  console.time(name);
  const stuff = func(...args);
  console.timeEnd(name);
  return stuff;
}

export async function timeAsync<K, T>(
  func: (...args: K[]) => Promise<T>,
  ...args: K[]
): Promise<T> {
  const name = func.name;
  console.time(name);
  const stuff = await func(...args);
  console.timeEnd(name);
  return stuff;
}

export function changeKeys<T>(
  source: Record<string, T>,
  keyMap: Record<string, string | undefined>
) {
  const dest: Record<string, T> = {};
  for (const key of Object.keys(source)) {
    const newKey = keyMap[key] ?? key;
    dest[newKey] = source[key];
  }

  return dest;
}

export function deleteKeys<T>(
  source: Record<string, T>,
  keysToDelete: string[]
) {
  const dest: Record<string, T> = {};
  for (const key of Object.keys(source)) {
    if (keysToDelete.includes(key)) {
      continue;
    }
    dest[key] = source[key];
  }

  return dest;
}
