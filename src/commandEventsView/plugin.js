import CommandEventsViewProvider from './CommandEventsViewProvider.js';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider.js';

export default function CommandEventsViewPlugin() {
    return function install(openmct) {        
        openmct.types.addType('vista.commandEventsView', {
            name: 'Command Events View',
            description: 'Drag and drop a Command Events node into this view to show a filterable summary of command events',
            cssClass: 'icon-tabular-lad',
            creatable: true,
            initialize(domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {
                    filters: {}
                };
            }
        });

        openmct.objectViews.addProvider(new CommandEventsViewProvider(openmct));

        const wrappedGet = openmct.objectViews.get;
        openmct.objectViews.get = function (domainObject) {
            return wrappedGet.apply(this, arguments).filter(viewProvider => 
                domainObject.type !== 'vista.commandEvents'
                || (domainObject.type === 'vista.commandEvents' && viewProvider.key === 'table')
            )
        }

        openmct.inspectorViews.addProvider(
            new VistaTableConfigurationProvider(
                'vista.command-events-view-configuration',
                'Command Events View Configuration',
                'vista.commandEventsView'
            )
        );

        openmct.composition.addPolicy((parent, child) => {
            if (parent.type === 'vista.commandEventsView') {
                return child.type === 'vista.commandEvents'
            }
            return true;
        });
    };
}