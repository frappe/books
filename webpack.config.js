module.exports = {
	entry: './frappe/client/index.js',
	output: {
		filename: './frappe/client/js/bundle.js'
	},
    module: {
        rules: [{
            test: /\.scss$/,
            use: [{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            }, {
                loader: "sass-loader", // compiles Sass to CSS
                options: {
                    includePaths: ["node_modules", "./frappe/client/scss"]
				}
			}]
		}]
	}
};