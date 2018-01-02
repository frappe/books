const path = require('path');
const bodyParser = require('body-parser');

module.exports = {
	async init({db_name ='test.db', user, user_key, for_test} = {}) {
		this.db_name = db_name;
		if (this._initialized) return;
		this.init_config();
		this.init_errors();
		this.init_globals();
		this.init_libs();
		await this.init_db();
		this._initialized = true;
		this.login(user, user_key);
	},

	init_config() {
		this.config = {
			backend: 'sqllite'
		};
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
		this.rest_server = require('./rest_server');
	},

	init_app(app) {
		this.app = app;
		this.init_middleware();
		this.rest_server.setup(this.app);
	},

	init_middleware() {
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));
	},

	async start(port=8000) {
		await this.db.migrate();
		this.server = this.app.listen(port);
	},

	async init_db() {
		let database = require('./backends/' + this.config.backend);
		this.db = new database.Database(this.db_name);
		await this.db.connect(this.db_name);
	},

	get_meta(doctype) {
		if (!this.meta_cache[doctype]) {
			this.meta_cache[doctype] = new this.meta.Meta(this.models.get('DocType', doctype));
		}
		return this.meta_cache[doctype];
	},

	async get_doc(data, name) {
		if (typeof data==='string' && typeof name==='string') {
			let controller_class = this.models.get_controller(data);
			var doc = new controller_class({doctype:data, name: name});
			await doc.load();
		} else {
			let controller_class = this.models.get_controller(data.doctype);
			var doc = new controller_class(data);
		}
		return doc;
	},

	async insert(data) {
		const doc = await this.get_doc(data);
		return await doc.insert();
	},

	login(user, user_key) {
		this.session = new this.session_lib.Session(user);
		if (user && user_key) {
			this.login(user_key);
		}
	},

	close() {
		this.db.close();
		this.server.close();
	}
};
