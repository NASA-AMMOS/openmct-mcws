/*
This configuration should be used for development purposes. It contains full source map, a
devServer (which be invoked using by `npm start`), and a non-minified Vue.js distribution.
*/
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');

const proxyUrl = process.env.PROXY_URL || 'http://localhost:8080';
const apiUrl = process.env.API_URL ?? '';
const proxyHeaders = {};
if (process.env.COOKIE) {
  proxyHeaders.Cookie = process.env.COOKIE;
}

module.exports = merge(common, {
  mode: 'development',
  entry: {
    config: './config.js'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './index.html',
          transform: function (content) {
            // for dev, we serve out of dist/ so we need to replace any reference
            return content.toString().replace(/"dist\//g, '"');
          }
        },
        { from: './ExampleVenueDefinitions.json', to: 'ExampleVenueDefinitions.json' }
      ]
    })
  ],
  watchOptions: {
    // Since we use require.context, webpack is watching the entire directory.
    // We need to exclude any files we don't want webpack to watch.
    // See: https://webpack.js.org/configuration/watch/#watchoptions-exclude
    ignored: [
      '**/{node_modules,dist,docs,e2e}', // All files in node_modules, dist, docs, e2e (leaving for future builds),
      '**/{webpack*.js,babel*.js,package*.json}', // Config files
      '**/*.{sh,md,png,ttf,woff,svg}', // Non source files
      '**/.*' // dotfiles and dotfolders
    ]
  },
  devtool: 'eval-source-map',
  devServer: {
    devMiddleware: {
      writeToDisk: (filePathString) => {
        const filePath = path.parse(filePathString);
        const shouldWrite = !filePath.base.includes('hot-update');

        return shouldWrite;
      }
    },
    watchFiles: ['src/**/*.css'],
    static: [
      {
        directory: path.join(__dirname, '..', 'node_modules/openmct/dist'),
        publicPath: '/node_modules/openmct/dist',
        watch: false
      },
      {
        directory: path.join(__dirname, '..', 'test_data'),
        publicPath: '/test_data',
        watch: false
      }
    ],
    client: {
      progress: true,
      overlay: false
    },
    proxy: [
      {
        context: ['/mcws-test'],
        target: 'http://localhost:8090',
        secure: false
      },
      {
        context: ['/mcws'],
        target: apiUrl,
        secure: false,
        headers: proxyHeaders
      },
      {
        context: ['/proxyUrl'],
        target: proxyUrl,
        secure: false,
        headers: proxyHeaders,
        pathRewrite: (_path, req) => {
          const apiUrl = req.query.url;
          console.log('Generic URL Proxy to: ', apiUrl);

          return apiUrl;
        }
      }
    ],
    hot: true
  },
  stats: 'errors-warnings'
});
