import PacketSummaryViewProvider from './PacketSummaryViewProvider.js';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider.js';

export default function PacketSummaryPlugin(options) {
  return function install(openmct) {
    openmct.types.addType('vista.packetSummaryView', {
      name: 'Packet Summary View',
      description: 'Drag and drop a packet summary events node into this view',
      cssClass: 'icon-tabular-lad',
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {};
      }
    });

    openmct.objectViews.addProvider(new PacketSummaryViewProvider(openmct, options));

    const wrappedGet = openmct.objectViews.get;
    openmct.objectViews.get = function (domainObject) {
      return wrappedGet
        .apply(this, arguments)
        .filter(
          (viewProvider) =>
            !(domainObject.type === 'vista.packetSummaryEvents' && viewProvider.key === 'table')
        );
    };

    openmct.composition.addPolicy((parent, child) => {
      if (parent.type === 'vista.packetSummaryView') {
        return child.type === 'vista.packetSummaryEvents';
      }
      return true;
    });

    openmct.inspectorViews.addProvider(
      new VistaTableConfigurationProvider(
        'vista.packet-summary-configuration',
        'Config',
        'vista.packetSummaryView',
        openmct,
        options
      )
    );
  };
}
