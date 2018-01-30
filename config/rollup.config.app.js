module.exports = {
	input: './src/index.js',
	output: {
		file: './dist/js/bundle.js',
		format: 'iife',
		name: 'desk'
	},
	plugins: [
		require('rollup-plugin-commonjs')(),
		require('rollup-plugin-json')(),
		require('rollup-plugin-node-resolve')(),
		require('rollup-plugin-node-builtins')()
	]
}
