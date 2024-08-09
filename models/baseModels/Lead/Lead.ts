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

export class Lead extends Doc {
  status?: LeadStatus;

  validations: ValidationMap = {
    email: validateEmail,
    mobile: validatePhoneNumber,
  };

  static getActions(fyo: Fyo): Action[] {
    return getLeadActions(fyo);
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', getLeadStatusColumn(), 'email', 'mobile'],
    };
  }
}
