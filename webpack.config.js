/**
 * Created by wangxin on 16/9/6第37周.
 */

var path = require("path");
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack')

module.exports = {
    devtool: 'source-map', // or 'inline-source-map'
    devServer: {
        disableHostCheck: true
    },
    entry: { "app": path.resolve(__dirname, './pullLoad/List') },
    output: {
        filename: '[name].js',
        chunkFilename: '[id].chunk.js',
        path: path.join(__dirname, '/dist'),
        publicPath: '/dist/'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css', '.less']
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    //resolve-url-loader may be chained before sass-loader if necessary
                    use: ['css-loader?modules', 'less-loader']
                })
            },
            {
                test: /\.jsx?$/,
                include: [
                    path.resolve(__dirname, 'pullLoad')
                ],
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    presets: ['es2015', 'react', 'stage-3'],
                    plugins: ['transform-runtime']
                }
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192
                        }
                    }
                ]
            }
        ],
        noParse: [/moment.js/]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            // minChunks: 2,
            name: 'shared',
            filename: 'shared.js'
        }),
        new ExtractTextPlugin('style.css')
    ]
};