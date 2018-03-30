const mkdirp = require('mkdirp');
const fs = require('fs');
const getDirName = require('path').dirname;

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
    }
}