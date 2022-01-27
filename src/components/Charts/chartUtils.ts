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

export function getYMax(points: Array<Array<number>>): number {
  const maxVal = Math.max(...points.flat());
  if (maxVal === 0) {
    return 0;
  }

  const sign = maxVal >= 0 ? 1 : -1;
  const texp = 10 ** Math.floor(Math.log10(Math.abs(maxVal)));
  if (sign === 1) {
    return Math.ceil(maxVal / texp) * texp;
  }
  return Math.floor(maxVal / texp) * texp;
}

export function getYMin(points: Array<Array<number>>): number {
  const minVal = Math.min(...points.flat());
  if (minVal === 0) {
    return minVal;
  }

  const sign = minVal >= 0 ? 1 : -1;
  const texp = 10 ** Math.floor(Math.log10(Math.abs(minVal)));
  if (sign === 1) {
    return Math.ceil(minVal / texp) * texp;
  }
  return Math.floor(minVal / texp) * texp;
}
