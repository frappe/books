const BaseList = require('frappejs/client/view/list');

module.exports = class ToDoList extends BaseList {
    getFields()  {
        return ['name', 'subject', 'status'];
    }
    getRowHTML(data) {
        let symbol = data.status=="Closed" ? "✔" : "";
        return `<a href="#edit/ToDo/${data.name}">${symbol} ${data.subject}</a>`;
    }
}
