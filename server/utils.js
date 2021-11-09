const fs = require('fs');
const path = require('path');
const getDirName = path.dirname;
const os = require('os');

module.exports = {
  writeFile(fullpath, contents) {
    return new Promise((resolve, reject) => {
      fs.mkdir(getDirName(fullpath), { recursive: true }, (err) => {
        if (err) reject(err);
        fs.writeFile(fullpath, contents, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    });
  },

  readFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
  },

  getTmpDir() {
    return os.tmpdir();
  },
};
