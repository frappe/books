const BaseComponent = require('../baseComponent');
const TreeNode = require('./treeNode');

class Tree extends BaseComponent {
    get templateHTML() {
        return require('./index.html');
    }

    constructor() {
        super('Tree');
    }
}

window.customElements.define('f-tree', Tree);

module.exports = {
    Tree,
    TreeNode
}
