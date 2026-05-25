import { ClassifierRule } from './types';

/**
 * Default classifier rules for a solo SaaS OÜ on LHV.
 *
 * Order matters — first match wins. User can extend via the import wizard
 * UI; persisted rules live alongside these in fyo singles (future phase).
 */
export const DEFAULT_RULES: ClassifierRule[] = [
  // ── Cloud / SaaS suppliers (EU/non-EU reverse charge) ─────────────────────
  {
    id: 'aws-eu',
    match: { counterpartyNameContains: 'amazon web services', sign: 'debit' },
    account: 'Cloud Infrastructure',
    vatCode: 'EU_RC_SERVICES',
    side: 'purchase',
  },
  {
    id: 'github',
    match: { counterpartyNameContains: 'github', sign: 'debit' },
    account: 'Software Subscriptions',
    vatCode: 'EU_RC_SERVICES',
    side: 'purchase',
  },
  {
    id: 'figma',
    match: { counterpartyNameContains: 'figma', sign: 'debit' },
    account: 'Software Subscriptions',
    vatCode: 'NON_EU_RC',
    side: 'purchase',
  },
  {
    id: 'stripe-fees',
    match: { counterpartyNameContains: 'stripe', sign: 'debit' },
    account: 'Bank Fees',
    vatCode: 'EU_RC_SERVICES',
    side: 'fee',
  },
  {
    id: 'supabase',
    match: { counterpartyNameContains: 'supabase', sign: 'debit' },
    account: 'Cloud Infrastructure',
    vatCode: 'NON_EU_RC',
    side: 'purchase',
  },
  {
    id: 'openai',
    match: { counterpartyNameContains: 'openai', sign: 'debit' },
    account: 'Cloud Infrastructure',
    vatCode: 'NON_EU_RC',
    side: 'purchase',
  },
  // ── App stores (commission already netted; treat net inflow as zero-rated) ─
  {
    id: 'apple-payouts',
    match: { counterpartyNameContains: 'apple', sign: 'credit' },
    account: 'Mobile App Revenue',
    vatCode: 'ZERO_EXPORT',
    side: 'sales',
  },
  {
    id: 'google-payouts',
    match: { counterpartyNameContains: 'google', sign: 'credit' },
    account: 'Mobile App Revenue',
    vatCode: 'ZERO_EXPORT',
    side: 'sales',
  },
  // ── Bank fees (exempt) ────────────────────────────────────────────────────
  {
    id: 'lhv-fees',
    match: { counterpartyNameContains: 'lhv pank', sign: 'debit' },
    account: 'Bank Fees',
    vatCode: 'EXEMPT',
    side: 'fee',
  },
];
