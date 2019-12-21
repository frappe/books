module.exports = {
  name: 'GetStarted',
  isSingle: 1,
  fields: [
    {
      fieldname: 'needOnboarding',
      label: 'Need Onboarding',
      fieldtype: 'Check',
      default: 1
    },
    {
      fieldname: 'salesItemCreated',
      label: 'Sales Item Created',
      fieldtype: 'Check'
    }
  ]
};
