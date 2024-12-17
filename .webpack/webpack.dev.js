/* global __dirname module*/

/*
This configuration should be used for development purposes. It contains full source map, a
devServer (which be invoked using by `npm start`), and a non-minified Vue.js distribution.
*/
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');

String.prototype.replaceAt = function(index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

const proxyUrl = process.env.PROXY_URL || 'http://localhost:8080';
const apiUrl = process.env.API_URL ?? '';
const  proxyHeaders = {};
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
        static: [{
            directory: path.join(__dirname, '..', 'node_modules/openmct/dist'),
            publicPath: '/node_modules/openmct/dist',
            watch: false
        },{
            directory: path.join(__dirname, '..', 'test_data'),
            publicPath: '/test_data',
            watch: false
        }],
        client: {
            progress: true,
            overlay: false
        },
        proxy: [
          {
            context: ['/mcws-test'],
            target: 'http://localhost:8090',
            secure: false,
          },
          {
            context: ['/mcws'],
            target: apiUrl,
            secure: false,
            headers: proxyHeaders,
            changeOrigin: true
          },
          {
            context: ['/tsdb'],
            target: apiUrl,
            secure: false,
            headers: proxyHeaders,
            changeOrigin: true,
            pathRewrite: (path, req) => {
                console.log(path)
                var replacedPath = path;
                console.log(replacedPath)
                const searchTerm = '?';
                const indexOfFirst = paragraph.indexOf(searchTerm);
                console.log(indexOfFirst);
                if(indexOfFirst!=-1){
                    const indexOfSecond = paragraph.indexOf(searchTerm, indexOfFirst +1);
                    console.log(indexOfSecond)
                    if(indexOfSecond!=-1){
                        replacedPath=replacedPath.replaceAt(indexOfSecond,'&');
                        console.log(replacedPath)
                    }
                }

                return replacedPath;
              },
          },
          {
            context: ['/proxyUrl'],
              target: proxyUrl,
              secure: false,
              headers: proxyHeaders,
              changeOrigin: true,
              pathRewrite: (_path, req) => {
                  var apiUrl = req.query.url;
                  const searchTerm = '?';
                  const indexOfFirst = apiUrl.indexOf(searchTerm);
                  if(indexOfFirst!=-1){
                      const indexOfSecond = apiUrl.indexOf(searchTerm, indexOfFirst +1);
                      if(indexOfSecond!=-1){
                          apiUrl=apiUrl.replaceAt(indexOfSecond,'&');
                      }
                  }
                  console.log('Generic URdL Proxy to: ', apiUrl);
                  return apiUrl;
              },

              router: () => 'https://mct.vitals.jpl.nasa.gov'
          }
        ],
        hot: true,
    },
    stats: 'errors-warnings'
});
