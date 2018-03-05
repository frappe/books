module.exports = {
    commonFields: [
        {
            fieldname: 'name', fieldtype: 'Data', required: 1
        }
    ],
    parentFields: [
        {
            fieldname: 'owner', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'modifieldBy', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'creation', fieldtype: 'Datetime', required: 1
        },
        {
            fieldname: 'modified', fieldtype: 'Datetime', required: 1
        },
        {
            fieldname: 'keywords', fieldtype: 'Text'
        }
    ],
    childFields: [
        {
            fieldname: 'idx', fieldtype: 'Int', required: 1
        },
        {
            fieldname: 'parent', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'parenttype', fieldtype: 'Data', required: 1
        },
        {
            fieldname: 'parentfield', fieldtype: 'Data', required: 1
        }
    ]
};