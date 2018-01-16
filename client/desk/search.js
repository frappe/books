const frappe = require('frappejs');

module.exports = class Search {
    constructor(parent) {
        this.input = frappe.ui.add('input', 'form-control nav-search', parent);
        this.input.addEventListener('keypress', function(event) {
            if (event.keyCode===13) {
                let list = frappe.router.current_page.list;
                if (list) {
                    list.search_text = this.value;
                    list.run();
                }
            }
        })
    }
}