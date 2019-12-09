const frappe = require('frappejs');
const server = require('frappejs/server');
const SQLite = require('frappejs/backends/sqlite');

module.exports = {
  async initSqlite({ dbPath = '_test.db', models } = {}) {
    server.init();
    if (models) {
      frappe.registerModels(models, 'server');
    }

    frappe.db = new SQLite({ dbPath });
    await frappe.db.connect();
    await frappe.db.migrate();
  }
};
