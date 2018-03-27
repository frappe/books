const fs = require('fs');

module.exports = {
    make_model_files(name) {

        // [doctype].json
        fs.mkdirSync(`./models/doctype/${name}`);
        fs.writeFileSync(`./models/doctype/${name}/${name}.js`, `module.exports = {
    name: "${name}",
    label: "${name}",
    naming: "name", // {random|autoincrement}
    isSingle: 0,
    isChild: 0,
    isSubmittable: 0,
    settings: null,
    keywordFields: [],
    fields: [
        {
            fieldname: "name",
            label: "Name",
            fieldtype: "Data",
            required: 1
        }
    ]
}`);

    }
}
