const BaseList = require('frappejs/client/view/list');

class ToDoList extends BaseList {
    getFields()  {
        return ['name', 'subject', 'status'];
    }
    getRowHTML(data) {
        let symbol = data.status=="Closed" ? "✔" : "";
        return `<a href="#edit/todo/${data.name}">${symbol} ${data.subject}</a>`;
    }
}

module.exports = {
    List: ToDoList
}