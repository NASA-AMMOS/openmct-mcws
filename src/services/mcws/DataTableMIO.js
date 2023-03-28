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
 * @param {string} mcwsPath the URI to the MCWS instance
 * @param {string} namespace the namespace of this MIO
 * @param {string} the name of this MIO (no leading slash)
 */

class DataTableMIO extends MIO {
    constructor(url) {
        super(url);

        this.type = 'datatable';
    }

    read(params = {}) {
        params.output = 'json';

        return super.read(params);
    }
}

export default DataTableMIO;
