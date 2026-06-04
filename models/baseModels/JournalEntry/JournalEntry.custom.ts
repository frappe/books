/**
 * CUSTOM — github.com/wemit/books
 *
 * Post-submit invoice attachment for Journal Entries. Submitted docs are
 * immutable, so the action writes only the `attachment` column via a direct
 * db update, leaving ledger postings untouched.
 *
 * Kept in a sidecar so the core JournalEntry.ts only carries a one-line hook
 * (see `getActions`), minimizing merge conflicts against upstream.
 */
import { t } from 'fyo';
import { Action } from 'fyo/model/types';
import { ModelNameEnum } from 'models/types';

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

export function getAttachInvoiceAction(): Action {
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
