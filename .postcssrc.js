// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  "plugins": {
    "postcss-import": {
      resolve(id) {
        // sass imports that start with ~ (which refers node_modules) should be supported
        if (id.startsWith('~')) {
          return id.slice(1);
        }
        return id;
      }
    },
    "postcss-url": {},
    // to edit target browsers: use "browserslist" field in package.json
    "autoprefixer": {}
  }
}
