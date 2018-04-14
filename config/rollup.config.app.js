module.exports = {
    input: './www/index.js',
    output: {
        file: './www/dist/js/bundle.js',
        format: 'iife',
        name: 'desk',
        sourcemap: true,
        globals: ['io', 'nunjucks'], // for socketio client, which is imported directly,
    },
    plugins: [
        require('rollup-plugin-commonjs')(),
        require('rollup-plugin-json')(),
        require('rollup-plugin-html')(),
        require('rollup-plugin-node-resolve')({
            preferBuiltins: true
        }),
    ],
}