/**
 * Round-then-sum semantics for XBRL annual reports.
 *
 * RIK enforces the balance equation Assets === Liabilities + Equity exactly
 * (post-rounding). The standard trap: rounding totals after summing raw cent
 * values creates ±€1 drift because individual leaves were never rounded.
 *
 * Rule (per plan §7.4):
 *   1. Round each individual line item to nearest euro FIRST.
 *   2. Sum the rounded values for any subtotal.
 *   3. Never round a sum.
 *
 * `pesa` values are stored as scaled integers internally; we extract the raw
 * number (euros, fractional) and apply `Math.round` here so the XBRL output
 * matches the manually-checkable arithmetic on the trial balance.
 */

/**
 * Round a single monetary value to nearest whole euro using away-from-zero.
 *
 * `Math.round` rounds half toward +infinity. For mixed-sign values
 * (loss positions on equity side) this matches the RPS convention used by
 * Merit Aktiva and Aruannik samples.
 */
export function roundEur(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Math.round uses "round half to +Infinity"; -2.5 → -2 (not -3).
  // For negative values we want away-from-zero, so flip-round-flip.
  if (value < 0) {
    return -Math.round(-value);
  }
  return Math.round(value);
}

/**
 * Sum already-rounded values. Pure pass-through; exists as a named
 * function so callers can express intent: "I have rounded leaves, take
 * their sum without further rounding".
 */
export function sumRounded(values: number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/**
 * Convenience for one-shot "round each, then sum".
 */
export function roundAndSum(values: number[]): number {
  return sumRounded(values.map(roundEur));
}
