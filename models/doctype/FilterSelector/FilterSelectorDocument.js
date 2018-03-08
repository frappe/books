const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');

module.exports = class FormSelector extends BaseDocument {
    reset(doctype) {
        this.forDocType = doctype;
        this.items = [];
        this.filterGroup = '';
        this.filterGroupName = '';
    }

    getFilters() {
        const filters = {};
        for (let item of (this.items || [])) {
            if (item.condition === 'Equals') item.condition = '=';
            filters[item.field] = [item.condition, item.value];
        }
        return filters;
    }

    async update() {
        // save new group filter
        if (frappe.isServer) {
            if (this.filterGroupName) {
                await this.makeFilterGroup();
            } else if (this.filterGroup) {
                await this.updateFilterGroup();
            }
            return this;
        } else {
            return super.update();
        }
    }

    async makeFilterGroup() {
        const filterGroup = frappe.newDoc({doctype:'FilterGroup'});
        filterGroup.name = this.filterGroupName;
        this.updateFilterGroupValues(filterGroup);
        await filterGroup.insert();
    }

    async updateFilterGroup() {
        const filterGroup = await frappe.getDoc('FilterGroup', this.filterGroup);
        this.updateFilterGroupValues(filterGroup);
        await filterGroup.update();
    }

    updateFilterGroupValues(filterGroup) {
        filterGroup.forDocType = this.forDocType;
        filterGroup.items = [];
        for (let item of this.items) {
            filterGroup.items.push({field: item.field, condition: item.condition, value: item.value});
        }
    }
}