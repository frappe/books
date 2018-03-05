module.exports = {
    slug(text) {
        return text.toLowerCase().replace(/ /g, '_');
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
    }

};