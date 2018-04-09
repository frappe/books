const frappe = require('frappejs');
const BaseList = require('./list');
const Tree = require('frappejs/client/ui/tree');
// const keyboard = require('frappejs/client/ui/keyboard');

module.exports = class BaseTree extends BaseList {

    init() {
        this.meta = frappe.getMeta(this.doctype);

        this.body = null;
        this.data = [];

        this.setupTreeSettings();

        frappe.db.on(`change:${this.doctype}`, (params) => {
            this.refresh();
        });
    }

    setupTreeSettings() {
        // tree settings that can be overridden by meta
        this.treeSettings = {
            parentField: `parent${this.doctype}`
        }

        if (this.meta.treeSettings) {
            Object.assign(this.treeSettings, this.meta.treeSettings);
        }
    }

    async refresh() {
        return await this.run();
    }

    async run() {
        this.makeBody();
        this.body.innerHTML = '';
        this.dirty = false;

        let accountingSettings = await frappe.db.getSingle('AccountingSettings');
        let rootLabel = accountingSettings.companyName;

        this.renderTree(rootLabel);
        this.trigger('state-change');
    }

    makeBody() {
        if (!this.body) {
            this.makeToolbar();
            this.parent.classList.add('tree-page');
            this.body = frappe.ui.add('div', 'tree-body', this.parent);
            this.body.setAttribute('data-doctype', this.doctype);
            this.bindKeys();
        }
    }

    renderTree(rootLabel) {
        // const tree = new Tree();
        // tree.getChildNodes = async node => {
        //     const children = await this.getData(node) || [];
        //     return children.map(d => ({
        //         label: d.name,
        //         value: d.name,
        //         expandable: d.isGroup
        //     }));
        // }
        // tree.rootNode = {
        //     label: rootLabel,
        //     value: rootLabel,
        //     isRoot: 1,
        //     expandable: 1
        // }
        // this.body.appendChild(tree);

        this.rootNode = {
            label: rootLabel,
            value: rootLabel,
            isRoot: true,
            expanded: true,
            children: []
        }

        const getNodeHTML = node =>
            `<f-tree-node
                label="${node.label}"
                value="${node.value}"
                ${node.expanded ? 'expanded' : ''}
                ${node.isRoot ? 'is-root' : ''}>
            </f-tree-node>`;

        this.treeWrapper = frappe.ui.create('f-tree');

        this.rootNode.el = frappe.ui.create(getNodeHTML(this.rootNode), {
            inside: this.treeWrapper
        });

        this.treeWrapper = frappe.ui.create(`
            <f-tree>
                ${getNodeHTML(this.rootNode)}
            </f-tree>
        `);

        this.body.appendChild(this.treeWrapper);

        frappe.ui.on(this.treeWrapper, 'click', 'f-tree-node', async (e, treeNode) => {
            if (treeNode.expanded) {
                treeNode.removeAttribute('expanded');
            } else {
                treeNode.setAttribute('expanded', '');
            }

            let node = null;
            // if (treeNode.hasAttribute('is-root')) {
            //     node = this.rootNode;
            // } else {

            // }


        });


        // this.tree = new Tree({
        //     label: rootLabel,
        //     parent: this.body,
        //     method: async node => {
        //         const children = await this.getData(node) || [];
        //         return children.map(d => ({
        //             label: d.name,
        //             value: d.name,
        //             expandable: d.isGroup
        //         }));
        //     }
        // });
    }

    async getData(node) {
        let fields = this.getFields();
        let filters = {};

        if (node.isRoot) {
            filters[this.treeSettings.parentField] = '';
        } else {
            filters[this.treeSettings.parentField] = node.value;
        }

        return await frappe.db.getAll({
            doctype: this.doctype,
            fields,
            filters,
            order_by: 'name',
            order: 'asc'
        });
    }

    getFields() {
        let fields = [this.treeSettings.parentField, 'isGroup']
        this.updateStandardFields(fields);
        return fields;
    }

    makeToolbar() {
        this.makeSearch();

        this.btnNew = this.page.addButton(frappe._('New'), 'btn-primary', async () => {
            await frappe.router.setRoute('new', this.doctype);
        });

        this.btnDelete = this.page.addButton(frappe._('Delete'), 'btn-secondary hide', async () => {
            await frappe.db.deleteMany(this.doctype, this.getCheckedRowNames());
            await this.refresh();
        });

        this.btnReport = this.page.addButton(frappe._('Report'), 'btn-outline-secondary hide', async () => {
            await frappe.router.setRoute('table', this.doctype);
        });

        this.on('state-change', () => {
            const checkedCount = this.getCheckedRowNames().length;
            this.btnDelete.classList.toggle('hide', checkedCount ? false : true);
            this.btnNew.classList.toggle('hide', checkedCount ? true : false);
            this.btnReport.classList.toggle('hide', checkedCount ? true : false);
        });

        this.page.body.addEventListener('click', (event) => {
            if (event.target.classList.contains('checkbox')) {
                this.trigger('state-change');
            }
        })
    }

    makeSearch() {
        this.toolbar = frappe.ui.add('div', 'list-toolbar', this.parent);
        this.toolbar.innerHTML = `
            <div class="input-group list-search">
                <input class="form-control" type="text" placeholder="Search...">
                <div class="input-group-append">
                    <button class="btn btn-outline-secondary btn-search">Search</button>
                </div>
            </div>
        `;

        this.searchInput = this.toolbar.querySelector('input');
        this.searchInput.addEventListener('keypress', (event) => {
            if (event.keyCode === 13) {
                this.refresh();
            }
        });

        this.btnSearch = this.toolbar.querySelector('.btn-search');
        this.btnSearch.addEventListener('click', (event) => {
            this.refresh();
        });
    }
};
