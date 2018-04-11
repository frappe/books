let templates = {};

class BaseComponent extends HTMLElement {
    constructor(name) {
        super();

        this._name = name;
        this._shadowRoot = this.attachShadow({ mode: 'open' });

        if (!templates[name]) {
            makeTemplate(name, this.templateHTML);
        }

        let template = getTemplate(name);
        this._shadowRoot.appendChild(template);
    }

    triggerEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            detail
        });
        this.dispatchEvent(event);
    }
}


function makeTemplate(name, html) {
    if (!templates[name]) {
        let template = document.createElement('template');
        template.id = name;
        template.innerHTML = html;

        templates[name] = template;
    }
}

function getTemplate(name) {
    return templates[name].content.cloneNode(true);
}

module.exports = BaseComponent;
