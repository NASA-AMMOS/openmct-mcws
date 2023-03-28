import MCWSParameters from './MCWSParameters';
import mcwsClient from './MCWSClient';


/**
 * Abstract superclass for handles to specific MIOs.
 *
 * Instantiation of an MIO here will not create the
 * MIO in MCWS (or otherwise interact with MCWS);
 * rather, it simply provides an interface by which that
 * MIO can be created, read, and otherwise utilized.
 *
 * @constructor
 * @param url the url for this MIO.
 */
export default class MIO {
    constructor(url = '') {
        if (url.endsWith('/')) {
            url = url.slice(0, -1);
        }

        this.url = url;
        this.metadataUrl = `${url}/`;

        const pathParts = url.split('/');
        this.name = pathParts[pathParts.length - 1];

        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }
    }

    /**
    * Issue an HTTP request to this MIO.
    *
    * Specific MIO classes will provide interfaces for normal
    * operations, and these should generally be used instead
    * of this method (this method primarily supports their
    * implementation.) However, this is exposed in the event
    * that having slightly more fine-grained control over the
    * HTTP request is desired.
    *
    * This interacts fairly directly with `$http`, so its
    * behaviors will be in effect (e.g. JSON responses
    * will be parsed to JavaScript objects.) The main
    * difference is that the response body (the `data`
    * field of `$http`'s response) will be pulled out
    * and given as the result.
    *
    * If the `params` object contains nested objects, these
    * will be converted to the parenthetical form expected
    * by MCWS.
    *
    * @method
    * @memberof MIO
    * @returns {Promise} a promise for the response body
    * @param {string} method the HTTP method to use
    * @param {object.<string, string>} params query string
    *        parameters
    * @param {object} body the request body; if this is not
    *        a string, it will be stringified to JSON
    */
    request(url, method, params, body) {
        let options = {
            url,
            method,
        };

        if (params) {
            options.params = new MCWSParameters(params);
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        return mcwsClient.request(options);
    }

    async getMetadata() {
        const response = await this.request(this.metadataUrl, 'GET', { output: 'json' });
        const metadataResponse = await response.json();
                
        return {
            get(subject, predicate) {
                const metadata = metadataResponse.filter((triple) => {
                    return triple.subject === subject && triple.predicate === predicate;
                })[0];

                return metadata?.object;
            },
            list() {
                return metadataResponse;
            }
        };
    }

    /**
     * Add metadata to this MIO, in predicate-object form.
     * See MCWS documentation for further details.
     *
     * This will issue an HTTP request, and so its result
     * will be given as a promise.
     *
     * @method
     * @memberof MIO
     * @returns {Promise} a promise for the response body
     * @param {string} predicate the predicate
     * @param {string} object the object
     */
    addMetadata(predicate, object) {
        return this.request(this.metadataUrl, 'POST', {
            predicate,
            object
        });
    }

    /**
     * Delete metadata from this MIO, in predicate-object form.
     * See MCWS documentation for further details.
     *
     * This will issue an HTTP request, and so its result
     * will be given as a promise.
     *
     * @method
     * @memberof MIO
     * @returns {Promise} a promise for the response body
     * @param {string} predicate the predicate
     * @param {string} object the object
     */
    removeMetadata(predicate, object) {
        return this.request(this.metadataUrl, 'DELETE', {
            predicate,
            object
        });
    }

    /**
     * Read the contents of this namespace. This will issue an HTTP
     * request which will be handled asynchronously, so the result
     * is given as a promise.
     * @method read
     * @memberof NamespaceMIO
     * @returns {Promise} a listing of this namespace's contents
     */
    async read(params) {
        try {
            const response = await this.request(this.url, 'GET', params);

            return response;
        } catch (error) {
            const response = error?.response ?? {
                message: 'unknown error',
                error
            };

            return Promise.reject(response);
        }
    };
}
