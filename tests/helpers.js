const server = require('frappejs/server');
const frappe = require('frappejs');

module.exports = {
    async initSqlite({dbPath = '_test.db', models} = {}) {
        server.init();
        if (models) {
            frappe.registerModels(models, 'server');
        }
        await server.initDb({
            backend: 'sqlite',
            connectionParams: {dbPath: dbPath},
        });
    }
}