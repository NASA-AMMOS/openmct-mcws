import mount from 'ommUtils/mountVueComponent';
import PacketQueryView from './components/PacketQueryView.vue';

export default class PacketQueryViewProvider {
  constructor(openmct) {
    this.openmct = openmct;

    this.key = 'vista.packetQuery';
    this.name = 'Packet Query';
  }

  canView(domainObject) {
    return domainObject.type === 'vista.packets';
  }

  view(domainObject, objectPath) {
    let _destroy = null;
    const self = this;

    const view = {
      show: function (element) {
        const componentDefinition = {
          components: {
            PacketQueryView
          },
          data() {
            return {
              domainObject,
              view
            };
          },
          provide: {
            openmct: self.openmct,
            objectPath,
            currentView: view
          },
          template: `<packet-query-view
                            ref="packetSummaryView"
                            :domain-object="domainObject"
                            :view="view"
                        />`
        };

        const componentOptions = {
          element
        };

        const { destroy } = mount(componentDefinition, componentOptions);

        _destroy = destroy;
      },
      destroy: function () {
        _destroy?.();
      }
    };

    return view;
  }

  priority() {
    return this.openmct.priority.LOW;
  }
}
