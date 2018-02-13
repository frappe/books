const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class NumberSeriesMeta extends BaseMeta {
	setupMeta() {
		Object.assign(this, require('./number_series.json'));
	}
}

class NumberSeries extends BaseDocument {
	validate() {
		if (this.current===null || this.current===undefined) {
			this.current = 0;
		}
	}
	async next() {
		this.validate();
		this.current++;
		await this.update();
		return this.current;
	}
}

module.exports = {
	Document: NumberSeries,
	Meta: NumberSeriesMeta
};