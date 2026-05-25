import test from 'tape';
import { roundAndSum, roundEur, sumRounded } from '../rounding';

test('roundEur: round half to away-from-zero', (t) => {
  t.equal(roundEur(1.5), 2, 'positive half rounds up');
  t.equal(roundEur(-1.5), -2, 'negative half rounds down (away from zero)');
  t.equal(roundEur(2.4), 2);
  t.equal(roundEur(-2.4), -2);
  t.equal(roundEur(0), 0);
  t.equal(roundEur(0.5), 1);
  t.equal(roundEur(-0.5), -1);
  t.end();
});

test('roundEur: NaN and Infinity collapse to 0', (t) => {
  t.equal(roundEur(NaN), 0);
  t.equal(roundEur(Infinity), 0);
  t.equal(roundEur(-Infinity), 0);
  t.end();
});

test('sumRounded: passthrough sum', (t) => {
  t.equal(sumRounded([1, 2, 3]), 6);
  t.equal(sumRounded([-5, 5]), 0);
  t.equal(sumRounded([]), 0);
  t.end();
});

test('roundAndSum: round-then-sum order (not sum-then-round)', (t) => {
  // 0.5 + 0.5 + 0.5 = 1.5 → if summed first: round(1.5)=2
  // but rounded individually: 1+1+1 = 3
  t.equal(roundAndSum([0.5, 0.5, 0.5]), 3);

  // 0.4 + 0.4 + 0.4 = 1.2 → if summed first: round(1.2)=1
  // rounded individually: 0+0+0 = 0
  t.equal(roundAndSum([0.4, 0.4, 0.4]), 0);
  t.end();
});

test('roundAndSum: critical balance-sheet case', (t) => {
  // Three asset leaves rounded → sum
  // 100.5, 200.5, 50.4 → rounded: 101+201+50 = 352
  t.equal(roundAndSum([100.5, 200.5, 50.4]), 352);

  // Two liability leaves rounded → sum
  // 50.5, 100.4 → 51+100 = 151
  t.equal(roundAndSum([50.5, 100.4]), 151);

  // Equity backed into: 352 - 151 = 201
  t.equal(352 - 151, 201);
  t.end();
});
