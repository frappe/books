import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import {
  Action,
  LeadStatus,
  ListViewSettings,
  ValidationMap,
} from 'fyo/model/types';
import { getLeadActions, getLeadStatusColumn } from 'models/helpers';
import {
  validateEmail,
  validatePhoneNumber,
} from 'fyo/model/validationFunction';
import { ModelNameEnum } from 'models/types';

export class Lead extends Doc {
  status?: LeadStatus;

  validations: ValidationMap = {
    email: validateEmail,
    mobile: validatePhoneNumber,
  };

  createCustomer() {
    return this.fyo.doc.getNewDoc(ModelNameEnum.Party, {
      ...this.getValidDict(),
      fromLead: this.name,
      phone: this.mobile as string,
      role: 'Customer',
    });
  }

  createSalesQuote() {
    const data: { party: string | undefined; referenceType: string } = {
      party: this.name,
      referenceType: ModelNameEnum.Lead,
    };

    return this.fyo.doc.getNewDoc(ModelNameEnum.SalesQuote, data);
  }

  static getActions(fyo: Fyo): Action[] {
    return getLeadActions(fyo);
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', getLeadStatusColumn(), 'email', 'mobile'],
    };
  }
}
