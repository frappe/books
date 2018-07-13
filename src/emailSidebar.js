const { _ } = require('frappejs/utils');

export default [
  {
    title: 'App',
    items: [
      {
        label: _('Email'), route: '#/email/Email'
      },
      {
        label: _('Email Account'), route: '#/Account/EmailAccount'
      }
    ]
  }
];
