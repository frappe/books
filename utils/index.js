Array.prototype.equals = function( array ) {
    return this.length == array.length &&
           this.every( function(item,i) { return item == array[i] } );
}

module.exports = {
    slug(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    },

    getRandomString() {
        return Math.random().toString(36).substr(3);
    },

    async sleep(seconds) {
        return new Promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    },

    _(text, args) {
        // should return translated text
        return this.stringReplace(text, args);
    },

    stringReplace(str, args) {
        if (!Array.isArray(args)) {
            args = [args];
        }

        if(str==undefined) return str;

        let unkeyed_index = 0;
        return str.replace(/\{(\w*)\}/g, (match, key) => {
            if (key === '') {
                key = unkeyed_index;
                unkeyed_index++
            }
            if (key == +key) {
                return args[key] !== undefined
                    ? args[key]
                    : match;
            }
        });
    },

    getQueryString(params) {
        if (!params) return '';
        return Object.keys(params)
            .map(k => params[k] != null ? encodeURIComponent(k) + '=' + encodeURIComponent(params[k]) : null)
            .filter(v => v)
            .join('&');
    },

    asyncHandler(fn) {
        return (req, res, next) => Promise.resolve(fn(req, res, next))
            .catch((err) => {
                console.log(err);
                // handle error
                res.status(err.status_code || 500).send({error: err.message});
            });
    },

};