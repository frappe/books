import { getMoneyMaker } from 'pesa';
import { markRaw } from 'vue';
import { AuthHandler } from './core/authHandler';
import { asyncHandler, getDuplicates, getRandomString } from './utils';
import {
  DEFAULT_DISPLAY_PRECISION,
  DEFAULT_INTERNAL_PRECISION,
} from './utils/consts';
import * as errors from './utils/errors';
import { format } from './utils/format';
import Observable from './utils/observable';
import { t, T } from './utils/translation';

export class Frappe {
  t = t;
  T = T;
  format = format;

  errors = errors;
  isElectron = false;
  isServer = false;

  constructor() {
    this.auth = new AuthHandler();
  }

  async initializeAndRegister(customModels = {}, force = false) {
    this.init(force);

    this.Meta = (await import('frappe/model/meta')).default;
    this.Document = (await import('frappe/model/document')).default;

    const coreModels = await import('frappe/models');
    this.registerModels(coreModels.default);
    this.registerModels(customModels);
  }

  init(force) {
    if (this._initialized && !force) return;

    // Initialize Globals
    this.metaCache = {};
    this.models = {};

    this.methods = {};
    this.errorLog = [];

    // temp params while calling routes
    this.temp = {};

    this.docs = new Observable();
    this.events = new Observable();
    this._initialized = true;
  }

  registerModels(models) {
    // register models from app/models/index.js
    for (let doctype in models) {
      let metaDefinition = models[doctype];
      if (!metaDefinition.name) {
        throw new Error(`Name is mandatory for ${doctype}`);
      }
      if (metaDefinition.name !== doctype) {
        throw new Error(
          `Model name mismatch for ${doctype}: ${metaDefinition.name}`
        );
      }
      let fieldnames = (metaDefinition.fields || [])
        .map((df) => df.fieldname)
        .sort();
      let duplicateFieldnames = getDuplicates(fieldnames);
      if (duplicateFieldnames.length > 0) {
        throw new Error(
          `Duplicate fields in ${doctype}: ${duplicateFieldnames.join(', ')}`
        );
      }

      this.models[doctype] = metaDefinition;
    }
  }

  registerMethod({ method, handler }) {
    this.methods[method] = handler;
    if (this.app) {
      // add to router if client-server
      this.app.post(
        `/api/method/${method}`,
        asyncHandler(async function (request, response) {
          let data = await handler(request.body);
          if (data === undefined) {
            data = {};
          }
          return response.json(data);
        })
      );
    }
  }

  async initializeMoneyMaker(currency) {
    currency ??= 'XXX';

    // to be called after db initialization
    const values =
      (await frappe.db?.getSingleValues(
        {
          fieldname: 'internalPrecision',
          parent: 'SystemSettings',
        },
        {
          fieldname: 'displayPrecision',
          parent: 'SystemSettings',
        }
      )) ?? [];

    let { internalPrecision: precision, displayPrecision: display } =
      values.reduce((acc, { fieldname, value }) => {
        acc[fieldname] = value;
        return acc;
      }, {});

    if (typeof precision === 'undefined') {
      precision = DEFAULT_INTERNAL_PRECISION;
    }

    if (typeof precision === 'string') {
      precision = parseInt(precision);
    }

    if (typeof display === 'undefined') {
      display = DEFAULT_DISPLAY_PRECISION;
    }

    if (typeof display === 'string') {
      display = parseInt(display);
    }

    this.pesa = getMoneyMaker({
      currency,
      precision,
      display,
      wrapper: markRaw,
    });
  }

  getModels(filterFunction) {
    let models = [];
    for (let doctype in this.models) {
      models.push(this.models[doctype]);
    }
    return filterFunction ? models.filter(filterFunction) : models;
  }

  async call({ method, args }) {
    if (this.isServer) {
      if (this.methods[method]) {
        return await this.methods[method](args);
      } else {
        throw new Error(`${method} not found`);
      }
    }

    let url = `/api/method/${method}`;
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args || {}),
    });
    return await response.json();
  }

  addToCache(doc) {
    if (!this.docs) return;

    // add to `docs` cache
    if (doc.doctype && doc.name) {
      if (!this.docs[doc.doctype]) {
        this.docs[doc.doctype] = {};
      }
      this.docs[doc.doctype][doc.name] = doc;

      // singles available as first level objects too
      if (doc.doctype === doc.name) {
        this[doc.name] = doc;
      }

      // propogate change to `docs`
      doc.on('change', (params) => {
        this.docs.trigger('change', params);
      });
    }
  }

  removeFromCache(doctype, name) {
    try {
      delete this.docs[doctype][name];
    } catch (e) {
      console.warn(`Document ${doctype} ${name} does not exist`);
    }
  }

  isDirty(doctype, name) {
    return (
      (this.docs &&
        this.docs[doctype] &&
        this.docs[doctype][name] &&
        this.docs[doctype][name]._dirty) ||
      false
    );
  }

  getDocFromCache(doctype, name) {
    if (this.docs && this.docs[doctype] && this.docs[doctype][name]) {
      return this.docs[doctype][name];
    }
  }

  getMeta(doctype) {
    if (!this.metaCache[doctype]) {
      let model = this.models[doctype];
      if (!model) {
        throw new Error(`${doctype} is not a registered doctype`);
      }

      let metaClass = model.metaClass || this.Meta;
      this.metaCache[doctype] = new metaClass(model);
    }

    return this.metaCache[doctype];
  }

  async getDoc(doctype, name, options = { skipDocumentCache: false }) {
    let doc = options.skipDocumentCache
      ? null
      : this.getDocFromCache(doctype, name);
    if (!doc) {
      doc = new (this.getDocumentClass(doctype))({
        doctype: doctype,
        name: name,
      });
      await doc.load();
      this.addToCache(doc);
    }
    return doc;
  }

  getDocumentClass(doctype) {
    const meta = this.getMeta(doctype);
    return meta.documentClass || this.Document;
  }

  async getSingle(doctype) {
    return await this.getDoc(doctype, doctype);
  }

  async getDuplicate(doc) {
    const newDoc = await this.getEmptyDoc(doc.doctype);
    for (let field of this.getMeta(doc.doctype).getValidFields()) {
      if (['name', 'submitted'].includes(field.fieldname)) continue;
      if (field.fieldtype === 'Table') {
        newDoc[field.fieldname] = (doc[field.fieldname] || []).map((d) => {
          let newd = Object.assign({}, d);
          newd.name = '';
          return newd;
        });
      } else {
        newDoc[field.fieldname] = doc[field.fieldname];
      }
    }
    return newDoc;
  }

  getEmptyDoc(doctype, cacheDoc = true) {
    let doc = this.getNewDoc({ doctype: doctype });
    doc._notInserted = true;
    doc.name = getRandomString();

    if (cacheDoc) {
      this.addToCache(doc);
    }

    return doc;
  }

  getNewDoc(data) {
    let doc = new (this.getDocumentClass(data.doctype))(data);
    doc.setDefaults();
    return doc;
  }

  createMeta(fields) {
    return new this.Meta({ isCustom: 1, fields });
  }

  async syncDoc(data) {
    let doc;
    if (await this.db.exists(data.doctype, data.name)) {
      doc = await this.getDoc(data.doctype, data.name);
      Object.assign(doc, data);
      await doc.update();
    } else {
      doc = this.getNewDoc(data);
      await doc.insert();
    }
  }

  close() {
    this.db.close();
    this.auth.logout();
  }

  store = {
    isDevelopment: false,
    appVersion: '',
  };
}

export { T, t };
export default new Frappe();
