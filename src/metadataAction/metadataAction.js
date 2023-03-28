import MetadataListView from './components/metadataList.vue';
import Vue from 'vue';

export default class MetadataAction {
    constructor(openmct) {
        this.name = 'View Attributes';
        this.key = 'metadata-action';
        this.description = 'Shows dictionary attributes related to this object';
        this.cssClass = 'icon-info';

        this._openmct = openmct;
    }
    invoke(objectPath) {
        let domainObject = objectPath[0],
            name = domainObject.name,
            attributes = domainObject.telemetry.definition,
            component = new Vue ({
                provide: {
                    name,
                    attributes
                },
                components: {
                    MetadataListView
                },
                template: '<MetadataListView/>'
            }),
            overlay = this._openmct.overlays.overlay({
                element: component.$mount().$el,
                size: 'large',
                dismissable: true,
                onDestroy: () => {
                    component.$destroy();
                }
            });
    }
    appliesTo(objectPath) {
        let contextualDomainObject = objectPath[0];

        return contextualDomainObject.type === 'vista.evr' || contextualDomainObject.type === 'vista.channel';
    }
}
