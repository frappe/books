#!/usr/bin/env node

const program = require('commander');
const process = require('process');
const package = require('./package.json');
const boilerplate = require('frappejs/model/boilerplate');

program
    .version(package.version)

program
    .command('start [mode]')
    .description('Start development server')
    .action(require('./webpack/start'))

program
    .command('build [mode]')
    .description('Build assets for production')
    .action(require('./webpack/build'))

program
    .command('new-model <name>')
    .description('Create a new model in the `models/doctype` folder')
    .action((name) => {
        boilerplate.make_model_files(name);
    });

program.parse(process.argv);