const backends = {};
backends.sqlite = require('frappejs/backends/sqlite');
//backends.mysql = require('frappejs/backends/mysql');

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const frappe = require('frappejs');
const restAPI = require('./restAPI');
const frappeModels = require('frappejs/models');
const common = require('frappejs/common');
const bodyParser = require('body-parser');
const fs = require('fs');
const { setupExpressRoute: setRouteForPDF } = require('frappejs/server/pdf');
const auth = require('./../auth/auth')();
const morgan = require('morgan')

require.extensions['.html'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

module.exports = {
    async start({backend, connectionParams, models, staticPath = './', authConfig=null}) {
        await this.init();

        if (models) {
            frappe.registerModels(models, 'server');
        }

        // database
        await this.initDb({backend:backend, connectionParams:connectionParams});

        // app
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(express.static(staticPath));
        app.use(morgan('tiny'));

        if(authConfig) {
            app.post("/api/login", auth.login);
            app.use(auth.initialize(authConfig));
            app.all("/api/resource/*", auth.authenticate());
        }

        // socketio
        io.on('connection', function (socket) {
            frappe.db.bindSocketServer(socket);
        });
        // routes
        restAPI.setup(app);

        // listen
        server.listen(frappe.config.port);

        frappe.app = app;
        frappe.server = server;

        setRouteForPDF();
    },

    async init() {
        frappe.isServer = true;
        await frappe.init();
        frappe.registerModels(frappeModels, 'server');
        frappe.registerLibs(common);

        await frappe.login();
    },

    async initDb({backend, connectionParams}) {
        frappe.db = await new backends[backend](connectionParams);
        await frappe.db.connect();
        await frappe.db.migrate();
    },
}
