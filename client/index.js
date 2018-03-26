const common = require('frappejs/common');
const HTTPClient = require('frappejs/backends/http');
const frappe = require('frappejs');
frappe.ui = require('./ui');
const Desk = require('./desk');
const Observable = require('frappejs/utils/observable');

module.exports = {
    async start({server, columns = 2}) {
        window.frappe = frappe;
        frappe.init();
        frappe.registerLibs(common);
        frappe.registerModels(require('frappejs/models'), 'client');
        frappe.registerModels(require('../models'), 'client');

        frappe.fetch = window.fetch.bind();

        this.setCall();
        frappe.db = await new HTTPClient({server: server});
        this.socket = io.connect('http://localhost:8000'); // eslint-disable-line
        frappe.db.bindSocketClient(this.socket);

        frappe.docs = new Observable();

        await frappe.getSingle('SystemSettings');

        frappe.desk = new Desk(columns);
        await frappe.login();
    },

    setCall() {
        frappe.call = async ({method, type='get', args}) => {
            let url = `/api/method/${method}`;
            let request = {};

            if (args) {
                if (type.toLowerCase()==='get') {
                    url += '?' + frappe.getQueryString(args);
                } else {
                    // POST / PUT / DELETE
                    request.body = JSON.stringify(args);
                }
            }

            request.headers = { 'Accept': 'application/json' };
            request.method = type.toUpperCase();

            let response = await fetch(url, request);

            return await response.json();
        }
    }
};

