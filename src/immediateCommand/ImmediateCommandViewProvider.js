import ImmediateCommand from './components/ImmediateCommand.vue';
import mount from 'ommUtils/mountVueComponent.js';
import getMissionControlService from '../missionControl/missionControlService.js';

export default class ImmediateCommandViewProvider {
  constructor(openmct, options = {}) {
    this.options = options || {};
    this.key = 'vista.immediateCommandView';
    this.name = 'Immediate Command';
    this.cssClass = 'icon-command';
    this.openmct = openmct;
  }

  canView(domainObject) {
    return domainObject.type === 'vista.immediateCommand';
  }

  view(domainObject) {
    const self = this;
    let _destroy = null;

    return {
      show(element) {
        const { destroy } = mount(
          {
            components: {
              ImmediateCommand
            },
            provide: {
              openmct: self.openmct,
              missionControlService: getMissionControlService(self.openmct, self.options.apiBase),
              domainObject
            },
            template: '<ImmediateCommand />'
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
