const BaseMeta = require('frappejs/model/meta');
const BaseDocument = require('frappejs/model/document');

class ToDoMeta extends BaseMeta {
    setup_meta() {
        Object.assign(this, require('./todo.json'));
    }
}

class ToDo extends BaseDocument {
    setup() {
        this.add_handler('validate');
    }
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
