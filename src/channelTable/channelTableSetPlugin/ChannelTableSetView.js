import ChannelTableSet from './ChannelTableSet.vue';
import { createApp } from 'vue';

export default class ChannelTableSetView {
    constructor(openmct, domainObject, objectPath) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.objectPath = objectPath;
        this.component = undefined;
        this.destroy = null;
    }

    show(element) {
        this.component = createApp({
            components: {
                ChannelTableSet
            },
            provide: {
                openmct: this.openmct,
                objectPath: this.objectPath,
                currentView: this
            },
            data: () => {
                return {
                    domainObject: this.domainObject
                };
            },
            template: '<channel-table-set ref="channelTableSet" :domain-object="domainObject"></channel-table-set>'
        });
    }

    getViewContext() {
        if (!this.component) {
            return {};
        }

        return this.component.$refs.channelTableSet.getViewContext();
    }

    destroy() {
        this.destroy?.();
    }
}
