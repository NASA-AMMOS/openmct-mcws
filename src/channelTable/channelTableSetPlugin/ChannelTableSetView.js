import ChannelTableSet from './ChannelTableSet.vue';
import mount from 'ommUtils/mountVueComponent';

export default class ChannelTableSetView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;
        this._destroy = null;
    }

    show(element, isEditing, { renderWhenVisible }) {
        const componentDefinition = {
            components: {
                ChannelTableSet
            },
            provide: {
                openmct: this.openmct,
                objectPath: this.objectPath,
                currentView: this,
                renderWhenVisible
            },
            data: () => {
                return {
                    domainObject: this.domainObject
                };
            },
            template: '<channel-table-set ref="channelTableSet" :domain-object="domainObject"></channel-table-set>'
        };
        const componentOptions = {
            element
        };
        
        const {
            componentInstance,
            destroy,
            el
        } = mount(componentDefinition, componentOptions);
        
        this.component = componentInstance;
        this._destroy = destroy;
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.channelTableSet.getViewContext();
    }

    destroy() {
        this._destroy?.();
    }
}
