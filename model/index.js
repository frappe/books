const deepmerge = require('deepmerge');

module.exports = {
    extend: (base, target, options = {}) => {
        const fieldsToMerge = (target.fields || []).map(df => df.fieldname);
        const fieldsToRemove = options.skipFields || [];

        base.fields = base.fields
            .filter(df => !fieldsToRemove.includes(df.fieldname))
            .map(df => {
                if (fieldsToMerge.includes(df.fieldname)) {
                    return deepmerge(df, target.fields.find(tdf => tdf.fieldname === df.fieldname));
                }
                return df;
            });

        const overrideProps = options.overrideProps || [];
        for (let prop of overrideProps) {
            if (base.hasOwnProperty(prop)) {
                delete base[prop];
            }
        }

        return deepmerge(base, target);
    },
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
            fieldname: 'modifiedBy', fieldtype: 'Data', required: 1
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
    ],
    treeFields: [
        {
            fieldname: 'lft', fieldtype: 'Int', required: 1
        },
        {
            fieldname: 'rgt', fieldtype: 'Int', required: 1
        }
    ]
};
