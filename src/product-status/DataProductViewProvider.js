import mount from 'ommUtils/mountVueComponent';
import TableComponent from 'openmct.tables.components.Table';
import DataProductTable from './DataProductTable.js';

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

                const componentOptions = {
                    element
                };

                const {
                    componentInstance,
                    destroy,
                    el
                } = mount(componentDefinition, componentOptions);
                
                component = componentInstance;
                _destroy = destroy;
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
