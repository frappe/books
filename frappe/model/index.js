module.exports = {
	standard_fields: [
		{
			fieldname: 'name', fieldtype: 'Data', reqd: 1
		},
		{
			fieldname: 'owner', fieldtype: 'Link', reqd: 1, options: 'User'
		},
		{
			fieldname: 'modified_by', fieldtype: 'Link', reqd: 1, options: 'User'
		},
		{
			fieldname: 'creation', fieldtype: 'Datetime', reqd: 1
		},
		{
			fieldname: 'modified', fieldtype: 'Datetime', reqd: 1
		},
		{
			fieldname: 'docstatus', fieldtype: 'Int', reqd: 1, default: 0
		}
	],
	child_fields: [
		{
			fieldname: 'idx', fieldtype: 'Int', reqd: 1
		},
		{
			fieldname: 'parent', fieldtype: 'Data', reqd: 1
		},
		{
			fieldname: 'parenttype', fieldtype: 'Link', reqd: 1, options: 'DocType'
		},
		{
			fieldname: 'parentfield', fieldtype: 'Data', reqd: 1
		}
	]
};