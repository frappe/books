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
