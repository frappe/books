import { DateTime } from 'luxon';

export function prefixFormat(value: number): string {
  /*
  1,000000,000,000,000,000 = 1 P (Pentillion)
      1000,000,000,000,000 = 1 Q (Quadrillion)
          1000,000,000,000 = 1 T (Trillion)
              1000,000,000 = 1 B (Billion)
                  1000,000 = 1 M (Million)
                      1000 = 1 K (Thousand)
                         1 = 1
  */
  if (Math.abs(value) < 1) {
    return Math.round(value).toString();
  }

  const ten = Math.floor(Math.log10(Math.abs(value)));
  const three = Math.floor(ten / 3);
  const num = Math.round(value / Math.pow(10, three * 3));
  const suffix = ['', 'K', 'M', 'B', 'T', 'Q', 'P'][three];
  return `${num} ${suffix}`;
}

export function euclideanDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dsq = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  return Math.sqrt(dsq);
}

function getRoundingConst(val: number): number {
  const pow = Math.max(Math.log10(Math.abs(val)) - 1, 0);
  return 10 ** Math.floor(pow);
}

function getVal(minOrMaxVal: number): number {
  const rc = getRoundingConst(minOrMaxVal);
  const sign = minOrMaxVal >= 0 ? 1 : -1;
  if (sign === 1) {
    return Math.ceil(minOrMaxVal / rc) * rc;
  }
  return Math.floor(minOrMaxVal / rc) * rc;
}

export function getYMax(points: number[][]): number {
  const maxVal = Math.max(...points.flat());
  if (maxVal === 0) {
    return 0;
  }

  return getVal(maxVal);
}

export function getYMin(points: number[][]): number {
  const minVal = Math.min(...points.flat());
  if (minVal === 0) {
    return minVal;
  }

  return getVal(minVal);
}

export function formatXLabels(label: string) {
  return DateTime.fromISO(label).toFormat('MMM yy');
}
