import frappe from 'frappe';
import Doc from 'frappe/model/doc';
import {
  FiltersMap,
  ListViewSettings,
  TreeViewSettings,
} from 'frappe/model/types';
import { QueryFilter } from 'utils/db/types';

export default class Account extends Doc {
  async beforeInsert() {
    if (this.accountType || !this.parentAccount) {
      return;
    }

    const account = await frappe.db.get(
      'Account',
      this.parentAccount as string
    );
    this.accountType = account.accountType as string;
  }

  static listSettings: ListViewSettings = {
    columns: ['name', 'parentAccount', 'rootType'],
  };

  static treeSettings: TreeViewSettings = {
    parentField: 'parentAccount',
    async getRootLabel(): Promise<string> {
      const accountingSettings = await frappe.doc.getSingle(
        'AccountingSettings'
      );
      return accountingSettings.companyName as string;
    },
  };

  static filters: FiltersMap = {
    parentAccount: (doc: Doc) => {
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
