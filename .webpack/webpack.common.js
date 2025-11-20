import { execSync } from 'node:child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from '../package.json' with { type: 'json' };

import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import { VueLoaderPlugin } from 'vue-loader';

const __dirname = dirname(fileURLToPath(import.meta.url));
let gitRevision = 'error-retrieving-revision';
let gitBranch = 'error-retrieving-branch';

try {
  gitRevision = execSync('git rev-parse HEAD').toString().trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
} catch (err) {
  console.warn('Error retreiving git info', err);
}

/** @type {import('webpack').Configuration} */
const config = {
  context: join(__dirname, '..'),
  entry: {
    'openmct-mcws-plugin': './plugin.js'
  },
  experiments: {
    outputModule: true, // Enables the feature
  },
  output: {
    library: {
      type: 'module'
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
      '@': join(__dirname, '..', 'node_modules/openmct/src'),
      objectUtils: join(
        __dirname,
        '..',
        'node_modules/openmct/src/api/objects/object-utils.js'
      ),
      utils: join(__dirname, '..', 'node_modules/openmct/src/utils'),
      'openmct.views.FolderGridViewComponent': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/folderView/components/GridView.vue'
      ),
      'openmct.views.FolderListViewComponent': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/folderView/components/ListView.vue'
      ),
      'openmct.tables.TelemetryTable': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/telemetryTable/TelemetryTable.js'
      ),
      'openmct.tables.TelemetryTableColumn': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/telemetryTable/TelemetryTableColumn.js'
      ),
      'openmct.tables.TelemetryTableRow': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/telemetryTable/TelemetryTableRow.js'
      ),
      'openmct.tables.TelemetryTableConfiguration': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/telemetryTable/TelemetryTableConfiguration.js'
      ),
      'openmct.tables.collections.TableRowCollection': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/telemetryTable/collections/TableRowCollection.js'
      ),
      'openmct.tables.components.Table': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/telemetryTable/components/TableComponent.vue'
      ),
      'openmct.tables.components.TableConfiguration': join(
        __dirname,
        '..',
        'node_modules/openmct/src/plugins/telemetryTable/components/TableConfiguration.vue'
      ),
      /**
       * Globals
       **/
      openmct: join(__dirname, '..', 'node_modules/openmct/dist/openmct.js'),
      saveAs: 'file-saver/src/FileSaver.js',
      bourbon: 'bourbon.scss',
      printj: join(__dirname, '..', 'node_modules/printj/dist/printj.min.js'),
      /**
       * OMM Paths
       **/
      types: join(__dirname, '..', 'src/types'),
      services: join(__dirname, '..', 'src/services'),
      lib: join(__dirname, '..', 'src/lib'),
      tables: join(__dirname, '..', 'src/tables'),
      ommUtils: join(__dirname, '..', 'src/utils'),
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      __OMM_VERSION__: `'${pkg.version}'`,
      __OMM_BUILD_DATE__: `'${new Date()}'`,
      __OMM_REVISION__: `'${gitRevision}'`,
      __OMM_BUILD_BRANCH__: `'${gitBranch}'`,
      __VUE_OPTIONS_API__: true, // Options API support, default: true
      __VUE_PROD_DEVTOOLS__: false, // devtools support in production, default: false
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false // detailed hydration mismatch support when using esm-bundler, default: false
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

export default config;
