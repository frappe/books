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
  isTransactional = true;
  abstract getPosting(): Promise<LedgerPosting>;

  async validate() {
    const posting = await this.getPosting();
    posting.validate();
  }

  async afterSubmit(): Promise<void> {
    const posting = await this.getPosting();
    await posting.post();
  }

  async afterCancel(): Promise<void> {
    const posting = await this.getPosting();
    await posting.postReverse();
  }

  async afterDelete(): Promise<void> {
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
      await this.fyo.db.delete(ModelNameEnum.AccountingLedgerEntry, name);
    }
  }
}
