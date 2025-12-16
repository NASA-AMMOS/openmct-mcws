import MetadataListView from './components/metadataList.vue';
import mount from 'ommUtils/mountVueComponent.js';

export default class MetadataAction {
  constructor(openmct) {
    this.name = 'View Attributes';
    this.key = 'metadata-action';
    this.description = 'Shows dictionary attributes related to this object';
    this.cssClass = 'icon-info';

    this.openmct = openmct;
  }

  invoke(objectPath) {
    const domainObject = objectPath[0];
    const name = domainObject.name;
    const attributes = domainObject.telemetry.definition;

    const componentDefinition = {
      provide: {
        name,
        attributes
      },
      components: {
        MetadataListView
      },
      template: '<MetadataListView />'
    };

    const { destroy, el } = mount(componentDefinition);

    this.openmct.overlays.overlay({
      element: el,
      size: 'large',
      dismissible: true,
      onDestroy: () => {
        destroy();
      }
    });
  }

  appliesTo(objectPath) {
    let contextualDomainObject = objectPath[0];

    return (
      contextualDomainObject.type === 'vista.evr' || contextualDomainObject.type === 'vista.channel'
    );
  }
}
