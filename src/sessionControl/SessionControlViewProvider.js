import SessionControl from './components/SessionControl.vue';
import mount from 'ommUtils/mountVueComponent.js';
import getMissionControlService from '../missionControl/missionControlService.js';

export default class SessionControlViewProvider {
  constructor(openmct) {
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
              missionControlService: getMissionControlService(self.openmct)
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
