const frappe = require('frappejs');
const walk = require('walk');
const path = require('path');

module.exports = {
    init_models(models_path) {
        const setup_model = (doctype, name, file_path) => {
            // add to frappe.models.data
            if (!frappe.models[doctype]) {
                frappe.models[doctype] = {};
            }
            frappe.models.data[doctype][name] = require(file_path);
        }

        const setup_controller = (doctype, file_path) => {
            let _module = require(file_path);
            frappe.models.controllers[doctype] = _module[doctype];
            if (_module[doctype + '_meta']) {
                frappe.models.meta_classes[doctype] = _module[doctype + '_meta'];
            }
        }

        walk.walkSync(models_path, {
            listeners: {
                file: (basepath, file_data, next) => {
                    const doctype = path.basename(path.dirname(basepath));
                    const name = path.basename(basepath);
                    const file_path = path.resolve(basepath, file_data.name);
                    if (file_data.name.endsWith('.json')) {
                        setup_model(doctype, name, file_path)
                    }
                    if (doctype==='doctype' && file_data.name.endsWith('.js')) {
                        setup_controller(path.basename(basepath), file_path);
                    }
                    next();
                }
            }
        });

    }

}