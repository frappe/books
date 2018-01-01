const walk = require('walk');
const path = require('path');
const process = require('process');
const frappe = require('frappe-core');

class Models {
	constructor() {
		this.data = {};
		this.controllers = {};
		this.setup_path_map();
	}

	get(doctype, name) {
		if (!this.data[doctype]) {
			this.data[doctype] = {};
		}
		if (!this.data[doctype][name]) {
			this.data[doctype][name] = require(
				this.path_map[frappe.slug(doctype)][frappe.slug(name)]);
		}
		return this.data[doctype][name];
	}

	get_controller(doctype) {
		doctype = frappe.slug(doctype);
		if (!this.controllers[doctype]) {
			this.controllers[doctype] = require(this.controller_map[doctype])[doctype];
		}
		return this.controllers[doctype];
	}

	setup_path_map() {
		const cwd = process.cwd();
		this.path_map = {};
		this.controller_map = {};

		if (!frappe.config.apps) {
			frappe.config.apps = [];
		}
		frappe.config.apps.unshift('frappe-core');

		for (let app_name of frappe.config.apps) {
			let start = path.resolve(require.resolve(app_name), '../models');
			walk.walkSync(start, {
				listeners: {
					file: (basepath, file_data, next) => {
						const doctype = path.basename(path.dirname(basepath));
						const name = path.basename(basepath);
						const file_path = path.resolve(basepath, file_data.name);
						if (file_data.name.endsWith('.json')) {
							if (!this.path_map[doctype]) {
								this.path_map[doctype] = {};
							}

							this.path_map[doctype][name] = file_path;
						}
						if (doctype==='doctype' && file_data.name.endsWith('.js')) {
							this.controller_map[name] = file_path;
						}
						next();
					}
				}
			});
		}
	}
}

module.exports = { Models: Models }