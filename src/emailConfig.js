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
          label: _('Inbox'), route: '#/list/Email/INBOX'
        },
        {
          label: _('Sent'), route: '#/list/Email/SENT'
        },
        {
          label: _('Starred'), route: '#/list/Email/STARRED'
        },
        {
          label: _('Draft'), route: '#/list/Email/DRAFT'
        }
      ]
    }
  ]
};
