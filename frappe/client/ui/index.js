const frappe = require('frappe-core');

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
	}

}