const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const html = require('rollup-plugin-html');
const nodeResolve = require('rollup-plugin-node-resolve');
const precss = require('precss');
const autoprefixer = require('autoprefixer');
const postcss = require('rollup-plugin-postcss');

const getJSConfig = ({input, output}) => ({
    input: input,
    output: {
        file: output,
        format: 'iife',
        name: 'desk',
        sourcemap: true,
        globals: ['io', 'nunjucks'], // for socketio client, which is imported directly,
    },
    plugins: [
        commonjs(),
        json(),
        html(),
        nodeResolve(),
    ],
});

const getCSSConfig = ({input, output}) => ({
    input: input,
    output: {
        file: output,
        format: 'cjs'
    },
    plugins: [
        postcss({
            extract: true,
            plugins: [
                precss,
                autoprefixer
            ]
        })
    ]
});

module.exports = {
    getJSConfig,
    getCSSConfig
}
