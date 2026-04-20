import NamespaceMIO from './NamespaceMIO.js';
import DataTableMIO from './DataTableMIO.js';
import OpaqueFileMIO from './OpaqueFileMIO.js';
import client from './MCWSClient.js';

class MCWS {
  constructor() {
    window.mcws = this;
  }

  configure(config) {
    client.configure(config);
  }

  namespace(name, options) {
    return new NamespaceMIO(name, options);
  }

  dataTable(name, options) {
    return new DataTableMIO(name, options);
  }

  opaqueFile(name, options) {
    return new OpaqueFileMIO(name, options);
  }
}

const mcws = new MCWS();

export default mcws;
