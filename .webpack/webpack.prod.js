/*
This configuration should be used for production installs.
It is the default webpack configuration.
*/

import { merge } from 'webpack-merge';
import common from './webpack.common.js';

/** @type {import('webpack').Configuration} */
export default merge(common, {
  mode: 'production',
  devtool: 'eval-source-map'
});
