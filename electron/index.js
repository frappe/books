global.rootRequire = function(name) {
    return require(process.cwd() + '/' + name);
}

require('./client');
