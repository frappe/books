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
import { ModelNameEnum } from 'models/types';
import { Money } from 'pesa';
import { LedgerPosting } from '../../Transactional/LedgerPosting';

const INVOICE_MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

function bytesToBase64(data: unknown): string {
  let bytes: Uint8Array;
  if (data instanceof Uint8Array) {
    bytes = data;
  } else if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    bytes = Uint8Array.from((data as { data: number[] }).data);
  } else {
    bytes = new Uint8Array();
  }

  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function getAttachInvoiceAction(): Action {
  return {
    label: t`Attach Invoice`,
    group: t`Attachment`,
    condition: (doc) => !!doc.isSubmitted && !doc.isCancelled,
    action: async (doc) => {
      const res = await ipc.selectFile({
        title: t`Select invoice (PDF or image)`,
        filters: [
          { name: t`Invoice`, extensions: ['pdf', 'png', 'jpg', 'jpeg'] },
        ],
      });
      if (res.canceled || !res.success || !res.data) {
        return;
      }

      const ext = res.filePath.toLowerCase().split('.').pop() ?? '';
      const type = INVOICE_MIME_BY_EXT[ext] ?? 'application/octet-stream';
      const attachment = {
        name: res.name,
        type,
        data: `data:${type};base64,${bytesToBase64(res.data)}`,
      };

      await doc.fyo.db.update(ModelNameEnum.JournalEntry, {
        name: doc.name!,
        attachment,
      });
      await doc.load();
    },
  };
}

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
    return [getLedgerLinkAction(fyo), getAttachInvoiceAction()];
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
