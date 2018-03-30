const BaseControl = require('./base');
const Awesomplete = require('awesomplete');

class AutocompleteControl extends BaseControl {
    make() {
        super.make();
        this.input.setAttribute('type', 'text');
        this.setupAwesomplete();
    }

    setupAwesomplete() {
        this.awesomplete = new Awesomplete(this.input, {
            minChars: 0,
            maxItems: 99
        });

        // rebuild the list on input
        this.input.addEventListener('input', async (event) => {
            let list = await this.getList();
            this.awesomplete.list = list;
        });
    }
};

module.exports = AutocompleteControl;