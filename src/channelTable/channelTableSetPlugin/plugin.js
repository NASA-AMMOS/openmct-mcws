import {
  CHANNEL_TABLE_SET_ICON,
  CHANNEL_TABLE_SET_KEY,
  CHANNEL_TABLE_SET_NAME
} from '../constants.js';
import ChannelTableSetViewProvider from './ChannelTableSetViewProvider.js';
import ChannelTableSetViewActions from './ChannelTableSetViewActions.js';
import channelTableSetCompositionPolicy from './ChannelTableSetCompositionPolicy.js';
import VistaTableConfigurationProvider from '../../tables/VistaTableConfigurationProvider.js';

export default function ChannelTableSetPlugin(options) {
  return function install(openmct) {
    openmct.objectViews.addProvider(new ChannelTableSetViewProvider(openmct));

    openmct.inspectorViews.addProvider(
      new VistaTableConfigurationProvider(
        'vista.chanTable-configuration',
        'Config',
        CHANNEL_TABLE_SET_KEY,
        openmct,
        options
      )
    );

    ChannelTableSetViewActions.forEach((action) => {
      openmct.actions.register(action);
    });

    openmct.types.addType(CHANNEL_TABLE_SET_KEY, {
      name: CHANNEL_TABLE_SET_NAME,
      creatable: true,
      description:
        'Combine multiple Channel Tables into a single tabular view. Each group has a header with its name. Can be added to Display Layouts.',
      cssClass: CHANNEL_TABLE_SET_ICON,
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          columnWidths: {},
          hiddenColumns: {}
        };
      }
    });

    openmct.composition.addPolicy(channelTableSetCompositionPolicy(openmct));
  };
}
