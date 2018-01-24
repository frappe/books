module.exports = {
    async init() {
        if (this._initialized) return;
        this.init_config();
        this.init_globals();
        this._initialized = true;
    },

    init_config() {
        this.config = {
            backend: 'sqlite',
            port: 8000
        };
    },

    init_globals() {
        this.meta_cache = {};
        this.modules = {};
        this.docs = {};
        this.flags = {
            cache_docs: false
        }
    },

    add_to_cache(doc) {
        if (!this.flags.cache_docs) return;

        // add to `docs` cache
        if (doc.doctype && doc.name) {
            if (!this.docs[doc.doctype]) {
                this.docs[doc.doctype] = {};
            }
            this.docs[doc.doctype][doc.name] = doc;
        }
    },

    get_doc_from_cache(doctype, name) {
        if (this.docs[doctype] && this.docs[doctype][name]) {
            return this.docs[doctype][name];
        }
    },

    get_meta(doctype) {
        if (!this.meta_cache[doctype]) {
            this.meta_cache[doctype] = new (this.get_meta_class(doctype))();
        }
        return this.meta_cache[doctype];
    },

    get_meta_class(doctype) {
        doctype = this.slug(doctype);
        if (this.modules[doctype] && this.modules[doctype].Meta) {
            return this.modules[doctype].Meta;
        } else {
            return this.BaseMeta;
        }
    },

    async get_doc(data, name) {
        if (typeof data==='string' && typeof name==='string') {
            let doc = this.get_doc_from_cache(data, name);
            if (!doc) {
                let controller_class = this.get_controller_class(data);
                doc = new controller_class({doctype:data, name: name});
                await doc.load();
                this.add_to_cache(doc);
            }
            return doc;
        } else {
            let controller_class = this.get_controller_class(data.doctype);
            var doc = new controller_class(data);
        }
        return doc;
    },

    get_controller_class(doctype) {
        doctype = this.slug(doctype);
        if (this.modules[doctype] && this.modules[doctype].Document) {
            return this.modules[doctype].Document;
        } else {
            return this.BaseDocument;
        }
    },

    async get_new_doc(doctype) {
        let doc = await frappe.get_doc({doctype: doctype});
        doc.set_name();
        doc.__not_inserted = true;
        this.add_to_cache(doc);
        return doc;
    },

    async insert(data) {
        const doc = await this.get_doc(data);
        return await doc.insert();
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
