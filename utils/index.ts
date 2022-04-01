/**
 * Functions in utils/*.ts can be used by the frontend or the backends
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
  return Math.random().toString(36).slice(2, 8);
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

export function getListFromMap<T>(map: Record<string, T>): T[] {
  return Object.keys(map).map((n) => map[n]);
}

export function getIsNullOrUndef(value: unknown): boolean {
  return value === null || value === undefined;
}
