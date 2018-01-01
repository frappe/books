const path = require('path')
module.exports = {
	init(db_path, user, user_key) {
		this.db_path = db_path || 'test.db';
		if (this._initialized) return;
		this.init_config();
		this.init_errors();
		this.init_globals();
		this.init_libs();
		this.init_db();
		this._initialized = true;
		this.login(user, user_key);
	},
	init_config() {
		this.config = {};
	},
	init_errors() {
		this.ValueError = class extends Error { };
	},
	init_globals() {
		this.meta_cache = {};
	},
	init_libs() {
		this.utils = require('./utils');
		Object.assign(this, this.utils);
		let models = require('./model/models');
		this.models = new models.Models();
		this.model = require('./model');
		this.document = require('./model/document');
		this.meta = require('./model/meta');
		this.session_lib = require('./session');
	},
	init_db() {
		let database = require('./model/database');
		this.db = new database.Database(this.db_path);
	},
	get_meta(doctype) {
		if (!this.meta_cache[doctype]) {
			this.meta_cache[doctype] = new this.meta.Meta(this.models.get('DocType', doctype));
		}
		return this.meta_cache[doctype];
	},
	get_doc(data, name) {
		if (typeof data==='string' && typeof name==='string') {
			let controller_class = this.models.get_controller(data);
			var doc = new controller_class({doctype:data, name: name});
			doc.load();
		} else {
			let controller_class = this.models.get_controller(data.doctype);
			var doc = new controller_class(data);
		}
		return doc;
	},
	login(user, user_key) {
		this.session = new this.session_lib.Session(user);
		if (user && user_key) {
			this.login(user_key);
		}
	}
};
