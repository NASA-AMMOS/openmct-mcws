import Vue from 'vue';
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
        let component;

        const view = {
            show: function (element) {
                component = new Vue({
                    el: element,
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
                        openmct,
                        objectPath,
                        currentView: view
                    },
                    template:
                        `<packet-query-view
                            ref="packetSummaryView"
                            :domain-object="domainObject"
                            :view="view"
                        />`
                });
            },
            destroy: function (element) {
                component.$destroy();
                component = undefined;
            }
        };

        return view;
    }

    priority() {
        return this.openmct.priority.LOW;
    }
}
