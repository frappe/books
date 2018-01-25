const frappe = require('frappejs');

module.exports = class BaseList {
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

        let data = await this.get_data();

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

    async get_data() {
        return await frappe.db.get_all({
            doctype: this.doctype,
            fields: this.get_fields(),
            filters: this.get_filters(),
            start: this.start,
            limit: this.page_length + 1
        });
    }

    get_fields() {
        return ['name'];
    }

    async append() {
        this.start += this.page_length;
        await this.run();
    }

    get_filters() {
        let filters = {};
        if (this.search_input.value) {
            filters.keywords = ['like', '%' + this.search_input.value + '%'];
        }
        return filters;
    }

    make_body() {
        if (!this.body) {
            this.make_toolbar();
            //this.make_new();
            this.body = frappe.ui.add('div', 'list-body', this.parent);
            this.make_more_btn();
        }
    }

    make_toolbar() {
        this.toolbar = frappe.ui.add('div', 'list-toolbar', this.parent);
        this.toolbar.innerHTML = `
            <div class="row">
                <div class="col-md-6 col-9">
                    <div class="input-group list-search mb-2">
                        <input class="form-control" type="text" placeholder="Search...">
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary btn-search">Search</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-3">
                    <a href="#new/${frappe.slug(this.doctype)}" class="btn btn-outline-primary">
                        New
                    </a>
                </div>
            </div>
        `;

        this.search_input = this.toolbar.querySelector('input');
        this.search_input.addEventListener('keypress', (event) => {
            if (event.keyCode===13) {
                this.run();
            }
        });

        this.search_button = this.toolbar.querySelector('.btn-search');
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
        row.innerHTML = this.get_row_html(data);
        row.style.display = 'block';
    }

    get_row_html(data) {
        return `<a href="#edit/${this.doctype}/${data.name}">${data.name}</a>`;
    }

    get_row(i) {
        if (!this.rows[i]) {
            this.rows[i] = frappe.ui.add('div', 'list-row py-2', this.body);
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