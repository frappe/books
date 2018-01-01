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
	],
	type_map: {
		'Currency':		'real'
		,'Int':			'integer'
		,'Float':		'real'
		,'Percent':		'real'
		,'Check':		'integer'
		,'Small Text':	'text'
		,'Long Text':	'text'
		,'Code':		'text'
		,'Text Editor':	'text'
		,'Date':		'text'
		,'Datetime':	'text'
		,'Time':		'text'
		,'Text':		'text'
		,'Data':		'text'
		,'Link':		'text'
		,'Dynamic Link':'text'
		,'Password':	'text'
		,'Select':		'text'
		,'Read Only':	'text'
		,'Attach':		'text'
		,'Attach Image':'text'
		,'Signature':	'text'
		,'Color':		'text'
		,'Barcode':		'text'
		,'Geolocation':	'text'
	}
};