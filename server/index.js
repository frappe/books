const backends = {};
backends.sqlite = require('frappejs/backends/sqlite');
//backends.mysql = require('frappejs/backends/mysql');

const express = require('express');
const app = express();
const frappe = require('frappejs');
const rest_api = require('./rest_api');
const frappeModels = require('frappejs/models');
const common = require('frappejs/common');
const bodyParser = require('body-parser');

module.exports = {
    async start({backend, connectionParams, models}) {
        await this.init();

        if (models) {
            frappe.registerModels(models);
        }

        // database
        await this.initDb({backend:backend, connectionParams:connectionParams});

        // app
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(express.static('./'));

        // routes
        rest_api.setup(app);

        // listen
        frappe.app = app;
        frappe.server = app.listen(frappe.config.port);
    },

    async init() {
        await frappe.init();
        frappe.registerModels(frappeModels);
        frappe.registerLibs(common);
        await frappe.login();
    },

    async initDb({backend, connectionParams}) {
        frappe.db = await new backends[backend](connectionParams);
        await frappe.db.connect();
        await frappe.db.migrate();
    },
}
