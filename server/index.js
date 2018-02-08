const backends = {};
backends.sqlite = require('frappejs/backends/sqlite');

const express = require('express');
const app = express();
const frappe = require('frappejs');
const rest_api = require('./rest_api')
const init_models = require('frappejs/server/init_models');
const common = require('frappejs/common');
const bodyParser = require('body-parser');
const path = require('path');

module.exports = {
    async start({backend, connection_params, static, models_path}) {
        await this.init();

        this.init_models(models_path);

        // database
        await this.init_db({backend:backend, connection_params:connection_params});

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

    init_models(models_path) {
        // import frappe modules
        init_models(path.join(path.dirname(require.resolve('frappejs')), 'models'));

        // import modules from the app
        init_models(models_path);
    },

    async init() {
        await frappe.init();
        common.init_libs(frappe);
        await frappe.login();
    },

    async init_db({backend, connection_params}) {
        frappe.db = await new backends[backend](connection_params);
        await frappe.db.connect();
        await frappe.db.migrate();
    },
}

