const Observable = require('./utils/observable');
const utils = require('./utils');

module.exports = {
  async init() {
    if (this._initialized) return;
    this.initConfig();
    this.initGlobals();
    this.docs = new Observable();
    this.events = new Observable();
    this._initialized = true;
  },

  initConfig() {
    this.config = {
      serverURL: '',
      backend: 'sqlite',
      port: 8000
    };
  },

  initGlobals() {
    this.metaCache = {};
    this.models = {};
    this.forms = {};
    this.views = {};
    this.flags = {};
    this.methods = {};
    // temp params while calling routes
    this.params = {};
  },

  registerLibs(common) {
    // add standard libs and utils to frappe
    common.initLibs(this);
  },

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
      let fieldnames = (metaDefinition.fields || []).map(df => df.fieldname).sort();
      let duplicateFieldnames = utils.getDuplicates(fieldnames);
      if (duplicateFieldnames.length > 0) {
        throw new Error(
          `Duplicate fields in ${doctype}: ${duplicateFieldnames.join(', ')}`
        );
      }

      this.models[doctype] = metaDefinition;
    }
  },

  getModels(filterFunction) {
    let models = [];
    for (let doctype in this.models) {
      models.push(this.models[doctype]);
    }
    return filterFunction ? models.filter(filterFunction) : models;
  },

  registerView(view, name, module) {
    if (!this.views[view]) this.views[view] = {};
    this.views[view][name] = module;
  },

  registerMethod({ method, handler }) {
    this.methods[method] = handler;
    if (this.app) {
      // add to router if client-server
      this.app.post(
        `/api/method/${method}`,
        this.asyncHandler(async function(request, response) {
          let data = await handler(request.body);
          if (data === undefined) {
            data = {};
          }
          return response.json(data);
        })
      );
    }
  },

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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(args || {})
    });
    return await response.json();
  },

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
      doc.on('change', params => {
        this.docs.trigger('change', params);
      });
    }
  },

  removeFromCache(doctype, name) {
    try {
      delete this.docs[doctype][name];
    } catch (e) {
      console.warn(`Document ${doctype} ${name} does not exist`);
    }
  },

  isDirty(doctype, name) {
    return (
      (this.docs &&
        this.docs[doctype] &&
        this.docs[doctype][name] &&
        this.docs[doctype][name]._dirty) ||
      false
    );
  },

  getDocFromCache(doctype, name) {
    if (this.docs && this.docs[doctype] && this.docs[doctype][name]) {
      return this.docs[doctype][name];
    }
  },

  getMeta(doctype) {
    if (!this.metaCache[doctype]) {
      let model = this.models[doctype];
      if (!model) {
        throw new Error(`${doctype} is not a registered doctype`);
      }
      let metaClass = model.metaClass || this.BaseMeta;
      this.metaCache[doctype] = new metaClass(model);
    }

    return this.metaCache[doctype];
  },

  async getDoc(doctype, name) {
    let doc = this.getDocFromCache(doctype, name);
    if (!doc) {
      doc = new (this.getDocumentClass(doctype))({
        doctype: doctype,
        name: name
      });
      await doc.load();
      this.addToCache(doc);
    }
    return doc;
  },

  getDocumentClass(doctype) {
    const meta = this.getMeta(doctype);
    return meta.documentClass || this.BaseDocument;
  },

  async getSingle(doctype) {
    return await this.getDoc(doctype, doctype);
  },

  async getDuplicate(doc) {
    const newDoc = await this.getNewDoc(doc.doctype);
    for (let field of this.getMeta(doc.doctype).getValidFields()) {
      if (['name', 'submitted'].includes(field.fieldname)) continue;
      if (field.fieldtype === 'Table') {
        newDoc[field.fieldname] = (doc[field.fieldname] || []).map(d => {
          let newd = Object.assign({}, d);
          newd.name = '';
          return newd;
        });
      } else {
        newDoc[field.fieldname] = doc[field.fieldname];
      }
    }
    return newDoc;
  },

  getNewDoc(doctype) {
    let doc = this.newDoc({ doctype: doctype });
    doc._notInserted = true;
    doc.name = frappe.getRandomString();
    this.addToCache(doc);
    return doc;
  },

  async newCustomDoc(fields) {
    let doc = new this.BaseDocument({ isCustom: 1, fields });
    doc._notInserted = true;
    doc.name = this.getRandomString();
    this.addToCache(doc);
    return doc;
  },

  createMeta(fields) {
    let meta = new this.BaseMeta({ isCustom: 1, fields });
    return meta;
  },

  newDoc(data) {
    let doc = new (this.getDocumentClass(data.doctype))(data);
    doc.setDefaults();
    return doc;
  },

  async insert(data) {
    return await this.newDoc(data).insert();
  },

  async syncDoc(data) {
    let doc;
    if (await this.db.exists(data.doctype, data.name)) {
      doc = await this.getDoc(data.doctype, data.name);
      Object.assign(doc, data);
      await doc.update();
    } else {
      doc = this.newDoc(data);
      await doc.insert();
    }
  },

  // only for client side
  async login(email, password) {
    if (email === 'Administrator') {
      this.session = {
        user: 'Administrator'
      };
      return;
    }

    let response = await fetch(this.getServerURL() + '/api/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.status === 200) {
      const res = await response.json();

      this.session = {
        user: email,
        token: res.token
      };

      return res;
    }

    return response;
  },

  async signup(email, fullName, password) {
    let response = await fetch(this.getServerURL() + '/api/signup', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, fullName, password })
    });

    if (response.status === 200) {
      return await response.json();
    }

    return response;
  },

  getServerURL() {
    return this.config.serverURL || '';
  },

  close() {
    this.db.close();

    if (this.server) {
      this.server.close();
    }
  }
};
