const frappe = require('frappejs');
const walk = require('walk');
const path = require('path');

module.exports = function(models_path) {
    if (!models_path) {
        return;
    }

    walk.walkSync(models_path, {
        listeners: {
            file: (basepath, file_data, next) => {
                const doctype = path.basename(path.dirname(basepath));
                const name = path.basename(basepath);
                const file_path = path.resolve(basepath, file_data.name);
                if (doctype==='doctype' && file_data.name.endsWith('.js')) {
                    frappe.modules[file_data.name.slice(0, -3)] = require(file_path);
                }
                next();
            }
        }
    });
}
