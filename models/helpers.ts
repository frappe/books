import frappe from 'frappe';
import Doc from 'frappe/model/doc';
import { Action } from 'frappe/model/types';
import { Router } from 'vue-router';

export function getLedgerLinkAction(): Action {
  return {
    label: frappe.t`Ledger Entries`,
    condition: (doc: Doc) => !!doc.submitted,
    action: async (doc: Doc, router: Router) => {
      router.push({
        name: 'Report',
        params: {
          reportName: 'general-ledger',
          defaultFilters: {
            // @ts-ignore
            referenceType: doc.schemaName,
            referenceName: doc.name,
          },
        },
      });
    },
  };
}
