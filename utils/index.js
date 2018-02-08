module.exports = {
    format(value, field) {
        if (field.fieldtype==='Currency') {
            return frappe.format_number(value);
        } else {
            if (value===null || value===undefined) {
                return '';
            } else {
                return value + '';
            }
        }
    },

    slug(text) {
        return text.toLowerCase().replace(/ /g, '_');
    },

    getRandomName() {
        return Math.random().toString(36).substr(3);
    },

    async_handler(fn) {
        return (req, res, next) => Promise.resolve(fn(req, res, next))
            .catch((err) => {
                console.log(err);
                // handle error
                res.status(err.status_code || 500).send({error: err.message});
            });
    },

    async sleep(seconds) {
        return new Promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    },

    _(text, args) {
        // should return translated text
        return this.string_replace(text, args);
    },

    string_replace(str, args) {
        if (!Array.isArray(args)) {
            args = [args];
        }

        if(str==undefined) return str;

        let unkeyed_index = 0;
        return str.replace(/\{(\w*)\}/g, (match, key) => {
            if (key === '') {
                key = unkeyed_index;
                unkeyed_index++
            }
            if (key == +key) {
                return args[key] !== undefined
                    ? args[key]
                    : match;
            }
        });
    }

};