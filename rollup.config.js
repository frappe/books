module.exports = [
    require('frappejs/config/rollup.config.style.js'),
    {
        input: './index.js',
        output: {
			file: './js/bundle.js',
			format: 'cjs'
		},
		plugins: [
			require('rollup-plugin-commonjs')(),
			require('rollup-plugin-json')(),
			require('rollup-plugin-node-resolve')(),
			require('rollup-plugin-node-builtins')()
		]
    }
]