import frappe from 'frappejs';
import { _ } from 'frappejs/utils';
import DatabaseSelector from './components/DatabaseSelector';

export default {
  async getTitle() {
    const accountingSettings = await frappe.getSingle('AccountingSettings');
    return accountingSettings.companyName;
  },
  onTitleClick(vm) {
    vm.$modal.show({
      component: DatabaseSelector,
      modalProps: {
        title: _('Change Database File'),
        primaryAction: {
          label: _('Submit'),
          handler: (vm) => {
            vm.changeDatabase();
          }
        }
      }
    });
  },
  groups: [
    {
      items: [
        {
          label: _('ToDo'), route: '#/list/ToDo'
        },
        {
          label: _('Event'), route: '#/list/Event'
        }
      ]
    },
    {
      title: _('Masters'),
      items: [
        {
          label: _('Item'), route: '#/list/Item'
        },
        {
          label: _('Party'), route: '#/list/Party'
        },
        {
          label: _('Invoice'), route: '#/list/Invoice'
        },
        {
          label: _('Tax'), route: '#/list/Tax'
        },
        {
          label: _('Account'), route: '#/list/Account'
        }
      ]
    },
    {
      title: _('Reports'),
      items: [
        {
          label: _('General Ledger'), route: '#/report/general-ledger'
        }
      ]
    }
  ]
};
