const common = require('frappejs/common');
const HTTPClient = require('frappejs/backends/http');
const frappe = require('frappejs');
frappe.ui = require('./ui');
const Desk = require('./desk');
const Observable = require('frappejs/utils/observable');
const { getPDF } = require('frappejs/client/pdf');

module.exports = {
    async start({server, columns = 2, makeDesk = false}) {
        window.frappe = frappe;
        frappe.init();
        frappe.registerLibs(common);
        frappe.registerModels(require('frappejs/models'), 'client');
        frappe.fetch = window.fetch.bind();

        frappe.db = await new HTTPClient({server: server});
        this.socket = io.connect(`http://${server}`); // eslint-disable-line
        frappe.db.bindSocketClient(this.socket);

        frappe.docs = new Observable();
        await frappe.getSingle('SystemSettings');

        if(makeDesk) {
            this.makeDesk(columns);
        }
    },

    async makeDesk(columns) {
        frappe.desk = new Desk(columns);
        await frappe.login();
    },

    setCall() {
        frappe.call = async (method, args) => {
            let url = `/api/method/${method}`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(args || {})
            });

            return await response.json();
        }

        frappe.getPDF = getPDF;
    }
};

