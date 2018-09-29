const mkdirp = require('mkdirp');
const fs = require('fs');
const getDirName = require('path').dirname;
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

        return function(req, res, next){    

            const file = (req.url).toString().replace(/\?.*/, "");
            const dimension = req.query.size || ""
            const staticFile = staticPath + file

            fs.exists(staticFile, (exists) => {
                if(!exists){
                    return next()
                }

                fs.stat(staticFile, (err, stats) => {
                    if(err){
                        throw err
                    }

                    //Check if url is static file
                    if(stats.isFile()){

                        //Check if url has dimension parameters
                        if(dimension != ""){
                            const width = parseInt(dimension.split('x')[0])
                            const height = parseInt(dimension.split('x')[1])
                            const destination = staticPath + '/.thumbnails/' + width + 'x' + height + file.replace('/', '')
                            
                            //Check if thumbnail already present
                            fs.existsSync(destination, (exists) => {
                                if(exists)
                                    return res.sendFile(destination)
                            })

                            //Resize image
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
                        console.log('File is not static.')
                        return next()
                    }
                })
            })
        }
    }
}