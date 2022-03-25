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
