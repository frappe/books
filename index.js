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
        this.meta_cache = {};
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
        if (!this.meta_cache[doctype]) {
            this.meta_cache[doctype] = new (this.getMetaClass(doctype))();
        }
        return this.meta_cache[doctype];
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
            let controller_class = this.getControllerClass(doctype);
            doc = new controller_class({doctype:doctype, name: name});
            await doc.load();
            this.addToCache(doc);
        }
        return doc;
    },

    newDoc(data) {
        let controller_class = this.getControllerClass(data.doctype);
        return new controller_class(data);
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
        doc.setName();
        doc.__not_inserted = true;
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
