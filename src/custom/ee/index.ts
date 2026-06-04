/**
 * CUSTOM — github.com/wemit/books
 *
 * Estonia addon — renderer half. Bundles the EE app-level contributions
 * (reports, bank-import route, sidebar, Submit-Drafts list action) behind one
 * manifest so they register through the addon aggregator instead of being
 * scattered across core registries.
 *
 * Country-scoped data (EE models, schemas, setup records, COA, settings
 * fields) stays on upstream's native regional system — see models/index.ts,
 * schemas/regional, src/regional/index.ts. The EE main-process half (Arelle
 * XBRL validation IPC) lives in main/addons/ee.ts.
 */
import { t } from 'fyo';
import type { Fyo } from 'fyo';
import { ModelNameEnum } from 'models/types';
import { AnnualReport } from 'reports/EstonianAnnualReport/AnnualReport';
import { KmdReport } from 'reports/EstonianTax/KmdReport';
import { showDialog, showToast } from 'src/utils/interactive';
import type { SidebarRoot } from 'src/utils/types';
import type { AppAddon } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEstoniaSidebar(_fyo: Fyo): SidebarRoot[] {
  // Always shown for EE companies (outer addon condition gates the country).
  // No VAT-number gate: an EE company without a VAT number still needs the
  // sidebar. KMD viewing is harmless when un-registered, and the XML export
  // self-guards (throws if Registry Code is unset) at the point it matters.
  return [
    {
      label: t`Estonia`,
      name: 'estonia',
      icon: 'common-entries',
      route: '/regional/ee/bank-import',
      items: [
        {
          label: t`Bank Import`,
          name: 'bank-import',
          route: '/regional/ee/bank-import',
        },
        { label: t`KMD`, name: 'kmd', route: '/report/KmdReport' },
        {
          label: t`Annual Report`,
          name: 'annual-report',
          route: '/report/AnnualReport',
        },
      ],
    },
  ];
}

async function submitDrafts(fyo: Fyo) {
  const drafts = (await fyo.db.getAllRaw(ModelNameEnum.JournalEntry, {
    fields: ['name'],
    filters: { submitted: false, cancelled: false },
  })) as { name: string }[];

  if (drafts.length === 0) {
    showToast({ type: 'info', message: t`No draft journal entries.` });
    return;
  }

  await showDialog({
    title: t`Submit ${drafts.length} draft journal entries?`,
    type: 'warning',
    detail: t`This posts them to the ledger. Each can still be cancelled individually afterwards.`,
    buttons: [
      {
        label: t`Submit`,
        isPrimary: true,
        action: async () => {
          await runSubmitDrafts(fyo, drafts);
          return true;
        },
      },
      { label: t`Cancel`, action: () => null, isEscape: true },
    ],
  });
}

async function runSubmitDrafts(fyo: Fyo, drafts: { name: string }[]) {
  let submitted = 0;
  let failed = 0;
  for (const { name } of drafts) {
    try {
      const doc = await fyo.doc.getDoc(ModelNameEnum.JournalEntry, name);
      if (!doc.submitted && !doc.cancelled) {
        await doc.submit();
        submitted += 1;
      }
    } catch {
      failed += 1;
    }
  }

  showToast({
    type: failed ? 'error' : 'success',
    message: failed
      ? t`Submitted ${submitted}, ${failed} failed.`
      : t`Submitted ${submitted} journal entries.`,
  });
}

const ee: AppAddon = {
  name: 'ee',
  condition: (fyo) => fyo.singles?.SystemSettings?.countryCode === 'ee',
  reports: { KmdReport, AnnualReport },
  routes: [
    {
      path: '/regional/ee/bank-import',
      name: 'EE Bank Import',
      // Lazy: keeps the heavy page out of the eager addon import graph
      // (it transitively loads reports/index, which loads this addon).
      component: () => import('src/pages/BankImport/BankImportPage.vue'),
    },
  ],
  sidebar: getEstoniaSidebar,
  listActions: {
    [ModelNameEnum.JournalEntry]: [
      { label: t`Submit Drafts`, action: submitDrafts },
    ],
  },
};

export default ee;
