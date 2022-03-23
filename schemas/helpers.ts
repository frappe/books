export function getMapFromList<T>(
  list: T[],
  name: string = 'name'
): Record<string, T> {
  const acc: Record<string, T> = {};
  for (const t of list) {
    const key = t[name] as string | undefined;
    if (key === undefined) {
      continue;
    }

    acc[key] = t;
  }
  return acc;
}

export function getListFromMap<T>(map: Record<string, T>): T[] {
  return Object.keys(map).map((n) => map[n]);
}
