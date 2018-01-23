const backends = {};
backends.sqlite = require('frappejs/backends/sqlite');

const express = require('express');
const app = express();
const frappe = require('frappejs');
const rest_api = require('./rest_api')
const models = require('frappejs/server/models');
const common = require('frappejs/common');
const bodyParser = require('body-parser');
const path = require('path');

module.exports = {
    async start({backend, connection_params, static, models_path}) {
        await this.init();
        models.init_models(path.resolve('node_modules', 'frappejs', 'models'));
        models.init_models(models_path);

        await this.init_db({backend:backend, connection_params:connection_params});
        // database

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
        common.init_libs(frappe);
        await frappe.login();
    },

    async init_db({backend, connection_params}) {
        frappe.db = await new backends[backend].Database(connection_params);
        await frappe.db.connect();
        await frappe.db.migrate();
    },
}

