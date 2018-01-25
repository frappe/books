const BaseList = require('frappejs/client/view/list');
const BaseForm = require('frappejs/client/view/form');

class ToDoList extends BaseList {
    get_fields()  {
        return ['name', 'subject', 'status'];
    }
    get_row_html(data) {
        let symbol = data.status=="Closed" ? "✔" : "";
        return `<a href="#edit/todo/${data.name}">${symbol} ${data.subject}</a>`;
    }
}

module.exports = {
    Form: BaseForm,
    List: ToDoList
}