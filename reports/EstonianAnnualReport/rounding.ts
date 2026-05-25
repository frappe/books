export function roundEur(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) {
    return -Math.round(-value);
  }
  return Math.round(value);
}

export function sumRounded(values: number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

export function roundAndSum(values: number[]): number {
  return sumRounded(values.map(roundEur));
}
