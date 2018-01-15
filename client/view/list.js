const frappe = require('frappe-core');

module.exports = class List {
    constructor({doctype, parent, fields}) {
        this.doctype = doctype;
        this.parent = parent;
        this.fields = fields;

        this.meta = frappe.get_meta(this.doctype);

        this.start = 0;
        this.page_length = 20;

        this.body = null;
        this.rows = [];
        this.data = [];
    }

    async run() {
        this.make_body();
        this.set_filters();

        let data = await this.meta.get_list({
            filters: this.filters,
            start:this.start,
            limit:this.page_length + 1
        });

        for (let i=0; i< Math.min(this.page_length, data.length); i++) {
            this.render_row(this.start + i, data[i]);
        }

        if (this.start > 0) {
            this.data = this.data.concat(data);
        } else {
            this.data = data;
        }

        this.clear_empty_rows();
        this.update_more(data.length > this.page_length);
    }

    async append() {
        this.start += this.page_length;
        await this.run();
    }

    set_filters() {
        this.filters = {};
        if (this.search_input.value) {
            this.filters.keywords = ['like', '%' + this.search_input.value + '%'];
        }
    }

    make_body() {
        if (!this.body) {
            this.make_search();
            this.body = frappe.ui.add('div', 'list-body', this.parent);
            this.make_more_btn();
        }
    }

    make_search() {
        this.search_input_group = frappe.ui.add('div', 'input-group list-search', this.parent);

        this.search_input = frappe.ui.add('input', 'form-control', this.search_input_group);
        this.search_input.addEventListener('keypress', (event) => {
            if (event.keyCode===13) {
                this.run();
            }
        });

        this.search_input_group_append = frappe.ui.add('div', 'input-group-append', this.search_input_group);
        this.search_button = frappe.ui.add('button', 'btn btn-secondary', this.search_input_group_append);
        this.search_button.textContent = 'Search';
        this.search_button.addEventListener('click', (event) => {
            this.run();
        });
    }

    make_more_btn() {
        this.more_btn = frappe.ui.add('button', 'btn btn-secondary hide', this.parent);
        this.more_btn.textContent = 'More';
        this.more_btn.addEventListener('click', () => {
            this.append();
        })
    }

    render_row(i, data) {
        let row = this.get_row(i);
        row.innerHTML = this.meta.get_row_html(data);
        row.style.display = 'block';
    }

    get_row(i) {
        if (!this.rows[i]) {
            this.rows[i] = frappe.ui.add('div', 'list-row', this.body);
        }
        return this.rows[i];
    }

    clear_empty_rows() {
        if (this.rows.length > this.data.length) {
            for (let i=this.data.length; i < this.rows.length; i++) {
                let row = this.get_row(i);
                row.innerHTML = '';
                row.style.display = 'none';
            }
        }
    }

    update_more(show) {
        if (show) {
            this.more_btn.classList.remove('hide');
        } else {
            this.more_btn.classList.add('hide');
        }
    }

};