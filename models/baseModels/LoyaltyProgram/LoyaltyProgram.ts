import { DocValue } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { FiltersMap, ListViewSettings, ValidationMap } from 'fyo/model/types';
import { ValidationError } from 'fyo/utils/errors';
import { CollectionRulesItems } from '../CollectionRulesItems/CollectionRulesItems';
import { AccountRootTypeEnum } from '../Account/types';
import { getLoyaltyProgramStatusColumn } from '../../helpers';

export class LoyaltyProgram extends Doc {
  collectionRules?: CollectionRulesItems[];
  expiryDuration?: number;
  maximumUse?: number;
  used?: number;

  validations: ValidationMap = {
    used: (value: DocValue) => {
      const used = value as number;
      const maximumUse = this.maximumUse as number;

      if (used < 0) {
        throw new ValidationError('Used count cannot be negative');
      }

      if (maximumUse > 0 && used > maximumUse) {
        throw new ValidationError('Used count cannot exceed maximum use limit');
      }
    },
    maximumUse: (value: DocValue) => {
      const maximumUse = value as number;

      if (maximumUse < 0) {
        throw new ValidationError('Maximum use cannot be negative');
      }
    },
  };

  static filters: FiltersMap = {
    expenseAccount: () => ({
      rootType: AccountRootTypeEnum.Expense,
      isGroup: false,
    }),
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', getLoyaltyProgramStatusColumn(), 'fromDate', 'toDate'],
    };
  }
}
