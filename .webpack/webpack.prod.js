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
    devtool: 'eval-source-map'
});
