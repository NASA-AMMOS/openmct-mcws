/*
This configuration should be used for production installs.
It is the default webpack configuration.
*/

const { merge } = require('webpack-merge');
const common = require('./webpack.common');

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'production',
  devtool: 'eval-source-map'
});
