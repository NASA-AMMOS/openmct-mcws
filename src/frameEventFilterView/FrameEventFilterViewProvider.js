import FrameEventFilterTable from './FrameEventFilterTable.js';
import TableComponent from 'openmct.tables.components.Table';
import Vue from 'vue';

export default class FrameEventFilterViewProvider {
    constructor(openmct) {
        this.openmct = openmct;

        this.key = 'vista.frameEventFilterView';
        this.name = 'Frame Events Filtered View';
        this.cssClass = 'icon-tabular-realtime';
    }

    canView(domainObject) {
        return domainObject.type === 'vista.frame-event-filter';
    }

    view(domainObject, objectPath) {
        let table = new FrameEventFilterTable(domainObject, openmct);
        let component;
        let markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };
        const view = {
            show: function (element, editMode) {
                component = new Vue({
                    el: element,
                    components: {
                        TableComponent
                    },
                    data() {
                        return {
                            isEditing: editMode,
                            markingProp,
                            view
                        };
                    },
                    provide: {
                        openmct,
                        table,
                        objectPath,
                        currentView: view
                    },
                    template: `
                        <table-component
                            ref="tableComponent"
                            class="v-data-products"
                            :allowSorting="true"
                            :isEditing="isEditing"
                            :marking="markingProp"
                            :view="view"
                        >
                            <template slot="buttons">
                            </template>
                        </table-component>
                    `
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
                    return component.$refs.tableComponent.getViewContext();
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
}
