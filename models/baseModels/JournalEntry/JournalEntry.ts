import { Fyo, t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  DefaultMap,
  FiltersMap,
  HiddenMap,
  ListViewSettings,
} from 'fyo/model/types';
import {
  getDocStatus,
  getLedgerLinkAction,
  getNumberSeries,
  getStatusText,
  statusColor,
} from 'models/helpers';
import { Transactional } from 'models/Transactional/Transactional';
import { Money } from 'pesa';
import { LedgerPosting } from '../../Transactional/LedgerPosting';
import { ModelNameEnum } from 'models/types';

export class JournalEntry extends Transactional {
  accounts?: Doc[];

  async getPosting() {
    const posting: LedgerPosting = new LedgerPosting(this, this.fyo);

    for (const row of this.accounts ?? []) {
      const debit = row.debit as Money;
      const credit = row.credit as Money;
      const account = row.account as string;

      if (!debit.isZero()) {
        await posting.debit(account, debit);
      } else if (!credit.isZero()) {
        await posting.credit(account, credit);
      }
    }

    return posting;
  }

  /**
   * Overridden to allow editing of submitted 'Bank Entry' documents.
   * Standard Journal Entries remain locked after submission.
   */
  get canEdit() {
    if (this.isCancelled) return false;

    // If submitted, only allow editing if it's a Bank Entry
    if (this.isSubmitted && this.entryType !== 'Bank Entry') {
      return false;
    }

    return true;
  }

  /**
   * Overridden to allow saving of submitted 'Bank Entry' documents if they have changes.
   */
  get canSave() {
    if (this.isCancelled) return false;

    // If submitted, only allow saving if it's a Bank Entry
    if (this.isSubmitted && this.entryType !== 'Bank Entry') {
      return false;
    }

    return this.dirty;
  }

  /**
   * Hook called after the document is synced (saved).
   * If submitted, it deletes old ledger entries and creates new ones.
   */
  async afterSync() {
    await super.afterSync();

    if (this.isSubmitted) {
      // 1. Find existing ledger entries linked to this Journal Entry
      const ledgerEntryIds = (await this.fyo.db.getAll(
        ModelNameEnum.AccountingLedgerEntry,
        {
          fields: ['name'],
          filters: {
            referenceType: this.schemaName,
            referenceName: this.name!,
          },
        }
      )) as { name: string }[];

      // 2. Delete them one by one to ensure proper cleanup hooks run
      for (const { name } of ledgerEntryIds) {
        const ledgerEntryDoc = await this.fyo.doc.getDoc(
          ModelNameEnum.AccountingLedgerEntry,
          name
        );
        await ledgerEntryDoc.delete();
      }

      // 3. Repost new ledger entries based on the updated document data
      const posting = await this.getPosting();
      if (posting) {
        await posting.post();
      }
    }
  }

  hidden: HiddenMap = {
    referenceNumber: () =>
      !(this.referenceNumber || !(this.isSubmitted || this.isCancelled)),
    referenceDate: () =>
      !(this.referenceDate || !(this.isSubmitted || this.isCancelled)),
    userRemark: () =>
      !(this.userRemark || !(this.isSubmitted || this.isCancelled)),
    attachment: () =>
      !(this.attachment || !(this.isSubmitted || this.isCancelled)),
  };

  static defaults: DefaultMap = {
    numberSeries: (doc) => getNumberSeries(doc.schemaName, doc.fyo),
    date: () => new Date(),
  };

  static filters: FiltersMap = {
    numberSeries: () => ({ referenceType: 'JournalEntry' }),
  };

  static getActions(fyo: Fyo): Action[] {
    return [getLedgerLinkAction(fyo)];
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: [
        'name',
        {
          label: t`Status`,
          fieldname: 'status',
          fieldtype: 'Select',
          render(doc) {
            const status = getDocStatus(doc);
            const color = statusColor[status] ?? 'gray';
            const label = getStatusText(status);

            return {
              template: `<Badge class="text-xs" color="${color}">${label}</Badge>`,
            };
          },
        },
        'date',
        'entryType',
        'referenceNumber',
      ],
    };
  }
}