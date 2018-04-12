const octicons = require('octicons');
const BaseComponent = require('../baseComponent');

const iconSet = {
    open: octicons["triangle-down"].toSVG({ width: "12", height: "12", "class": "tree-icon-open" }),
    close: octicons["triangle-right"].toSVG({ width: "12", height: "12", "class": "tree-icon-closed" })
};

class TreeNode extends BaseComponent {
    static get observedAttributes() {
        return ['label', 'expanded'];
    }

    get templateHTML() {
        return require('./treeNode.html');
    }

    constructor() {
        super('TreeNode');

        let shadowRoot = this._shadowRoot;
        this.iconEl = shadowRoot.querySelector('.tree-node-icon');
        this.labelEl = shadowRoot.querySelector('.tree-node-label');
        this.actionsEl = shadowRoot.querySelector('.tree-node-actions');
        this.childrenEl = shadowRoot.querySelector('.tree-node-children');

        this.addEventListener('click', e => {
            e.stopImmediatePropagation();

            if (e.target.matches('[slot="actions"]')) {
                this.triggerEvent('tree-node-action', {
                    actionEl: e.target
                });
                return;
            }

            if (this.expanded) {
                this.removeAttribute('expanded');
            } else {
                this.setAttribute('expanded', '');
            }
        });
        this.onExpand();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case 'label': {
                this.labelEl.innerHTML = newValue || '';
                break;
            }

            case 'expanded': {
                const isExpanded = this.hasAttribute('expanded');
                this.onExpand(isExpanded);
                break;
            }

            default: break;
        }
    }

    onExpand(isExpanded = false) {
        if (this.isLeaf) return;

        if (isExpanded) {
            this.iconEl.innerHTML = iconSet.open;
            this.childrenEl.style.display = '';
        } else {
            this.iconEl.innerHTML = iconSet.close;
            this.childrenEl.style.display = 'none';
        }

        this.triggerEvent('tree-node-expand', {
            expanded: isExpanded
        });
    }

    get isRoot() {
        return this.hasAttribute('is-root');
    }

    get expanded() {
        return this.hasAttribute('expanded');
    }

    get isLeaf() {
        return this.hasAttribute('is-leaf');
    }
}

window.customElements.define('f-tree-node', TreeNode);

module.exports = TreeNode;