const BaseForm = require('frappejs/client/view/form');
const frappe = require('frappejs');

module.exports = class FilterSelectorForm extends BaseForm {
    makeSaveButton() {
        this.saveButton = this.container.addButton(frappe._("Apply"), 'primary', async (event) => {
            if (this.doc.filterGroupName || (this.doc.filterGroup && this.doc._dirty)) {
                // new filter, call update
                await this.save();
            }
            this.trigger('apply-filters');
        });
    }
}