const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class ToDoMeta extends BaseMeta {
    setupMeta() {
        Object.assign(this, require('./todo.json'));
    }
}

class ToDo extends BaseDocument {
    validate() {
        if (!this.status) {
            this.status = 'Open';
        }
    }
}

module.exports = {
    Document: ToDo,
    Meta: ToDoMeta
};
