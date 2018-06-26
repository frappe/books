const { _ } = require('frappejs/utils');

export default [
  {
    items: [
      {
        label: 'ToDo', route: '#/list/ToDo'
      },
      {
        label: 'Event', route: '#/list/Event'
      }
    ]
  },
  {
    title: 'Masters',
    items: [
      {
        label: 'Item', route: '#/list/Item'
      },
      {
        label: 'Party', route: '#/list/Party'
      },
      {
        label: 'Invoice', route: '#/list/Invoice'
      },
      {
        label: 'Tax', route: '#/list/Tax'
      },
      {
        label: 'Account', route: '#/list/Account'
      }
    ]
  },
  {
    title: 'Reports',
    items: [
      {
        label: 'General Ledger', route: '#/report/general-ledger'
      }
    ]
  },
  {
    title: 'App',
    items: [{
      label: 'Point Of Sale', route: '#/pos/'
    }]
  }
]
