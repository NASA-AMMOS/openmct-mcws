import TableComponent from 'openmct.tables.components.Table';
import DataProductTable from './DataProductTable.js';
import DATDownloadCell from './DATDownloadCell.js';
import EMDDownloadCell from './EMDDownloadCell.js';
import EMDPreviewCell from './EMDPreviewCell.js';
import TXTDownloadCell from './TXTDownloadCell.js';

import { createApp, defineComponent } from 'vue';
export default class DataProductViewProvider {
    constructor(openmct, options) {
        this.openmct = openmct;
        this.options = options;

        this.key = 'vista.productStatus';
        this.name = 'Data Product View';
        this.cssClass = 'icon-tabular-realtime';
    }

    canView(domainObject) {
        return domainObject.type === 'vista.dataProducts' || domainObject.type === 'vista.dataProductsView';
    }

    view(domainObject, objectPath) {
        let component;
        let _destroy = null;

        const openmct = this.openmct;
        const table = new DataProductTable(domainObject, openmct, this.options);
        const markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };

        const view = {
            show(element, editMode, { renderWhenVisible }) {
                const componentDefinition = {
                    components: {
                        TableComponent
                    },
                    data() {
                        return {
                            isEditing: editMode,
                            markingProp
                        };
                    },
                    provide: {
                        openmct,
                        table,
                        objectPath,
                        currentView: view,
                        renderWhenVisible
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
                            :allowSorting="true"
                            :isEditing="isEditing"
                            :marking="markingProp"
                        ></table-component>`
                };

                const mountingElement = element ?? document.createElement('div');

                const vueComponent = defineComponent(componentDefinition);
                const app = createApp(vueComponent);

                app.component('vista-table-dat-cell', DATDownloadCell);
                app.component('vista-table-emd-cell', EMDDownloadCell);
                app.component('vista-table-emd-preview-cell', EMDPreviewCell);
                app.component('vista-table-txt-cell', TXTDownloadCell);

                const componentInstance = app.mount(mountingElement);

                component = componentInstance;
                _destroy = () => app.unmount();
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
            destroy: function () {
                _destroy?.();
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
