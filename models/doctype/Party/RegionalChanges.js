import party from './Party';

party.fields.splice(3, 0, {
  //insert at 3rd position
  fieldname: 'gstin',
  label: 'GSTIN No.',
  fieldtype: 'Data',
  hidden: form => {
    return form.gstType === 'Registered Regular' ? 0 : 1;
  }
});
party.fields.splice(4, 0, {
  fieldname: 'gstType',
  label: 'GST Registration Type',
  fieldtype: 'Select',
  options: ['Unregistered', 'Registered Regular', 'Consumer']
});
party.fields.join();
const newParty = party;

export default newParty;
