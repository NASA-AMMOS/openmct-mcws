import Vue from 'vue';
import PacketSummaryTable from './PacketSummaryTable.js';
import PacketSummaryViewComponent from './components/PacketSummaryViewComponent.vue';

export default class ProductSummaryViewProvider {
    constructor(openmct) {
        this.openmct = openmct;

        this.key = 'vista.packetSummaryViewProvider';
        this.name = 'Packet Summary View';
        this.cssClass = 'icon-tabular-realtime';
    }

    canView(domainObject) {
        return domainObject.type === 'vista.packetSummaryEvents' || domainObject.type === 'vista.packetSummaryView';
    }

    view(domainObject, objectPath) {
        let table = new PacketSummaryTable(domainObject, openmct);
        let component;

        const view = {
            show: function (element, editMode) {
                component = new Vue({
                    el: element,
                    components: {
                        PacketSummaryViewComponent
                    },
                    data() {
                        return {
                            isEditing: editMode,
                            view
                        };
                    },
                    provide: {
                        openmct,
                        table,
                        objectPath,
                        currentView: view
                    },
                    template:
                        `<packet-summary-view-component
                            ref="packetSummaryViewComponent"
                            :view="view"
                            :isEditing="isEditing"
                        />`
                });
            },
            onEditModeChange(editMode) {
                component.isEditing = editMode;
            },
            onClearData() {
                table.clearData();
            },
            getViewContext() {
                if (component) {
                    let context = component.$refs.packetSummaryViewComponent.getViewContext();

                    return context;
                } else {
                    return {
                        type: 'telemetry-table'
                    };
                }
            },
            destroy: function (element) {
                component.$destroy();
                component = undefined;
            }
        };

        return view;
    }
     
    canEdit(domainObject) {
        return domainObject.type === 'vista.packetSummaryView';
    }
}
