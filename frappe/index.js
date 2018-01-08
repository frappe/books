module.exports = {
	async init() {
		if (this._initialized) return;
		this.init_config();
		this.init_errors();
		this.init_globals();
		this._initialized = true;
	},

	init_config() {
		this.config = {
			backend: 'sqlite',
			port: 8000
		};
	},

	init_errors() {
		this.ValueError = class extends Error { };
	},

	init_globals() {
		this.meta_cache = {};
	},

	init_view({container, main, sidebar}) {
		this.container = container;

		if (sidebar) {
			this.sidebar = sidebar;
		} else {
			this.sidebar = $('<div class="sidebar"></div>').appendTo(this.container);
		}

		if (main) {
			this.main = main;
		} else {
			this.main = $('<div class="main"></div>').appendTo(this.container);
		}
	},

	get_meta(doctype) {
		if (!this.meta_cache[doctype]) {
			this.meta_cache[doctype] = new (this.models.get_meta_class(doctype))(this.models.get('DocType', doctype));
		}
		return this.meta_cache[doctype];
	},

	init_controller(doctype, module) {
		doctype = this.slug(doctype);
		this.models.controllers[doctype] = module[doctype];
		this.models.meta_classes[doctype] = module[doctype + '_meta'];
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
