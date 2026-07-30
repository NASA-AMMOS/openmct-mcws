import {
  CHANNEL_TABLE_KEY,
  CHANNEL_TABLE_NAME,
  CHANNEL_TABLE_ICON,
  CHANNEL_KEY
} from '../constants.js';
import ChannelTableViewProvider from './ChannelTableViewProvider.js';
import ChannelTableFormatViewProvider from './ChannelTableFormatViewProvider.js';
import VistaTableConfigurationProvider from '../../tables/VistaTableConfigurationProvider.js';

export default function install(options) {
  return function ChannelTablePlugin(openmct) {
    openmct.types.addType(CHANNEL_TABLE_KEY, {
      name: CHANNEL_TABLE_NAME,
      description:
        'Group multiple telemetry elements together into a tabular view which shows the latest value of each contained telemetry element.  Channel Tables can be added to Channel Table Sets or Display Layouts.',
      cssClass: CHANNEL_TABLE_ICON,
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          columnWidths: {},
          hiddenColumns: {}
        };
      }
    });

    openmct.objectViews.addProvider(new ChannelTableViewProvider(openmct, options));

    openmct.inspectorViews.addProvider(
      new VistaTableConfigurationProvider(
        'vista.channel-list-configuration',
        'Config',
        CHANNEL_TABLE_KEY,
        openmct,
        options
      )
    );
    openmct.inspectorViews.addProvider(new ChannelTableFormatViewProvider(openmct, options));

    openmct.composition.addPolicy((parent, child) => {
      if (parent.type === CHANNEL_TABLE_KEY) {
        return child.type === CHANNEL_KEY;
      }

      return true;
    });
  };
}
