const frappe = require('frappejs');
const octicons = require('octicons');
const utils = require('frappejs/client/ui/utils');

class Tree {
    constructor({parent, label, iconSet, withSkeleton, method}) {
        Object.assign(this, arguments[0]);
        this.nodes = {};
        if(!iconSet) {
            this.iconSet = {
                open: octicons["triangle-down"].toSVG({ "width": 10, "class": "node-parent"}),
                closed: octicons["triangle-right"].toSVG({ "width": 5, "class": "node-parent"}),
                leaf: octicons["primitive-dot"].toSVG({ "width": 7, "class": "node-leaf"})
            };
        }
        this.make();
    }

    make() {
        this.tree = frappe.ui.create('div', {
            inside: this.parent,
            className: 'tree ' + (this.withSkeleton ? 'with-skeleton' : '')
        });

        this.rootNode = this.makeNode(this.label, this.label, true, null, this.tree);
        this.expandNode(this.rootNode);
    }

    refresh() {
        // this.selectedNode.parentNode &&
        // 	this.loadChildren(this.selectedNode.parentNode, true);
    }

    async loadChildren(node, deep=false) {
        let children = !deep ? await this.method(node) : await this.getAllNodes(node);
        this.renderNodeChildren(node, children);
    }

    renderChildrenDeep(dataList) {
        dataList.map(d => { this.renderNodeChildren(this.nodes[d.parent], d.data); });
    }

    renderNodeChildren(node, dataSet=[]) {
        frappe.ui.empty(node.childrenList);

        dataSet.forEach(data => {
            let parentNode = this.nodes[node.value];
            let childNode = this.makeNode(data.label || data.value, data.value,
                data.expandable, parentNode);
            childNode.treeLink.dataset.nodeData = data;
        });
        node.expanded = false;

        // As children loaded
        node.loaded = true;
        this.onNodeClick(node, true);
    }

    getAllNodes() { }

    makeNode(label, value, expandable, parentNode, parentEl) {
        let node = {
            label: label,
            value: value,
            loaded: 0,
            expanded: 0,
            expandable: expandable,
        };

        if(parentNode){
            node.parentNode = parentNode;
            node.parent = parentNode.childrenList;
            node.isRoot = 0;
        } else {
            node.isRoot = 1;
            node.parent = parentEl;
        }

        this.nodes[value] = node;
        this.buildNodeElement(node);
        this.onRender && this.onRender(node);

        return node;
    }

    buildNodeElement(node) {
        node.parentLi = frappe.ui.create('li', {
            inside: node.parent,
            className: 'tree-node'
        });

        let iconHtml = '';
        if(this.iconSet) {
            iconHtml = node.expandable ? this.iconSet.closed : this.iconSet.leaf;
        }
        let labelEl = `<span class="tree-label"> ${node.label}</span>`;

        node.treeLink = frappe.ui.create('span', {
            inside: node.parentLi,
            className: 'tree-link',
            'data-label': node.label,
            innerHTML: iconHtml + labelEl
        });
        node.treeLink.dataset.node = node;
        node.treeLink.addEventListener('click', () => {
            this.onNodeClick(node);
        });

        node.childrenList = frappe.ui.create('ul', {
            inside: node.parentLi,
            className: 'tree-children hide'
        });

        // if(this.toolbar) {
        // 	node.toolbar = this.getToolbar(node).insertAfter(node.treeLink);
        // }
    }

    async onNodeClick(node, click = true) {
        this.setSelectedNode(node);
        if(click) {
            this.onClick && this.onClick(node);
        }
        await this.expandNode(node);
        // select link
        utils.activate(this.tree, node.treeLink, 'tree-link', 'active');
        if(node.toolbar) this.showToolbar(node);
    }

    async expandNode(node) {
        if(node.expandable) {
            await this.toggleNode(node);
        }

        node.expanded = !node.expanded;
        // node.parent.classList.toggle('opened', node.expanded);
        node.parent.classList.add('opened');
        node.parentLi.classList.add('opened');
    }

    async toggleNode(node) {
        if(!node.loaded) await this.loadChildren(node);

        // expand children
        if(node.childrenList) {
            if(node.childrenList.innerHTML.length) {
                if (node.expanded) {
                    node.childrenList.classList.add('hide');
                } else {
                    node.childrenList.classList.remove('hide');
                }
            }

            // open close icon
            if(this.iconSet) {
                const oldIcon = node.treeLink.querySelector('svg');
                const newIconKey = node.expanded ? 'closed' : 'open';
                const newIcon = frappe.ui.create(this.iconSet[newIconKey]);
                node.treeLink.replaceChild(newIcon, oldIcon);
            }
        }
    }

    getSelectedNode() { return this.selectedNode; }

    setSelectedNode(node) { this.selectedNode = node; }

    showToolbar() { }
}

module.exports = Tree;
