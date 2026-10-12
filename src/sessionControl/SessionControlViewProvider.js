import SessionControl from './components/SessionControl.vue';
import mount from 'ommUtils/mountVueComponent.js';
import getMissionControlService from '../missionControl/missionControlService.js';
import { normalizeFields } from '../missionControl/sessionFields.js';

export default class SessionControlViewProvider {
  constructor(openmct, options = {}) {
    this.options = options || {};
    this.key = 'vista.sessionControlView';
    this.name = 'Session Control';
    this.cssClass = 'icon-session';
    this.openmct = openmct;
  }

  canView(domainObject) {
    return domainObject.type === 'vista.sessionControl';
  }

  view() {
    const self = this;
    let _destroy = null;

    return {
      show(element) {
        const { destroy } = mount(
          {
            components: {
              SessionControl
            },
            provide: {
              openmct: self.openmct,
              missionControlService: getMissionControlService(self.openmct, self.options.apiBase),
              sessionFields: {
                uplink: normalizeFields(self.options.uplinkSessionFields),
                downlink: normalizeFields(self.options.downlinkSessionFields)
              }
            },
            template: '<SessionControl />'
          },
          { element }
        );

        _destroy = destroy;
      },
      destroy() {
        if (_destroy) {
          _destroy();
        }
      }
    };
  }
}
