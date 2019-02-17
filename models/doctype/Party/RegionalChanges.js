const party = require('./Party')

party.fields.splice(3, 0, { //insert at 3rd position
  fieldname: 'gstin',
  label: 'GSTIN No.',
  fieldtype: 'Data',
  hidden: 0
})
party.fields.join()
const newParty = party

module.exports = newParty