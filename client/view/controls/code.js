const BaseControl = require('./base');
// const frappe = require('frappejs');
const CodeMirror = require('codemirror');
const modeHTML = require('codemirror/mode/htmlmixed/htmlmixed'); // eslint-disable-line
const modeJavascript = require('codemirror/mode/javascript/javascript'); // eslint-disable-line

class CodeControl extends BaseControl {
    makeInput() {
        if (!this.options) {
            this.options = {};
        }
        this.options.theme = 'default';
        this.input = new CodeMirror(this.getInputParent(), this.options);
    }

    setInputValue(value) {
        if (value !== this.input.getValue()) {
            this.input.setValue(value || '');
        }
    }

    getInputValue(value) {
        return this.input.getValue();
    }

    addChangeHandler() {
        this.input.on('blur', () => {
            if (this.skipChangeEvent) return;
            this.handleChange();
        });
    }

};

module.exports = CodeControl;