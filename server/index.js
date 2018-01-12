const backends = {};
backends.sqlite = require('frappe-core/backends/sqlite');

const express = require('express');
const app = express();
const frappe = require('frappe-core');
const rest_api = require('./rest_api')
const models = require('frappe-core/server/models');
const common = require('frappe-core/common');
const bodyParser = require('body-parser');

module.exports = {
    async init() {
        await frappe.init();
        common.init_libs(frappe);
        await frappe.login();

        // walk and find models
        models.init();

    },

    async init_db({backend, connection_params}) {
        frappe.db = await new backends[backend].Database(connection_params);
        await frappe.db.connect();
        await frappe.db.migrate();
    },

    async start({backend, connection_params, static}) {
        await this.init();
        await this.init_db({backend:backend, connection_params:connection_params});
        // database

        // app
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(express.static('./'));

        app.use(function (err, req, res, next) {
            console.error(err.stack);
            res.status(500).send('Something broke!');
        })
        // routes
        rest_api.setup(app);

        // listen
        frappe.app = app;
        frappe.server = app.listen(frappe.config.port);

    }
}

