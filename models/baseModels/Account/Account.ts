import { Fyo } from 'fyo';
import Doc from 'fyo/model/doc';
import {
  FiltersMap,
  ListViewSettings,
  TreeViewSettings,
} from 'fyo/model/types';
import { QueryFilter } from 'utils/db/types';
import { AccountRootType, AccountType } from './types';

export class Account extends Doc {
  rootType?: AccountRootType;
  accountType?: AccountType;
  parentAccount?: string;

  async beforeInsert() {
    if (this.accountType || !this.parentAccount) {
      return;
    }

    const account = await this.fyo.db.get(
      'Account',
      this.parentAccount as string
    );
    this.accountType = account.accountType as AccountType;
  }

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'parentAccount', 'rootType'],
    };
  }

  static getTreeSettings(fyo: Fyo): void | TreeViewSettings {
    return {
      parentField: 'parentAccount',
      async getRootLabel(): Promise<string> {
        const accountingSettings = await fyo.doc.getSingle(
          'AccountingSettings'
        );
        return accountingSettings.companyName as string;
      },
    };
  }

  static filters: FiltersMap = {
    parentAccount: (doc: Account) => {
      const filter: QueryFilter = {
        isGroup: true,
      };

      if (doc.rootType) {
        filter.rootType = doc.rootType as string;
      }

      return filter;
    },
  };
}