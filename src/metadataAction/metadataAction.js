import MetadataListView from './components/metadataList.vue';
import mount from 'ommUtils/mountVueComponent';

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

    const componentOptions = {
      element
    };

    const { componentInstance, destroy, el } = mount(componentDefinition, componentOptions);

    this.openmct.overlays.overlay({
      element: el,
      size: 'large',
      dismissable: true,
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
