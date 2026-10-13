import mount from 'ommUtils/mountVueComponent.js';
import SessionControlIndicator from './components/SessionControlIndicator.vue';
import getMissionControlService from '../missionControl/missionControlService.js';
import { normalizeFields } from '../missionControl/sessionFields.js';

/**
 * @param {object} [options] the `missionControl` config slice:
 *   `apiBase`, `uplinkSessionFields`, `downlinkSessionFields`
 */
export default function SessionControlPlugin(options = {}) {
  return function install(openmct) {
    const componentDefinition = {
      provide: {
        openmct,
        missionControlService: getMissionControlService(openmct, options.apiBase),
        sessionFields: {
          uplink: normalizeFields(options.uplinkSessionFields),
          downlink: normalizeFields(options.downlinkSessionFields)
        }
      },
      components: {
        SessionControlIndicator
      },
      template: '<SessionControlIndicator />'
    };

    const { destroy, el } = mount(componentDefinition);

    openmct.indicators.add({
      key: 'mission-control-indicator',
      element: el,
      priority: -6,
      destroy
    });
  };
}
