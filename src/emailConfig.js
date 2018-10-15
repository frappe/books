import frappe from 'frappejs';
import { _ } from 'frappejs/utils';

export default {
  async getTitle() {
    const accountingSettings = await frappe.getSingle('AccountingSettings');
    return accountingSettings.companyName;
  },
  groups: [
    {
      items: [
        {
          label: _('Main Menu'), route: '#/setup-wizard'
        },
        {
          label: _('Email Account'), route: '#/list/EmailAccount'
        }
      ]
    },
    {
      title: 'App',
      items: [
        {
          label: _('INBOX'), route: '#/list/Email/INBOX'
        },
        {
          label: _('SENT'), route: '#/list/Email/SENT'
        },
        {
          label: _('STARRED'), route: '#/list/Email/STARRED'
        },
        {
          label: _('DRAFT'), route: '#/list/Email/DRAFT'
        },
        {
          label: _('SPAM'), route: '#/list/Email/SPAM'
        },
        {
          label: _('TRASH'), route: '#/list/Email/TRASH'
        }
      ]
    }
  ]
};
