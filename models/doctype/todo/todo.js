const frappe = require('frappejs');

class todo_meta extends frappe.meta.Meta {
    setup_meta() {
        Object.assign(this, require('./todo.json'));
        this.name = 'ToDo';
        this.list_options.fields = ['name', 'subject', 'status'];
    }

    get_row_html(data) {
        const sign = data.status === 'Open' ? '' : '✔';
        return `<p><a href="#edit/todo/${data.name}">${sign} ${data.subject}</a></p>`;
    }

}

class todo extends frappe.document.Document {
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
    todo: todo,
    todo_meta: todo_meta
};
