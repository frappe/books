const frappe = require('frappejs');
const Dropdown = require('./dropdown');

module.exports = {
    add(tag, className, parent) {
        let element = document.createElement(tag);
        if (className) {
            for (let c of className.split(' ')) {
                this.add_class(element, c);
            }
        }
        if (parent) {
            parent.appendChild(element);
        }
        return element;
    },

    remove(element) {
        element.parentNode.removeChild(element);
    },

    add_class(element, className) {
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += " " + className;
        }
    },

    remove_class(element, className) {
        if (element.classList) {
            element.classList.remove(className);
        } else {
            element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    },

    toggle(element, default_display = '') {
        element.style.display = element.style.display === 'none' ? default_display : 'none';
    },

    make_dropdown(label, parent, btn_class = 'btn-secondary') {
        return new Dropdown({parent: parent, label:label, btn_class:btn_class});
    }

}