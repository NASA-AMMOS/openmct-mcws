import Vue from 'vue';
import TableComponent from 'openmct.tables.components.Table';
import DataProductTable from './DataProductTable.js';

export default class DataProductViewProvider {
    constructor(openmct) {
        this.openmct = openmct;

        this.key = 'vista.productStatus';
        this.name = 'Data Product View';
        this.cssClass = 'icon-tabular-realtime';
    }

    canView(domainObject) {
        return domainObject.type === 'vista.dataProducts' || domainObject.type === 'vista.dataProductsView';
    }

    view(domainObject, objectPath) {
        let table = new DataProductTable(domainObject, openmct);
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
                    methods: {
                        clearCompleted() {
                            table.clearCompleted();
                        },
                        clearPartial() {
                            table.clearPartial();
                        }
                    },
                    template:
                        `<table-component
                            ref="tableComponent"
                            class="v-data-products"
                            :allowSorting="true"
                            :isEditing="isEditing"
                            :marking="markingProp"
                            :view="view"
                        ></table-component>`
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
                    let context = component.$refs.tableComponent.getViewContext();

                    context.dataProductView = true;
                    context.clearCompleted = () => {
                        table.clearCompleted();
                    };
                    context.clearPartial = () => {
                        table.clearPartial();
                    };
                
                    return context;
                } else {
                    return {
                        type: 'telemetry-table',
                        dataProductView: true
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
        return domainObject.type === 'vista.dataProductsView';
    }

    priority() {
        return Number.MAX_SAFE_INTEGER;
    }
}
