const frappe = require('frappe-core');

module.exports = class Router {
    constructor() {
        this.current_page = null;
        this.static_routes = {};
        this.dynamic_routes = {};
        this.listen();
    }

    add(route, handler) {
        let page = {handler: handler};

        // '/todo/:name/:place'.match(/:([^/]+)/g);
        page.param_keys = route.match(/:([^/]+)/g);

        if (page.param_keys) {
            // make expression
            // '/todo/:name/:place'.replace(/\/:([a-z1-9]+)/g, "\/([a-z0-9]+)");
            page.expression = route.replace(/\/:([a-z1-9]+)/g, "\/([a-z0-9]+)");
            this.dynamic_routes[route] = page;
        } else {
            this.static_routes[route] = page;
        }

    }

    listen() {
        window.onhashchange = this.changed.bind(this);
        this.changed();
    }

    async changed(event) {
        if (window.location.hash.length > 0) {
            const page_name = window.location.hash.substr(1);
            this.show(page_name);
        } else if (this.static_routes['default']) {
            this.show('default');
        }
    }

    show(route) {
        if (!route) {
            route = 'default';
        }

        if (route[0]==='#') {
            route = route.substr(1);
        }

        let page = this.match(route);

        if (page) {
            if (typeof page.handler==='function') {
                page.handler(page.params);
            } else {
                page.handler.show(page.params);
            }
        }
    }

    match(route) {
        for(let key in this.static_routes) {
            if (key === route) {
                return {handler: this.static_routes[key].handler};
            }
        }

        for(let key in this.dynamic_routes) {
            let page = this.dynamic_routes[key];
            let matches = route.match(new RegExp(page.expression));

            if (matches && matches.length == page.param_keys.length + 1) {
                let params = {}
                for (let i=0; i < page.param_keys.length; i++) {
                    params[page.param_keys[i].substr(1)] = matches[i + 1];
                }
                return {handler:page.handler, params: params};
            }
        }
    }
}