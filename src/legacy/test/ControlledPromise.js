/*global define,spyOn,Promise*/

define(
    function () {

        /**
         * An instrumented promise implementation for better control of promises
         * during tests.
         *
         */
        function ControlledPromise(name) {
            var controller = this;
            this.name = name || 'promise';
            this.promise = new Promise(function (resolve, reject) {
                controller._resolve = function (result) {
                    resolve(result);
                };
                controller._reject = function (result) {
                    reject(result);
                };
            });
            spyOn(this, 'then').andCallThrough();
        }

        /**
         * Resolve the promise, passing the supplied value as the result.
         */
        ControlledPromise.prototype.resolve = function(value) {
            this._resolve(value);
        };

        /**
         * Reject the promise, passing the supplied value as the result.
         */
        ControlledPromise.prototype.reject = function(value) {
            this._reject(value);
        };

        /**
         * Standard promise.then, returns a promise that support chaining.
         */
        ControlledPromise.prototype.then = function (onResolve, onReject) {
            return this.promise.then(onResolve, onReject);
        };

        return ControlledPromise;

    }
);
