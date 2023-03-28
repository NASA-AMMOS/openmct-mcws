import EVRTable from './EVRTable';
import TableComponent from 'openmct.tables.components.Table';
import Vue from 'vue';

const RESTRICTED_VIEWS = ['plot-single', 'table'];
const EVR_SOURCES = [
    'evrHistoricalUrl',
    'evrStreamUrl',
    'evrLADUrl',
];

function providesEVRData(domainObject) {
    return EVR_SOURCES.some(evrSource => Boolean(
        domainObject.telemetry?.[evrSource]
    ));
}
export default class EVRViewProvider {
    constructor(openmct) {
        this.key = 'vista.evrView';
        this.name = 'EVR View';
        this.cssClass = 'icon-tabular-realtime';
        this.openmct = openmct;

        this.view = this.view.bind(this);
    }

    canView(domainObject) {
        // suppress plot and table views for evr providing telemetry
        const wrappedGet = this.openmct.objectViews.get;
        this.openmct.objectViews.get = function (object) {
            return wrappedGet.apply(this, arguments)
                .filter(viewProvider => !(providesEVRData(object) && RESTRICTED_VIEWS.includes(viewProvider.key)));
        };

        return providesEVRData(domainObject) || domainObject.type === 'vista.evrView';
    }

    view(domainObject, objectPath) {
        let component;
        const table = new EVRTable(domainObject, this.openmct);
        const markingProp = {
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
                    provide: {
                        openmct,
                        table,
                        objectPath,
                        currentView: view
                    },
                    data() {
                        return {
                            isEditing: editMode,
                            markingProp,
                            view
                        };
                    },
                    template: `
                        <table-component
                            ref="tableComponent"
                            :is-editing="isEditing"
                            :allow-sorting="true"
                            :marking="markingProp"
                            :view="view"
                        ></table-component>
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

    canEdit(domainObject) {
        return domainObject.type === 'vista.evrView';
    }
}
