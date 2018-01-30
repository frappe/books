module.exports = {
    input: './node_modules/frappejs/client/style/index.scss',
    output: {
        file: './dist/css/style.css',
        format: 'cjs'
    },
    plugins: [
        require('rollup-plugin-sass')(),
        require('rollup-plugin-postcss')({
            extract: true,
            plugins: [
                require('precss'),
                require('autoprefixer')
            ]
        })
    ]
};