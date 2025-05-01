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
