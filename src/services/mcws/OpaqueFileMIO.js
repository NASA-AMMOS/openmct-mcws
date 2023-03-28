import MIO from './MIO';

/**
 * Handle for utilizing Opaque File MIOs.
 *
 * Instantiation of a OpaqueFileMIO here will not create the
 * opaque file in WebCIE (or otherwise interact with WebCIE);
 * rather, it simply provides an interface by which that
 * opaque file can be created, read, and otherwise utilized.
 *
 * @constructor
 * @augments AbstractMIO
 * @param $http Angular's $http, for HTTP requests
 * @param {string} ciePath the URI to the WebCIE instance
 * @param {string} namespace the namespace of this MIO
 * @param {string} the name of this MIO (no leading slash)
 */

class OpaqueFileMIO extends MIO {
    constructor(url) {
        super(url);

        this.type = 'opaque_file';
    }

    /**
     * Create this Opaque File MIO. This will issue an HTTP
     * request which will be handled asynchronously, so the result
     * is given as a promise.
     *
     * @method create
     * @memberof OpaqueFileMIO
     * @param {object} body the contents of this opaque file; if
     *        this is not a string, this will be stringified to JSON.
     * @param {string} [contentType='application/json'] mime contentType of the opaqueFile,
     *        defaults to `application/json`
     * @returns {Promise} response the response body
     */
    create(body, contentType = 'application/json') {
        return this.request(this.url, 'PUT', {
            op: 'create',
            type: 'opaque_file',
            content_type: contentType
        }, body);
    }

    /**
     * Replace the contents of this Opaque File MIO. This will issue
     * an HTTP request which will be handled asynchronously, so the
     * result is given as a promise.
     *
     * @method replace
     * @memberof OpaqueFileMIO
     * @param {object} body the contents of this opaque file; if
     *        this is not a string, this will be stringified to JSON.
     * @returns {Promise} response the response body
     */
    replace(body) {
        return this.request(this.url, 'PUT', {}, body);
    }

    /**
     * Delete this Opaque File MIO. This will issue an HTTP
     * request which will be handled asynchronously, so the result
     * is given as a promise.
     *
     * @method remove
     * @memberof OpaqueFileMIO
     * @returns {Promise} the response body
     */
    remove() {
        return this.request(this.url, 'DELETE');
    }
}

export default OpaqueFileMIO;
