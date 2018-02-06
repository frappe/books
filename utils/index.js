let utils = {};

Object.assign(utils, require('./number_format'));

Object.assign(utils, {
    format(value, field) {
        if (field.fieldtype==='Currency') {
            return frappe.format_number(value);
        } else {
            return value + '';
        }
    },
    slug(text) {
        return text.toLowerCase().replace(/ /g, '_');
    },

    get_random_name() {
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
    }
});

module.exports = utils;