const number_format = require('./number_format');

module.exports = {
    format(value, field) {
        if (field.fieldtype==='Currency') {
            value = number_format.format_number(value);
        } else if (field.fieldtype==='Date') {
            if (value instanceof Date) {
                value = value.toISOString().substr(0, 10);
            }
        } else {
            if (value===null || value===undefined) {
                value = '';
            } else {
                value = value + '';
            }
        }
        return value;
    }
}