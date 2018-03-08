const frappe = require('frappejs');
const keyboard = require('frappejs/client/ui/keyboard');
const Observable = require('frappejs/utils/observable');

module.exports = class BaseList extends Observable {
    constructor({doctype, parent, fields, page}) {
        super();

        Object.assign(this, arguments[0]);

        this.meta = frappe.getMeta(this.doctype);

        this.start = 0;
        this.pageLength = 20;

        this.body = null;
        this.rows = [];
        this.data = [];

        frappe.db.on(`change:${this.doctype}`, (params) => {
            this.refresh();
        });
    }

    makeBody() {
        if (!this.body) {
            this.makeToolbar();
            this.parent.classList.add('list-page');
            this.body = frappe.ui.add('div', 'list-body', this.parent);
            this.body.setAttribute('data-doctype', this.doctype);
            this.makeMoreBtn();
            this.bindKeys();
        }
    }

    async refresh() {
        return await this.run();
    }

    async run() {
        this.makeBody();
        this.dirty = false;

        let data = await this.getData();

        for (let i=0; i< Math.min(this.pageLength, data.length); i++) {
            let row = this.getRow(this.start + i);
            this.renderRow(row, data[i]);
        }

        if (this.start > 0) {
            this.data = this.data.concat(data);
        } else {
            this.data = data;
        }

        this.clearEmptyRows();
        this.updateMore(data.length > this.pageLength);
        this.selectDefaultRow();
        this.setActiveListRow();
        this.trigger('state-change');
    }

    async getData() {
        let fields = this.getFields();
        this.updateStandardFields(fields);
        return await frappe.db.getAll({
            doctype: this.doctype,
            fields: fields,
            filters: this.getFilters(),
            start: this.start,
            limit: this.pageLength + 1
        });
    }

    getFields() {
        return [];
    }

    updateStandardFields(fields) {
        if (!fields.includes('name')) fields.push('name');
        if (!fields.includes('modified')) fields.push('modified');
        if (this.meta.isSubmittable && !fields.includes('submitted')) fields.push('submitted');
    }

    async append() {
        this.start += this.pageLength;
        await this.run();
    }

    getFilters() {
        let filters = {};
        if (this.searchInput.value) {
            filters.keywords = ['like', '%' + this.searchInput.value + '%'];
        }
        return filters;
    }

    renderRow(row, data) {
        row.innerHTML = this.getRowBodyHTML(data);
        row.docName = data.name;
        row.setAttribute('data-name', data.name);
    }

    getRowBodyHTML(data) {
        return `<div class="col-1">
            <input class="checkbox" type="checkbox" data-name="${data.name}">
        </div>` + this.getRowHTML(data);
    }

    getRowHTML(data) {
        return `<div class="col-11">
            ${this.getNameHTML(data)}
        </div>`;
    }

    getNameHTML(data) {
        return `<span class="indicator ${this.meta.getIndicatorColor(data)}">${data[this.meta.titleField]}</span>`;
    }

    getRow(i) {
        if (!this.rows[i]) {
            let row = frappe.ui.add('div', 'list-row row no-gutters', this.body);

            // open on click
            let me = this;
            row.addEventListener('click', async function(e) {
                if (!e.target.tagName !== 'input') {
                    await me.showItem(this.docName);
                }
            });
            row.style.display = 'flex';

            // make element focusable
            row.setAttribute('tabindex', -1);
            this.rows[i] = row;
        }
        return this.rows[i];
    }

    refreshRow(doc) {
        let row = this.getRowByName(doc.name);
        if (row) {
            this.renderRow(row, doc);
        }
    }

    async showItem(name) {
        if (this.meta.print) {
            await frappe.router.setRoute('print', this.doctype, name);
        } else {
            await frappe.router.setRoute('edit', this.doctype, name);
        }
    }

    getCheckedRowNames() {
        return [...this.body.querySelectorAll('.checkbox:checked')].map(check => check.getAttribute('data-name'));
    }

    clearEmptyRows() {
        if (this.rows.length > this.data.length) {
            for (let i=this.data.length; i < this.rows.length; i++) {
                let row = this.getRow(i);
                row.innerHTML = '';
                row.style.display = 'none';
            }
        }
    }

    selectDefaultRow() {
        if (!frappe.desk.body.activePage && this.rows.length) {
            this.showItem(this.rows[0].docName);
        }
    }

    makeToolbar() {
        this.makeSearch();

        this.btnNew = this.page.addButton(frappe._('New'), 'btn-primary', async () => {
            await frappe.router.setRoute('new', this.doctype);
        });

        this.btnDelete = this.page.addButton(frappe._('Delete'), 'btn-secondary hide', async () => {
            await frappe.db.deleteMany(this.doctype, this.getCheckedRowNames());
            await this.refresh();
        });

        this.btnReport = this.page.addButton(frappe._('Report'), 'btn-outline-secondary hide', async () => {
            await frappe.router.setRoute('table', this.doctype);
        });

        this.on('state-change', () => {
            const checkedCount = this.getCheckedRowNames().length;
            this.btnDelete.classList.toggle('hide', checkedCount ? false : true);
            this.btnNew.classList.toggle('hide', checkedCount ? true : false);
            this.btnReport.classList.toggle('hide', checkedCount ? true : false);
        });

        this.page.body.addEventListener('click', (event) => {
            if(event.target.classList.contains('checkbox')) {
                this.trigger('state-change');
            }
        })
    }

    makeSearch() {
        this.toolbar = frappe.ui.add('div', 'list-toolbar', this.parent);
        this.toolbar.innerHTML = `
            <div class="input-group list-search">
                <input class="form-control" type="text" placeholder="Search...">
                <div class="input-group-append">
                    <button class="btn btn-outline-secondary btn-search">Search</button>
                </div>
            </div>
        `;

        this.searchInput = this.toolbar.querySelector('input');
        this.searchInput.addEventListener('keypress', (event) => {
            if (event.keyCode===13) {
                this.refresh();
            }
        });

        this.btnSearch = this.toolbar.querySelector('.btn-search');
        this.btnSearch.addEventListener('click', (event) => {
            this.refresh();
        });
    }

    bindKeys() {
        keyboard.bindKey(this.body, 'up', () => this.move('up'));
        keyboard.bindKey(this.body, 'down', () => this.move('down'))

        keyboard.bindKey(this.body, 'right', () => {
            if (frappe.desk.body.activePage) {
                frappe.desk.body.activePage.body.querySelector('input').focus();
            }
        });

        keyboard.bindKey(this.body, 'n', (e) => {
            frappe.router.setRoute('new', this.doctype);
            e.preventDefault();
        });

        keyboard.bindKey(this.body, 'x', async (e) => {
            let activeListRow = this.getActiveListRow();
            if (activeListRow && activeListRow.docName) {
                e.preventDefault();
                await frappe.db.delete(this.doctype, activeListRow.docName);
                frappe.desk.body.activePage.hide();
            }
        });

    }

    async move(direction) {
        let elementRef = direction === 'up' ? 'previousSibling' : 'nextSibling';
        if (document.activeElement && document.activeElement.classList.contains('list-row')) {
            let next = document.activeElement[elementRef];
            if (next && next.docName) {
                await this.showItem(next.docName);
            }
        }
    }

    makeMoreBtn() {
        this.btnMore = frappe.ui.add('button', 'btn btn-secondary hide', this.parent, 'More');
        this.btnMore.addEventListener('click', () => {
            this.append();
        })
    }

    updateMore(show) {
        if (show) {
            this.btnMore.classList.remove('hide');
        } else {
            this.btnMore.classList.add('hide');
        }
    }

    setActiveListRow(name) {
        let activeListRow = this.getActiveListRow();
        if (activeListRow) {
            activeListRow.classList.remove('active');
        }

        if (!name) {
            // get name from active page
            name = frappe.desk.activeDoc && frappe.desk.activeDoc.name;
        }

        if (name) {
            let row = this.getRowByName(name);
            if (row) {
                row.classList.add('active');
                row.focus();
            }
        }
    }

    getRowByName(name) {
        return this.body.querySelector(`.list-row[data-name="${name}"]`);
    }

    getActiveListRow() {
        return this.body.querySelector('.list-row.active');
    }
};