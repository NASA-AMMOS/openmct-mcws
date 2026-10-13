import CommandDetail from './components/CommandDetail.vue';
import mount from 'ommUtils/mountVueComponent.js';

export default class CommandDetailViewProvider {
  constructor(openmct) {
    this.key = 'vista.commandDetailView';
    this.name = 'Command Detail';
    this.cssClass = 'icon-object';
    this.openmct = openmct;
  }

  canView(domainObject) {
    return domainObject.type === 'vista.command';
  }

  view(domainObject) {
    const self = this;
    let _destroy = null;

    return {
      show(element) {
        const { destroy } = mount(
          {
            components: {
              CommandDetail
            },
            provide: {
              openmct: self.openmct,
              domainObject
            },
            template: '<CommandDetail />'
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
