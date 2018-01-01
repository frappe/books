module.exports = {
	slug(text) {
		return text.toLowerCase().replace(/ /g, '_');
	},
	sqlescape(value) {
		if (value===null || value===undefined) {
			// null
			return 'null';

		} else if (value instanceof Date) {
			// date
			return `'${value.toISOString()}'`;

		} else if (typeof value==='string') {
			// text
			return "'" + value.replace(/'/g, '\'').replace(/"/g, '\"') + "'";

		} else {
			// number
			return value + '';
		}
	}
}
