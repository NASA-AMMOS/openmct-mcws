import MessagesViewProvider from './MessagesViewProvider.js';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider.js';

export default function MessagesViewPlugin(options) {
  return function install(openmct) {
    openmct.objectViews.addProvider(new MessagesViewProvider(openmct, options));
    openmct.types.addType('vista.messagesView', {
      name: 'Messages View',
      description:
        'Drag and drop a message node into this view to show a filterable table of messages',
      cssClass: 'icon-tabular-lad',
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          filters: {}
        };
      }
    });
    openmct.inspectorViews.addProvider(
      new VistaTableConfigurationProvider(
        'vista.messages-view-configuration',
        'Config',
        'vista.messagesView',
        options
      )
    );

    openmct.composition.addPolicy((parent, child) => {
      if (parent.type === 'vista.messagesView') {
        return child.type === 'vista.message';
      }
      return true;
    });
  };
}
