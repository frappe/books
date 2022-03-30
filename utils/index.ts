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
