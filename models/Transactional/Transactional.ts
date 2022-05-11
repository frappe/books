import { Doc } from 'fyo/model/doc';
import { ModelNameEnum } from 'models/types';
import { LedgerPosting } from './LedgerPosting';

/**
 * # Transactional
 *
 * Any model that creates ledger entries on submit should extend the
 * `Transactional` model.
 *
 * Example of transactional models:
 * - Invoice
 * - Payment
 * - JournalEntry
 *
 * Basically it does the following:
 * - `afterSubmit`: create the ledger entries.
 * - `afterCancel`: create reverse ledger entries.
 * - `afterDelete`: delete the normal and reversed ledger entries.
 */

export abstract class Transactional extends Doc {
  date?: Date;

  get isTransactional() {
    return true;
  }

  abstract getPosting(): Promise<LedgerPosting>;

  async validate() {
    await super.validate();
    const posting = await this.getPosting();
    posting.validate();
  }

  async afterSubmit(): Promise<void> {
    await super.afterSubmit();
    const posting = await this.getPosting();
    await posting.post();
  }

  async afterCancel(): Promise<void> {
    await super.afterCancel();
    const posting = await this.getPosting();
    await posting.postReverse();
  }

  async afterDelete(): Promise<void> {
    await super.afterDelete();
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

    for (const { name } of ledgerEntryIds) {
      const ledgerEntryDoc = await this.fyo.doc.getDoc(
        ModelNameEnum.AccountingLedgerEntry,
        name
      );
      await ledgerEntryDoc.delete();
    }
  }
}
