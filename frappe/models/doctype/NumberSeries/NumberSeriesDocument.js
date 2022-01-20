const BaseDocument = require('frappejs/model/document');

module.exports = class NumberSeries extends BaseDocument {
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