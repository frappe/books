import { Frappe } from 'frappe';
import Doc from 'frappe/model/doc';
import {
  FiltersMap,
  ListViewSettings,
  TreeViewSettings,
} from 'frappe/model/types';
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

    const account = await this.frappe.db.get(
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

  static getTreeSettings(frappe: Frappe): void | TreeViewSettings {
    return {
      parentField: 'parentAccount',
      async getRootLabel(): Promise<string> {
        const accountingSettings = await frappe.doc.getSingle(
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
