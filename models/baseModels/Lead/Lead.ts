import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  LeadStatus,
  ListViewSettings,
  ReadOnlyMap,
  ValidationMap,
} from 'fyo/model/types';
import { getLeadStatusColumn } from 'models/helpers';
import {
  validateEmail,
  validatePhoneNumber,
} from 'fyo/model/validationFunction';
import { DocValueMap } from 'fyo/core/types';
import { ModelNameEnum } from 'models/types';

export class Lead extends Doc {
  status?: LeadStatus;

  getCustomerDoc(): Lead | undefined {
    if (!this.name) return;

    const docData = this.getValidDict(true, true);

    if (!docData) {
      return;
    }
    const partyDocData = {
      ...docData,
      role: 'Customer',
      fromLead: this.name,
    } as DocValueMap;
    const newPartyDoc = this.fyo.doc.getNewDoc(
      ModelNameEnum.Party,
      partyDocData
    ) as Lead;
    return newPartyDoc;
  }

  getSalesQuoteDoc(itemData: { name: string; rate: number }): Lead | undefined {
    if (!this.name) return;

    const docData = this.getValidDict(true, true);

    if (!docData) {
      return;
    }
    const newSalesQuoteDoc = this.fyo.doc.getNewDoc(ModelNameEnum.SalesQuote, {
      ...docData,
      party: docData.name,
      referenceType: ModelNameEnum.Lead,
      items: [
        {
          item: itemData.name,
          rate: itemData.rate,
        },
      ],
    }) as Lead;
    return newSalesQuoteDoc;
  }

  validations: ValidationMap = {
    email: validateEmail,
    mobile: validatePhoneNumber,
  };

  static getActions(fyo: Fyo): Action[] {
    return [
      {
        group: fyo.t`Create`,
        label: fyo.t`Customer`,
        action: async (doc: Doc, router) => {
          const lead = fyo.doc.getNewDoc('Party', {
            ...doc.getValidDict(),
            fromLead: doc.name,
            role: 'Customer',
          });
          if (!lead.name) {
            return;
          }
          await router.push(`/edit/Party/${lead.name}`);
        },
      },
      {
        group: fyo.t`Create`,
        label: fyo.t`Sales Quote`,
        action: async (doc, router) => {
          const data: { party: string | undefined; referenceType: string } = {
            party: doc.name,
            referenceType: 'Lead',
          };
          const lead = fyo.doc.getNewDoc('SalesQuote', data);
          if (!lead.name) {
            return;
          }
          await router.push(`/edit/SalesQuote/${lead.name}`);
        },
      },
    ];
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', getLeadStatusColumn(), 'email', 'mobile'],
    };
  }

  readOnly: ReadOnlyMap = {
    unit: () => this.inserted,
    itemType: () => this.inserted,
    trackItem: () => this.inserted,
    hasBatch: () => this.inserted,
    hasSerialNumber: () => this.inserted,
  };
}
