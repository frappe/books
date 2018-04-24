const frappe = require('frappejs');
const BaseList = require('./list');
const Tree = require('frappejs/client/components/tree');
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

        const rootLabel = this.treeSettings.getRootLabel ?
            await this.treeSettings.getRootLabel() :
            this.doctype;

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
        this.rootNode = {
            label: rootLabel,
            value: rootLabel,
            isRoot: true,
            isGroup: true,
            children: null
        }

        this.treeWrapper = frappe.ui.create(`
            <f-tree>
                ${this.getTreeNodeHTML(this.rootNode)}
            </f-tree>
        `);

        const rootNode = this.treeWrapper.querySelector('f-tree-node[is-root]');
        rootNode.props = this.rootNode;

        this.body.appendChild(this.treeWrapper);

        frappe.ui.on(this.treeWrapper, 'tree-node-expand', 'f-tree-node', async (e, treeNode) => {
            if (!treeNode.expanded) return;

            if (!treeNode.props.children) {
                const data = await this.getData(treeNode.props);
                const children = data.map(d => ({
                    label: d.name,
                    value: d.name,
                    isGroup: d.isGroup,
                    doc: d
                }));
                treeNode.props.children = children;

                for (let child of children) {
                    const childNode = frappe.ui.create(this.getTreeNodeHTML(child));
                    childNode.props = child;
                    treeNode.appendChild(childNode);
                }
            }
        });

        frappe.ui.on(this.treeWrapper, 'tree-node-action', 'f-tree-node', (e, treeNode) => {
            if (treeNode.isRoot) return;

            const button = e.detail.actionEl;
            const action = button.getAttribute('data-action');

            if (action === 'edit') {
                this.edit(treeNode.props.doc.name);
            } else if (action === 'addChild') {
                this.addChildNode(treeNode.props.doc.name);
            }
        });

        rootNode.click(); // open the root node
    }

    edit(name) {
        frappe.desk.showFormModal(this.doctype, name);
    }

    async addChildNode(name) {
        const newDoc = await frappe.getNewDoc(this.doctype);
        const formModal = await frappe.desk.showFormModal(this.doctype, newDoc.name);
        const parentField = this.treeSettings.parentField;
        if (formModal.form.doc.meta.hasField(parentField)) {
            formModal.form.doc.set(parentField, name);
        }
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

    getTreeNodeHTML(node) {
        return (
            `<f-tree-node
                label="${node.label}"
                value="${node.value}"
                ${node.expanded ? 'expanded' : ''}
                ${node.isRoot ? 'is-root' : ''}
                ${node.isGroup ? '' : 'is-leaf'}
            >
                ${this.getActionButtonsHTML()}
            </f-tree-node>`
        );
    }

    getActionButtonsHTML() {
        return [
            { id: 'edit', label: frappe._('Edit') },
            { id: 'addChild', label: frappe._('Add Child') },
            // { id: 'delete', label: frappe._('Delete') },
        ].map(button => {
            return `<button class="btn btn-link btn-sm m-0" slot="actions" data-action="${button.id}">
                ${button.label}
            </button>`;
        })
        .join('');
    }

    getFields() {
        let fields = [this.treeSettings.parentField, 'isGroup']
        this.updateStandardFields(fields);
        return fields;
    }
};
