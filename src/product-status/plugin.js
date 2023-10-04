import Vue from 'vue';
import DataProductViewProvider from './DataProductViewProvider.js';
import DATDownloadCell from './DATDownloadCell.js';
import EMDDownloadCell from './EMDDownloadCell.js';
import EMDPreviewCell from './EMDPreviewCell.js';
import TXTDownloadCell from './TXTDownloadCell.js';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider.js';
import DataProductAutoclear from './data-product-autoclear.vue';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import DataProductViewActions from './DataProductViewActions.js';

export default function install() {
    return function ProductStatusPlugin(openmct) {
        openmct.types.addType('vista.dataProductsView', {
            name: "Data Product View",
            description: "Shows data product status information",
            cssClass: "icon-tabular-lad",
            creatable: true,
            initialize(domainObject) {
                domainObject.composition = [];
            }
        });
        openmct.objectViews.addProvider(new DataProductViewProvider(openmct));
        
        openmct.inspectorViews.addProvider({
            key: 'vista.dataProducts-configuration',
            name: 'Autoclear',
            canView: function (selection) {
                if (selection.length === 0) {
                    return false;
                }
                let object = selection[0][0].context.item;
                return object && object.type === 'vista.dataProductsView';
            },
            view: function (selection) {
                let component;
                let domainObject = selection[0][0].context.item;
                const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);
                return {
                    show: function (element) {
                        component = new Vue({
                            provide: {
                                openmct,
                                tableConfiguration
                            },
                            components: {
                                DataProductAutoclear
                            },
                            template: '<data-product-autoclear></data-product-autoclear>',
                            el: element
                        });
                    },
                    priority: function () {
                        return openmct.priority.HIGH;
                    },
                    destroy: function () {
                        component.$destroy();
                        component = undefined;
                    }
                }
            }
        });

        openmct.inspectorViews.addProvider(new VistaTableConfigurationProvider(
            'vista.data-products-configuration', 
            'Config',
            'vista.dataProductsView'
        ));

        // Suppress new views via monkey-patching (for now)
        let wrappedGet = openmct.objectViews.get;
        openmct.objectViews.get = function (domainObject) {
            const restrictedViews = ['plot-single', 'table'];

            return wrappedGet.apply(this, arguments).filter(
                viewProvider => !(domainObject.type === 'vista.dataProducts' && restrictedViews.includes(viewProvider.key))
            );
        };
        
        DataProductViewActions.forEach(action => {
            openmct.actions.register(action);
        });

        Vue.component('vista-table-dat-cell', DATDownloadCell);
        Vue.component('vista-table-emd-cell', EMDDownloadCell);
        Vue.component('vista-table-emd-preview-cell', EMDPreviewCell);
        Vue.component('vista-table-txt-cell', TXTDownloadCell);
    }
}
