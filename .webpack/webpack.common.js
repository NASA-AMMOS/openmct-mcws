/* global __dirname module */

const path = require('path');
const packageDefinition = require('../package.json');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const { VueLoaderPlugin } = require('vue-loader');
let gitRevision = 'error-retrieving-revision';
let gitBranch = 'error-retrieving-branch';

try {
    gitRevision = require('child_process')
        .execSync('git rev-parse HEAD')
        .toString().trim();
    gitBranch = require('child_process')
        .execSync('git rev-parse --abbrev-ref HEAD')
        .toString().trim();
} catch (err) {
    console.warn('Error retreiving git info', err);
}

/** @type {import('webpack').Configuration} */
const config = {
    context: path.join(__dirname, '..'),
    entry: {
        'openmct-mcws': './loader.js'
    },
    output: {
        library: {
            name: 'openmctMCWS',
            type: 'umd',
        },
        filename: '[name].js',
        hashFunction: 'xxhash64',
        clean: true
    },
    resolve: {
        alias: {
            /**
             * Open MCT Source Paths
             * TODO FIXME these rely on openmct core source paths becase we extend core code directly
             */
            "@": path.join(__dirname, '..', "node_modules/openmct/src"),
            "objectUtils": path.join(__dirname, '..', 'node_modules/openmct/src/api/objects/object-utils.js'),
            "utils": path.join(__dirname, '..', 'node_modules/openmct/src/utils'),
            "openmct.views.FolderGridViewComponent": path.join(__dirname, '..', "node_modules/openmct/src/plugins/folderView/components/GridView.vue"),
            "openmct.views.FolderListViewComponent": path.join(__dirname, '..', "node_modules/openmct/src/plugins/folderView/components/ListView.vue"),
            "openmct.tables.TelemetryTable": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTable.js"),
            "openmct.tables.TelemetryTableColumn": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTableColumn.js"),
            "openmct.tables.TelemetryTableRow": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTableRow.js"),
            "openmct.tables.TelemetryTableConfiguration": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTableConfiguration.js"),
            "openmct.tables.collections.TableRowCollection": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/collections/TableRowCollection.js"),
            "openmct.tables.components.Table": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/components/TableComponent.vue"),
            "openmct.tables.components.TableConfiguration": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/components/TableConfiguration.vue"),
            /**
             * Globals
            **/
            "openmct": path.join(__dirname, '..', "node_modules/openmct/dist/openmct.js"),
            "saveAs": "file-saver/src/FileSaver.js",
            "bourbon": "bourbon.scss",
            "printj": path.join(__dirname, '..', "node_modules/printj/dist/printj.min.js"),
            /**
             * VISTA Paths
            **/
            "types": path.join(__dirname, '..', "src/types"),
            "services": path.join(__dirname, '..', "src/services"),
            "lib": path.join(__dirname, '..', "src/lib"),
            "tables": path.join(__dirname, '..', "src/tables"),
            "ommUtils": path.join(__dirname, '..', "src/utils"),
            "vue": "vue/dist/vue.esm-bundler.js"
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            __VISTA_VERSION__: `'${packageDefinition.version}'`,
            __VISTA_BUILD_DATE__: `'${new Date()}'`,
            __VISTA_REVISION__: `'${gitRevision}'`,
            __VISTA_BUILD_BRANCH__: `'${gitBranch}'`,
            __VUE_OPTIONS_API__: true, // enable/disable Options API support, default: true
            __VUE_PROD_DEVTOOLS__: false // enable/disable devtools support in production, default: false
        }),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[name].css'
        })
    ],
    module: {
        rules: [
            {
                test: /\.(sc|sa|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'resolve-url-loader'
                    },
                    {
                        loader: 'sass-loader',
                        options: { sourceMap: true }
                    }
                ]
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    compilerOptions: {
                        hoistStatic: false,
                        whitespace: 'preserve'
                    }
                }
            },
            {
                test: /\.html$/,
                type: 'asset/source'
            },
            {
                test: /\.(jpg|jpeg|png|svg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext]'
                }
            },
            {
                test: /\.ico$/,
                type: 'asset/resource',
                generator: {
                    filename: 'icons/[name][ext]'
                }
            },
            {
                test: /\.(woff|woff2?|eot|ttf)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext]'
                }
            }
        ]
    },
    stats: 'errors-warnings'
};

module.exports = config;
