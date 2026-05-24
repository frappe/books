import { Fyo } from 'fyo';
import { VAT_CODES, VatCodeName } from 'regional/ee';

/**
 * Seeds Estonian tax records used by KMD aggregation.
 *
 * Pre-condition: the verified Estonian Chart of Accounts (fixtures/verified/ee.json)
 * has already been imported by SetupWizard. The accounts referenced below
 * (VAT Payable EE24 etc.) must exist before sync() is called.
 */
export async function createEstonianRecords(fyo: Fyo) {
  await createTaxes(fyo);
}

interface TaxAccountMap {
  /** Account credited for output VAT (sales side). */
  outputAccount: string;
  /** Account debited for input VAT (purchase side). */
  inputAccount: string;
  /** Account credited when self-assessing reverse-charge VAT. */
  reverseChargePayable?: string;
  /** Account debited when self-assessing reverse-charge VAT. */
  reverseChargeReceivable?: string;
}

function getTaxAccounts(code: VatCodeName): TaxAccountMap | null {
  switch (code) {
    case 'EE24':
    case 'EE13':
    case 'EE9':
      return {
        outputAccount: 'VAT Payable',
        inputAccount: 'VAT Receivable',
      };
    case 'EU_RC_GOODS':
    case 'EU_RC_SERVICES':
    case 'NON_EU_RC':
      return {
        outputAccount: 'VAT Payable',
        inputAccount: 'VAT Receivable',
        reverseChargePayable: 'Reverse Charge VAT Payable',
        reverseChargeReceivable: 'Reverse Charge VAT Receivable',
      };
    case 'EE0':
    case 'ZERO_EU_B2B':
    case 'ZERO_EXPORT':
    case 'EXEMPT':
      return null;
    default:
      return null;
  }
}

async function createTaxes(fyo: Fyo) {
  for (const code of Object.keys(VAT_CODES) as VatCodeName[]) {
    const spec = VAT_CODES[code];
    const accounts = getTaxAccounts(code);

    // Skip zero/exempt codes — no Tax doc needed; importer/invoice flow tags
    // ledger entries directly with the VAT code for KMD aggregation.
    if (accounts === null) continue;

    const exists = await fyo.db.exists('Tax', code);
    if (exists) continue;

    const newTax = fyo.doc.getNewDoc('Tax', {
      name: code,
      details: [
        {
          account: accounts.outputAccount,
          rate: spec.rate,
        },
      ],
    });
    await newTax.sync();
  }
}
