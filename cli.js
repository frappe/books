#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const utils = require('frappejs/utils');
const process = require('process');

program.command('new-model <name>')
	.description('Create a new model in the `models/doctype` folder')
	.action((name) => {
		fs.mkdirSync(`./models/doctype/${utils.slug(name)}`);
		fs.writeFileSync(`./models/doctype/${utils.slug(name)}/${utils.slug(name)}`, `{
	"name": "${name}",
	"doctype": "DocType",
	"issingle": 0,
	"istable": 0,
	"keyword_fields": [
	],
	"fields": [
		{
			"fieldname": "name",
			"label": "Name",
			"fieldtype": "Data",
			"reqd": 1
		}
	]
}`);
	});

program.parse(process.argv);