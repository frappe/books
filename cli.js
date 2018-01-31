#!/usr/bin/env node

const program = require('commander');
const process = require('process');
const boilerplate = require('frappejs/model/boilerplate');

program.command('new-model <name>')
	.description('Create a new model in the `models/doctype` folder')
	.action((name) => {
		boilerplate.make_model_files(name);
	});

program.parse(process.argv);