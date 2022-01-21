const cloneDeep = require('lodash/cloneDeep');

module.exports = {
  extend: (base, target, options = {}) => {
    base = cloneDeep(base);
    const fieldsToMerge = (target.fields || []).map(df => df.fieldname);
    const fieldsToRemove = options.skipFields || [];
    const overrideProps = options.overrideProps || [];
    for (let prop of overrideProps) {
      if (base.hasOwnProperty(prop)) {
        delete base[prop];
      }
    }

    let mergeFields = (baseFields, targetFields) => {
      let fields = cloneDeep(baseFields);
      fields = fields
        .filter(df => !fieldsToRemove.includes(df.fieldname))
        .map(df => {
          if (fieldsToMerge.includes(df.fieldname)) {
            let copy = cloneDeep(df);
            return Object.assign(
              copy,
              targetFields.find(tdf => tdf.fieldname === df.fieldname)
            );
          }
          return df;
        });
      let fieldsAdded = fields.map(df => df.fieldname);
      let fieldsToAdd = targetFields.filter(
        df => !fieldsAdded.includes(df.fieldname)
      );
      return fields.concat(fieldsToAdd);
    };

    let fields = mergeFields(base.fields, target.fields || []);
    let out = Object.assign(base, target);
    out.fields = fields;

    return out;
  },
  commonFields: [
    {
      fieldname: 'name',
      fieldtype: 'Data',
      required: 1
    }
  ],
  submittableFields: [
    {
      fieldname: 'submitted',
      fieldtype: 'Check',
      required: 1
    }
  ],
  parentFields: [
    {
      fieldname: 'owner',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'modifiedBy',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'creation',
      fieldtype: 'Datetime',
      required: 1
    },
    {
      fieldname: 'modified',
      fieldtype: 'Datetime',
      required: 1
    },
    {
      fieldname: 'keywords',
      fieldtype: 'Text'
    }
  ],
  childFields: [
    {
      fieldname: 'idx',
      fieldtype: 'Int',
      required: 1
    },
    {
      fieldname: 'parent',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'parenttype',
      fieldtype: 'Data',
      required: 1
    },
    {
      fieldname: 'parentfield',
      fieldtype: 'Data',
      required: 1
    }
  ],
  treeFields: [
    {
      fieldname: 'lft',
      fieldtype: 'Int'
    },
    {
      fieldname: 'rgt',
      fieldtype: 'Int'
    }
  ]
};
