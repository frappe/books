const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const getDirName = path.dirname;
const os = require('os');

module.exports = {
    writeFile(fullpath, contents) {
        return new Promise((resolve, reject) => {
            mkdirp(getDirName(fullpath), (err) => {
                if (err) reject(err);
                fs.writeFile(fullpath, contents, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
        });
    },

    readFile(filepath) {
        return fs.readFileSync(filepath, 'utf-8');
    },

    getTmpDir() {
        return os.tmpdir();
    }
}
