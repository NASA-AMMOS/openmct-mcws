import { CHANNEL_TABLE_KEY, CHANNEL_TABLE_NAME, CHANNEL_TABLE_ICON, CHANNEL_KEY } from '../constants';
import ChannelTableViewProvider from './ChannelTableViewProvider';
import ChannelTableFormatViewProvider from './ChannelTableFormatViewProvider';
import VistaTableConfigurationProvider from '../../tables/VistaTableConfigurationProvider';

export default function install() {
    return function ChannelTablePlugin(openmct) {
        openmct.types.addType(CHANNEL_TABLE_KEY, {
            name: CHANNEL_TABLE_NAME,
            description: 'Group multiple telemetry elements together into a tabular view which shows the latest value of each contained telemetry element.  Channel Tables can be added to Channel Table Sets or Display Layouts.',
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
        
        openmct.objectViews.addProvider(new ChannelTableViewProvider(openmct));

        openmct.inspectorViews.addProvider(
            new VistaTableConfigurationProvider(
                'vista.channel-list-configuration',
                'Config',
                CHANNEL_TABLE_KEY
            )
        );
        openmct.inspectorViews.addProvider(new ChannelTableFormatViewProvider(openmct));

        openmct.composition.addPolicy((parent, child) => {
            if (parent.type === CHANNEL_TABLE_KEY) {
                return child.type === CHANNEL_KEY;
            }

            return true;
        });
    };
};
