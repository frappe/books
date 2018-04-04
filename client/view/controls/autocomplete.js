const BaseControl = require('./base');
const Awesomplete = require('awesomplete');

class AutocompleteControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
        this.setupAwesomplete();
    }

    async setupAwesomplete() {
        this.awesomplete = new Awesomplete(this.input, {
            minChars: 0,
            maxItems: 99
        });

        this.list = await this.getList();

        // rebuild the list on input
        this.input.addEventListener('input', (event) => {
            this.awesomplete.list = this.list;
        });
    }

    validate(value) {
        if (this.list.includes(value)) {
            return value;
        }
        return false;
    }
};

module.exports = AutocompleteControl;