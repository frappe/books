import { Doc } from 'fyo/model/doc';
import {
  ChangeArg,
  FiltersMap,
  HiddenMap,
  ListsMap,
  ReadOnlyMap,
  ValidationMap,
} from 'fyo/model/types';
import { validateEmail } from 'fyo/model/validationFunction';
import { createDiscountAccount } from 'src/setup/setupInstance';
import { getCountryInfo } from 'utils/misc';

export class AccountingSettings extends Doc {
  enableDiscounting?: boolean;
  enableInventory?: boolean;

  static filters: FiltersMap = {
    writeOffAccount: () => ({
      isGroup: false,
      rootType: 'Expense',
    }),
    roundOffAccount: () => ({
      isGroup: false,
      rootType: 'Expense',
    }),
    discountAccount: () => ({
      isGroup: false,
      rootType: 'Income',
    }),
  };

  validations: ValidationMap = {
    email: validateEmail,
  };

  static lists: ListsMap = {
    country: () => Object.keys(getCountryInfo()),
  };

  readOnly: ReadOnlyMap = {
    enableDiscounting: () => {
      return !!this.enableDiscounting;
    },
    enableInventory: () => {
      return !!this.enableInventory;
    },
  };

  override hidden: HiddenMap = {
    discountAccount: () => !this.enableDiscounting,
    gstin: () => this.fyo.singles.SystemSettings?.countryCode !== 'in',
  };

  async change(ch: ChangeArg) {
    const discountingEnabled =
      ch.changed === 'enableDiscounting' && this.enableDiscounting;
    const discountAccountNotSet = !this.discountAccount;

    if (discountingEnabled && discountAccountNotSet) {
      await createDiscountAccount(this.fyo);
    }
  }
}
