import SessionControlViewProvider from './SessionControlViewProvider.js';

/**
 * @param {object} [options] the `missionControl` config slice:
 *   `apiBase`, `uplinkSessionFields`, `downlinkSessionFields`
 */
export default function SessionControlPlugin(options = {}) {
  return function install(openmct) {
    openmct.objectViews.addProvider(new SessionControlViewProvider(openmct, options));

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
