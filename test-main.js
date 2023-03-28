/*global require,window*/
var allTestFiles = [];
var TEST_REGEXP = /(Spec)\.js$/;

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

require.config({
    // Karma serves files from the basePath defined in karma.conf.js
    baseUrl: '/base',

    paths: {
        'lodash': 'bower_components/lodash/lodash.min',
        'moment': 'bower_components/moment/moment',
        "uuid": 'bower_components/node-uuid/uuid',
        "saveAs": "bower_components/FileSaver.js/FileSaver.min",
        "html2canvas": "bower_components/html2canvas/build/html2canvas.min"
    },

    map: {
        'vista': {
            'uuid': 'bower_components/node-uuid/uuid'
        }
    },

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: function () {
        var args = [].slice.apply(arguments);
        require([
            'node_modules/es6-promise/dist/es6-promise'
        ], function (es6Promise) {
            if (!window.Promise) {
                window.Promise = es6Promise.Promise;
            }
            window.__karma__.start.apply(window.__karma__, args);
        });
    }
});
