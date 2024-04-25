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
             * Globals
            **/
            "openmct": path.join(__dirname, '..', "node_modules/openmct/dist/openmct.js"),
            "saveAs": "file-saver/src/FileSaver.js",
            "EventEmitter": "eventemitter3",
            "bourbon": "bourbon.scss",
            "printj": path.join(__dirname, '..', "node_modules/printj/dist/printj.min.js"),
            "styles": path.join(__dirname, '..', "node_modules/openmct/src/styles"),
            /**
             * VISTA Paths
            **/
            "types": path.join(__dirname, '..', "src/types"),
            "services": path.join(__dirname, '..', "src/services"),
            "lib": path.join(__dirname, '..', "src/lib"),
            "tables": path.join(__dirname, '..', "src/tables"),
            /**
             * Open MCT Folder View Components
            **/
            "openmct.views.FolderGridViewComponent": path.join(__dirname, '..', "node_modules/openmct/src/plugins/folderView/components/GridView.vue"),
            "openmct.views.FolderListViewComponent": path.join(__dirname, '..', "node_modules/openmct/src/plugins/folderView/components/ListView.vue"),
            /**
             * Open MCT Telemetry Tables
            **/
            "openmct.tables.TelemetryTable": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTable.js"),
            "openmct.tables.TelemetryTableColumn": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTableColumn.js"),
            "openmct.tables.TelemetryTableRow": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTableRow.js"),
            "openmct.tables.TelemetryTableConfiguration": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/TelemetryTableConfiguration.js"),
            /**
             * Telemetry Table Collections
            **/
            "openmct.tables.collections.TableRowCollection": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/collections/TableRowCollection.js"),
             /**
             * Telemetry Table Components
            **/
            "openmct.tables.components.Table": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/components/table.vue"),
            "openmct.tables.components.TableConfiguration": path.join(__dirname, '..', "node_modules/openmct/src/plugins/telemetryTable/components/table-configuration.vue"),
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            __VISTA_VERSION__: `'${packageDefinition.version}'`,
            __VISTA_BUILD_DATE__: `'${new Date()}'`,
            __VISTA_REVISION__: `'${gitRevision}'`,
            __VISTA_BUILD_BRANCH__: `'${gitBranch}'`
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
                    'resolve-url-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.vue$/,
                use: 'vue-loader'
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
