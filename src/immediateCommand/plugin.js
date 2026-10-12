import ImmediateCommandViewProvider from './ImmediateCommandViewProvider.js';

export default function ImmediateCommandPlugin() {
  return function install(openmct) {
    openmct.objectViews.addProvider(new ImmediateCommandViewProvider(openmct));

    openmct.types.addType('vista.immediateCommand', {
      name: 'Immediate Command',
      description:
        'Browse a dataset command dictionary and send immediate flight ' +
        'software, hardware, or simulator commands.',
      cssClass: 'icon-object',
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          datasetKey: null
        };

        return domainObject;
      }
    });
  };
}
