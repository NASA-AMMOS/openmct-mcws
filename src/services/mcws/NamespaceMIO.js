import MIO from './MIO';
import OpaqueFileMIO from './OpaqueFileMIO';
import DataTableMIO from './DataTableMIO';

/**
 * Handle for utilizing Namespace MIOs.
 *
 * Instantiation of a NamespaceMIO here will not create the
 * namespace in MCWS (or otherwise interact with MCWS);
 * rather, it simply provides an interface by which that
 * namespace can be created, read, and otherwise utilized.
 *
 * @constructor
 * @augments MIO
 */
class NamespaceMIO extends MIO {
    constructor(url) {
        super(url);

        this.type = 'namespace';
    }

    /**
     * Create the namespace.  Returns a promise from the underlying
     * AbstractMIO's `request` method.
     * @memberof NamespaceMIO
     * @returns {Promise} a promise that is resolved when the namespace
     *     is created, or rejected if there is an error.
     */
    create() {
        return this.request(this.url, 'PUT', {
            op: 'create',
            type: 'namespace'
        });
    }

    /**
     * Utilize an opaque file within this namespace.
     *
     * This method will not create an opaque file or fail if
     * that file does not exist; rather, it provides a
     * OpaqueFileMIO object with methods to create, read, etc.
     *
     * @memberof NamespaceMIO
     * @param {string} name the name of the MIO
     * @returns {OpaqueFileMIO} a handle to the opaque file
     */
    opaqueFile(name) {
        return new OpaqueFileMIO(`${this.url}/${name}`);
    }

    /**
    * Utilize a namespace within this namespace. The specified
    * namespace should include a leading slash (this is for
    * consistency with the way namespaces are presented within
    * MCWS.)
    *
    * This method will not create a namespace or fail if a
    * namespace does not exist; rather, it provides a
    * NamespaceMIO object with methods to create, read, etc.
    *
    * @memberof NamespaceMIO
    * @param {string} namespace the namespace to utilize
    * @returns {NamespaceMIO} a handle to that namespace
    */
    namespace(name) {
        return new NamespaceMIO(`${this.url}/${name}`);
    }

    /**
    * Utilize a datatable within this namespace.
    *
    * This method will not create a datatable or fail if a
    * datatable does not exist; rather, it provides a
    * datatable object with methods to create, read, etc.
    *
    * @memberof NamespaceMIO
    * @param {string} datatable the datatable to utilize
    * @returns {DataTableMIO} a handle to that datatable
    */
    dataTable(name) {
        return new DataTableMIO(`${this.url}/${name}`);
    }

    /**
     * Returns a child MIO from a triple obtained by listing the contents
     * of the namespace.
     * @private
     */
    #childFromTriple(triple) {
        if (triple.predicate === 'has_mio_type') {
            const name = triple.subject.split('/').slice(-1)[0];

            if (triple.object === 'datatable_file') {
                return this.dataTable(name);
            } else if (triple.object === 'opaque_file') {
                return this.opaqueFile(name);
            } else if (triple.object === 'namespace') {
                return this.namespace(name);
            } else {
                throw new Error(`Unknown child [${triple.subject}] of type [${triple.object}] in namespace [${this.url}].`);
            }
        } else if (triple.predicate === 'has_registered_namespace') {
            return this.namespace(triple.object.slice(1));
        }
    }

    /**
     * List contents of a namespace and make them available for reading.
     */
    async list() {
        const response = await this.read();
        const jsonResponse = await response.json();
        const triples = jsonResponse.filter(triple =>
            triple.predicate === 'has_mio_type' || triple.predicate === 'has_registered_namespace'
        );

        return triples.map(this.#childFromTriple);
    }

    read(params = {}) {
        params.output = 'json';

        return super.read(params);
    }
}

export default NamespaceMIO;