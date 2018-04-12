module.exports = {
    input: './node_modules/frappejs/client/style/style.scss',
    output: {
        file: './www/dist/css/style.css',
        format: 'cjs'
    },
    plugins: [
        require('rollup-plugin-postcss')({
            extract: true,
            plugins: [
                require('precss'),
                require('autoprefixer')
            ]
        })
    ]
};