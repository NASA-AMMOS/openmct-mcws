import SessionControlViewProvider from './SessionControlViewProvider.js';

export default function SessionControlPlugin() {
  return function install(openmct) {
    openmct.objectViews.addProvider(new SessionControlViewProvider(openmct));

    openmct.types.addType('vista.sessionControl', {
      name: 'Session Control',
      description:
        'Start and stop uplink and downlink sessions, and choose the uplink ' +
        'session that command plugins target.',
      cssClass: 'icon-session',
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];

        return domainObject;
      }
    });
  };
}
