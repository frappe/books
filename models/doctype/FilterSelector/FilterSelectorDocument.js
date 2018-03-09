const BaseDocument = require('frappejs/model/document');
const frappe = require('frappejs');

module.exports = class FormSelector extends BaseDocument {
    reset(doctype) {
        if (doctype) {
            this.forDocType = doctype;
        }
        this.items = [];
        this.filterGroup = '';
        this.filterGroupName = '';
    }

    getFilters() {
        const filters = {};
        for (let item of (this.items || [])) {
            filters[item.field] = [(item.condition === 'Equals') ? '=' : item.condition,
                item.value];
        }
        return filters;
    }

    setFilters(filters) {
        this.reset();
        for (let key in filters) {
            let value  = filters[key];
            if (value instanceof Array) {
                this.items.push({field: key, condition: value[0], value: value[1]});
            } else {
                this.items.push({field: key, condition: 'Equals', value: value});
            }
        }
    }

    getText() {
        if (this.items && this.items.length) {
            this.forMeta = frappe.getMeta(this.forDocType);
            return this.items.map(v => `${this.forMeta.getLabel(v.field)} ${v.condition} ${v.value}`).join(', ');
        } else {
            return 'Set Filters';
        }
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