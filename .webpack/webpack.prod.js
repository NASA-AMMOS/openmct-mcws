/* global __dirname module */

/*
This configuration should be used for production installs.
It is the default webpack configuration.
*/

const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports =  merge(common, {
    mode: 'production',
    resolve: {
        alias: {
            "vue": path.join(__dirname, '..', 'node_modules/vue/dist/vue.min.js'),
        }
    },
    devtool: 'source-map'
});
