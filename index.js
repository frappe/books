
module.exports = {
    async init() {
        if (this._initialized) return;
        this.initConfig();
        this.initGlobals();
        this._initialized = true;
    },

    initConfig() {
        this.config = {
            backend: 'sqlite',
            port: 8000
        };
    },

    initGlobals() {
        this.metaCache = {};
        this.models = {};
        this.forms = {};
        this.views = {};
        this.docs = {};
        this.flags = {
            cacheDocs: false
        }
    },

    registerLibs(common) {
        // add standard libs and utils to frappe
        common.initLibs(this);
    },

    registerModels(models) {
        Object.assign(this.models, models);
    },

    registerView(view, doctype, module) {
        if (!this.views[view]) this.views[view] = {};
        this.views[view][doctype] = module;
    },

    addToCache(doc) {
        if (!this.flags.cacheDocs) return;

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
        }
    },

    getDocFromCache(doctype, name) {
        if (this.docs[doctype] && this.docs[doctype][name]) {
            return this.docs[doctype][name];
        }
    },

    getMeta(doctype) {
        if (!this.metaCache[doctype]) {
            let model = this.models[doctype];
            if (!model) {
                throw `${doctype} is not a registered doctype`;
            }
            let metaClass = model.metaClass || this.BaseMeta;
            this.metaCache[doctype] = new metaClass(model);
        }

        return this.metaCache[doctype];
    },

    async getDoc(doctype, name) {
        let doc = this.getDocFromCache(doctype, name);
        if (!doc) {
            doc = new (this.getDocumentClass(doctype))({doctype:doctype, name: name});
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
            if (field.fieldname === 'name') continue;
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

    async getNewDoc(doctype) {
        let doc = this.newDoc({doctype: doctype});
        doc._notInserted = true;
        doc.name = this.getRandomName();
        this.addToCache(doc);
        return doc;
    },

    newDoc(data) {
        let doc = new (this.getDocumentClass(data.doctype))(data);
        doc.setDefaults();
        return doc;
    },

    async insert(data) {
        return await (this.newDoc(data)).insert();
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

    login(user='guest', user_key) {
        this.session = {user: user};
    },

    close() {
        this.db.close();

        if (this.server) {
            this.server.close();
        }
    }
};
