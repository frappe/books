const fs = require('fs');
const utils = require('frappejs/utils');

module.exports = {
	make_model_files(name) {

		// [doctype].json
		fs.mkdirSync(`./models/doctype/${utils.slug(name)}`);
		fs.writeFileSync(`./models/doctype/${utils.slug(name)}/${utils.slug(name)}.json`, `{
	"name": "${name}",
	"doctype": "DocType",
	"isSingle": 0,
	"isChild": 0,
	"keywordFields": [],
	"fields": [
		{
			"fieldname": "name",
			"label": "Name",
			"fieldtype": "Data",
			"required": 1
		}
	]
}`);

		// [doctype].js
		let thinname = name.replace(/ /g, '');
		fs.writeFileSync(`./models/doctype/${utils.slug(name)}/${utils.slug(name)}.js`, `const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class ${thinname}Meta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./${utils.slug(name)}.json'));
	}
}

class ${thinname} extends BaseDocument {
}

module.exports = {
	Document: ${thinname},
	Meta: ${thinname}Meta
};`);

	}
}
