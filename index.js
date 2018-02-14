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
        this.modules = {};
        this.docs = {};
        this.flags = {
            cache_docs: false
        }
    },

    addToCache(doc) {
        if (!this.flags.cache_docs) return;

        // add to `docs` cache
        if (doc.doctype && doc.name) {
            if (!this.docs[doc.doctype]) {
                this.docs[doc.doctype] = {};
            }
            this.docs[doc.doctype][doc.name] = doc;
        }
    },

    getDocFromCache(doctype, name) {
        if (this.docs[doctype] && this.docs[doctype][name]) {
            return this.docs[doctype][name];
        }
    },

    getMeta(doctype) {
        if (!this.metaCache[doctype]) {
            this.metaCache[doctype] = new (this.getMetaClass(doctype))();
        }
        return this.metaCache[doctype];
    },

    getMetaClass(doctype) {
        doctype = this.slug(doctype);
        if (this.modules[doctype] && this.modules[doctype].Meta) {
            return this.modules[doctype].Meta;
        } else {
            return this.BaseMeta;
        }
    },

    async getDoc(doctype, name) {
        let doc = this.getDocFromCache(doctype, name);
        if (!doc) {
            let controllerClass = this.getControllerClass(doctype);
            doc = new controllerClass({doctype:doctype, name: name});
            await doc.load();
            this.addToCache(doc);
        }
        return doc;
    },

    async getSingle(doctype) {
        return await this.getDoc(doctype, doctype);
    },

    async getDuplicate(doc) {
        const newDoc = await this.getNewDoc(doc.doctype);
        for (let field of this.getMeta(doc.doctype).getValidFields()) {
            if (field.fieldname === 'name') continue;
            if (field.fieldtype === 'Table') {
                newDoc[field.fieldname] = (doc[field.fieldname] || []).map(d => Object.assign({}, d));
            } else {
                newDoc[field.fieldname] = doc[field.fieldname];
            }
        }
        return newDoc;
    },

    newDoc(data) {
        let controllerClass = this.getControllerClass(data.doctype);
        let doc = new controllerClass(data);
        doc.setDefaults();
        return doc;
    },

    getControllerClass(doctype) {
        doctype = this.slug(doctype);
        if (this.modules[doctype] && this.modules[doctype].Document) {
            return this.modules[doctype].Document;
        } else {
            return this.BaseDocument;
        }
    },

    async getNewDoc(doctype) {
        let doc = this.newDoc({doctype: doctype});
        doc._notInserted = true;
        doc.name = this.getRandomName();
        this.addToCache(doc);
        return doc;
    },

    async insert(data) {
        return await (this.newDoc(data)).insert();
    },

    login(user='guest', user_key) {
        this.session = new this._session.Session(user);
        if (user && user_key) {
            this.authenticate(user_key);
        }
    },

    close() {
        this.db.close();

        if (this.server) {
            this.server.close();
        }
    }
};
