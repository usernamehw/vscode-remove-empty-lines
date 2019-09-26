//@ts-check

'use strict';

const webpack = require('webpack');
const path = require('path');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

module.exports = (env, options) => {
	/**@type {import('webpack').Configuration}*/
	const config = {
		target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

		entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
		output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
			path: path.resolve(__dirname, 'dist'),
			filename: 'extension.js',
			libraryTarget: "commonjs2",
			devtoolModuleFilenameTemplate: "../[resource-path]",
		},
		devtool: 'source-map',
		externals: {
			vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		},
		resolve: { // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
			extensions: ['.ts', '.js']
		},
		module: {
			rules: [{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [{
					loader: 'ts-loader',
				}]
			}]
		},
		plugins: [
			new FriendlyErrorsWebpackPlugin(),
		]
	};

	if (options.mode === 'production') {
		// Prod
	} else {
		// Dev
		config.plugins.push(new webpack.DefinePlugin({
			__DEV: JSON.stringify(true)
		}));
		config.module.rules[0] = {
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
			}]
		}
	}

	return config;
}
