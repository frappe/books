const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');
const getDirName = path.dirname;
const os = require('os');
const sharp = require('sharp');

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
    },

    thumbnailMiddleware(staticPath) {

        return function (req, res, next) {

            const filename = req.path.split(path.sep).slice(-1)[0]
            const dimension = req.query.size || null
            const staticFile = path.join(staticPath, filename)

            fs.exists(staticFile, (exists) => {
                if (!exists) {
                    return next()
                }

                fs.stat(staticFile, (err, stats) => {
                    if (err) {
                        throw err
                    }

                    //Check if url is static file
                    if (stats.isFile()) {

                        // Check if url has dimension parameters
                        if (dimension) {
                            let [width, height] = dimension.split('x');
                            width = +width;
                            height = +height;
                            const thumbnailPath = path.join(staticPath, 'thumbnails');
                            const destination = path.join(thumbnailPath, `${width}x${height}-${filename}`)

                            // create thumbnails folder if not exists
                            if (!fs.existsSync(thumbnailPath)) {
                                fs.mkdirSync(thumbnailPath);
                            }

                            // Check if thumbnail already present
                            fs.existsSync(destination, (exists) => {
                                if (exists)
                                    return res.sendFile(destination)
                            })

                            // Resize image
                            sharp(staticFile)
                                .resize(width, height)
                                .toFile(destination)
                                .then(() => {
                                    return res.sendFile(destination)
                                })
                                .catch(err => {
                                    console.error(err)
                                })

                        } else {
                            return res.sendFile(staticFile)
                        }
                    } else {
                        // File is not static
                        return next()
                    }
                })
            })
        }
    }
}