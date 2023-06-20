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

    namespace(name, abortSignal) {
        return new NamespaceMIO(name, abortSignal);
    }

    dataTable(name, abortSignal) {
        return new DataTableMIO(name, abortSignal);
    }

    opaqueFile(name, abortSignal) {
        return new OpaqueFileMIO(name, abortSignal);
    }
}

const mcws = new MCWS();

export default mcws;
