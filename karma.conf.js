/*global module*/

const path = require('path');

module.exports = function(config) {
    const webpackConfig = require('./.webpack/webpack.dev.js');
    delete webpackConfig.output;
    delete webpackConfig.entry;

    webpackConfig.module.rules.push({
        test: /\.js$/,
        exclude: /node_modules|lib|dist/,
        use: {
            loader: 'babel-loader',
            options: {
                // eslint-disable-next-line no-undef
                configFile: path.resolve(process.cwd(), 'babel.coverage.js')
            }
        }
    });

    config.set({

        // Base path that will be used to resolve all file patterns.
        basePath: '',

        // Frameworks to use
        // Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // List of files / patterns to load in the browser.
        // By default, files are also included in a script tag.
        files: [
            'src/**/*Spec.js'
        ],

        // List of files to exclude.
        exclude: [],

        // Preprocess matching files before serving them to the browser.
        // https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'src/**/*Spec.js': ['webpack', 'sourcemap']
        },

        // Test results reporter to use
        // Possible values: 'dots', 'progress'
        // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress', 'coverage', 'html'],

        // Web server port.
        port: 9876,

        // Wnable / disable colors in the output (reporters and logs).
        colors: true,

        logLevel: config.LOG_INFO,

        // Rerun tests when any file changes.
        autoWatch: true,

        // Specify browsers to run tests in.
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [
            'ChromeHeadless'
        ],

        // Code coverage reporting.
        coverageReporter: {
            dir: "target/coverage",
            reports: ['html', 'text-summary']
        },

        // HTML test reporting.
        htmlReporter: {
            outputDir: "target/tests",
            preserveDescribeNesting: true,
            foldAll: false
        },

        webpack: webpackConfig,

        webpackMiddleware: {
            stats: 'errors-only',
            logLevel: 'warn'
        },

        // Continuous Integration mode.
        // If true, Karma captures browsers, runs the tests and exits.
        singleRun: true
    });
};
