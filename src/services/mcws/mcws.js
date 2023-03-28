import NamespaceMIO from './NamespaceMIO';
import DataTableMIO from './DataTableMIO';
import OpaqueFileMIO from './OpaqueFileMIO';
import client from './MCWSClient';

class MCWS {
    constructor() {
        window.mcws = this;
    }

    configure(config) {
        client.configure(config);
    }

    namespace(name) {
        return new NamespaceMIO(name);
    }

    dataTable(name) {
        return new DataTableMIO(name);
    }

    opaqueFile(name) {
        return new OpaqueFileMIO(name);
    }
}

const mcws = new MCWS();

export default mcws;
