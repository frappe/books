const BaseForm = require('frappejs/client/view/form');

module.exports = class AccountForm extends BaseForm {
    make() {
        super.make();

        // override controller event
        this.controls['parent_account'].getFilters = (query) => {
            return {
                keywords: ["like", query],
                name: ["!=", this.doc.name]
            }
        }
    }
}
