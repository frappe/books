module.exports = {
    slug(text) {
        return text.toLowerCase().replace(/ /g, '_');
    },

    async_handler(fn) {
        return (req, res, next) => Promise.resolve(fn(req, res, next))
            .catch(next);
    },

    async sleep(seconds) {
        return new Promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    }
}
