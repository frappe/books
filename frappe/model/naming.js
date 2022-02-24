const frappe = require('frappe');
const { getRandomString } = require('frappe/utils');

module.exports = {
  async isNameAutoSet(doctype) {
    const doc = frappe.getNewDoc(doctype);
    if (doc.meta.naming === 'autoincrement') {
      return true;
    }

    if (!doc.meta.settings) {
      return false;
    }

    const { numberSeries } = await doc.getSettings();
    if (numberSeries) {
      return true;
    }

    return false;
  },

  async setName(doc) {
    if (frappe.isServer) {
      // if is server, always name again if autoincrement or other
      if (doc.meta.naming === 'autoincrement') {
        doc.name = await this.getNextId(doc.doctype);
        return;
      }

      if (doc.meta.settings) {
        const numberSeries = (await doc.getSettings()).numberSeries;
        if (numberSeries) {
          doc.name = await this.getSeriesNext(numberSeries, doc.doctype);
        }
      }
    }

    if (doc.name) {
      return;
    }

    // name === doctype for Single
    if (doc.meta.isSingle) {
      doc.name = doc.meta.name;
      return;
    }

    // assign a random name by default
    // override doc to set a name
    if (!doc.name) {
      doc.name = getRandomString();
    }
  },

  async getNextId(doctype) {
    // get the last inserted row
    let lastInserted = await this.getLastInserted(doctype);
    let name = 1;
    if (lastInserted) {
      let lastNumber = parseInt(lastInserted.name);
      if (isNaN(lastNumber)) lastNumber = 0;
      name = lastNumber + 1;
    }
    return (name + '').padStart(9, '0');
  },

  async getLastInserted(doctype) {
    const lastInserted = await frappe.db.getAll({
      doctype: doctype,
      fields: ['name'],
      limit: 1,
      order_by: 'creation',
      order: 'desc',
    });
    return lastInserted && lastInserted.length ? lastInserted[0] : null;
  },

  async getSeriesNext(prefix, doctype) {
    let series;
    try {
      series = await frappe.getDoc('NumberSeries', prefix);
    } catch (e) {
      if (!e.statusCode || e.statusCode !== 404) {
        throw e;
      }
      await this.createNumberSeries(prefix);
      series = await frappe.getDoc('NumberSeries', prefix);
    }
    let next = await series.next(doctype);
    return prefix + next;
  },

  async createNumberSeries(prefix, setting, start = 1001) {
    if (!(await frappe.db.exists('NumberSeries', prefix))) {
      const series = frappe.newDoc({
        doctype: 'NumberSeries',
        name: prefix,
        current: start,
      });
      await series.insert();

      if (setting) {
        const settingDoc = await frappe.getSingle(setting);
        settingDoc.numberSeries = series.name;
        await settingDoc.update();
      }
    }
  },
};
