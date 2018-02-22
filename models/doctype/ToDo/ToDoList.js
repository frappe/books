const BaseList = require('frappejs/client/view/list');

module.exports = class ToDoList extends BaseList {
    getFields()  {
        return ['name', 'subject', 'status'];
    }
}
