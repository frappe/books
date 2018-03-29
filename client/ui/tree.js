const frappe = require('frappejs');
const bootstrap = require('bootstrap');
const $ = require('jquery');
const octicons = require('octicons');
const utils = require('frappejs/client/ui/utils');

const triangleRight = octicons["triangle-right"].toSVG({ "width": 5, "class": "node-parent"});
const triangleDown = octicons["triangle-down"].toSVG({ "width": 10, "class": "node-parent"});
const triangleLeft = octicons["triangle-left"].toSVG({ "width": 5, "class": "node-leaf"});
// const octiconPrimitiveDot = octicons["octicon-primitive-dot"].toSVG({ "width": 7, "class": "node-leaf"});
// add node classes later

class Tree {
    constructor({parent, label, iconSet, withSkeleton, method}) {
		Object.assign(this, arguments[0]);
		this.nodes = {};
		if(!iconSet) {
			this.iconSet = {
				open: triangleDown,
				closed: triangleRight,
				leaf: triangleLeft
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
		this.expandNode(this.rootNode, false);
	}

	refresh() {
		// this.selectedNode.parentNode &&
		// 	this.loadChildren(this.selectedNode.parentNode, true);
	}

	loadChildren(node, deep=false) {
		if(!deep) {
			this.renderNodeChildren(node, this.method(node.value));
		} else {
			this.renderChildrenDeep(node, this.getAllNodes(node.value));
		}
	}

	renderChildrenDeep(dataList) {
		dataList.map(d => { this.renderNodeChildren(this.nodes[d.parent], d.data); });
	}

	renderNodeChildren(node, dataSet) {
		console.log("dataSet", dataSet);
		frappe.ui.empty(node.$childrenList);

		dataSet.forEach(data => {
			let parentNode = this.nodes[node.value];
			let childNode = this.makeNode(data.label || data.value, data.value,
				data.expandable, parentNode);
			childNode.$treeLink.dataset.nodeData = data;
		});
		node.expanded = false;

		// As children loaded
		node.loaded = true;
		this.expandNode(node);
	}

	getAllNodes() { }

	makeNode(label, value, expandable, parentNode, parentEl) {
		let node = {
			parent: parent,
			label: label,
			value: value,
			loaded: 0,
			expanded: 0,
			expandable: expandable,
		};

		if(parentNode){
			node.parentNode = parentNode;
			node.parent = parentNode.$childrenList;
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
		let $label = `<a class="tree-label"> ${node.label}</a>`;

		node.$treeLink = frappe.ui.create('span', {
			inside: node.parentLi,
			className: 'tree-link',
			'data-label': node.label,
			innerHTML: iconHtml + $label
		});
		node.$treeLink.dataset.node = node;
		node.$treeLink.addEventListener('click', () => {
			console.log('clicked');
			this.onNodeClick(node);
		});

		node.$childrenList = frappe.ui.create('ul', {
			inside: node.parentLi,
			className: 'tree-children hide'
		});

		// if(this.toolbar) {
		// 	node.$toolbar = this.getToolbar(node).insertAfter(node.$treeLink);
		// }
	}

	onNodeClick(node, click = true) {
		this.setSelectedNode(node);
		if(click) {
			this.onClick && this.onClick(node);
		}
		this.expandNode(node);
		// select link
		utils.activate(this.tree, node.$treeLink, 'tree-link', 'active');
		if(node.$toolbar) this.showToolbar(node);
	}

	expandNode(node) {
		if(node.expandable) {
			this.toggleNode(node);
		}

		node.expanded = !node.expanded;
		// node.parent.classList.toggle('opened', node.expanded);
		node.parent.classList.add('opened');
		node.parentLi.classList.add('opened');
	}

	toggleNode(node) {
		if(!node.loaded) return this.loadChildren(node);

		// expand children
		if(node.$childrenList) {
			if(node.$childrenList.innerHTML.length) {
				node.$childrenList.classList.toggle('hide', !node.expanded);
			}

			// open close icon
			if(this.iconSet) {
				const oldIcon = node.$treeLink.querySelector('svg');
				const newIconKey = !node.expanded ? 'closed' : 'open';
				const newIcon = frappe.ui.create(this.iconSet[newIconKey]);
				node.$treeLink.replaceChild(newIcon, oldIcon);
			}
		}
	}

	getSelectedNode() { return this.selectedNode; }

	setSelectedNode(node) { this.selectedNode = node; }

	showToolbar() { }
}

module.exports = Tree;
