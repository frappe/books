const frappe = require('frappejs');
const BaseControl = require('./base');

class FileControl extends BaseControl {
    make() {
        super.make();
        this.fileButton = frappe.ui.create('button', {
            className: 'btn btn-outline-secondary btn-block',
            inside: this.getInputParent(),
            textContent: 'Choose a file...',
            onclick: () => {
                this.input.click();
            }
        });

        this.input.setAttribute('type', 'file');

        if (this.directory) {
            this.input.setAttribute('webkitdirectory', '');
        }

        if (this.allowMultiple) {
            this.input.setAttribute('multiple', '');
        }
    }

    async handleChange() {
        await super.handleChange();
        this.setDocValue();
    }

    getInputValue() {
        return this.input.files;
    }

    setInputValue(files) {

        let label;
        if (!files || files.length === 0) {
            label = 'Choose a file...'
        } else if (files.length === 1) {
            label = files[0].name;
        } else {
            label = `${files.length} files selected`;
        }

        this.fileButton.textContent = label;
        this.input.files = files;
    }
};

module.exports = FileControl;