define([
    './CellFormatConfigurationComponent',
    'openmct.tables.TelemetryTableConfiguration',
    'vue'
], function (
    CellFormatConfigurationComponent,
    TelemetryTableConfiguration,
    Vue
) {

    function ChannelTableFormatViewProvider(openmct) {
        return {
            key: 'channel-list-format',
            name: 'Channel List Format Configuration',
            canView: function (selection) {
                let selectionPath = selection[0];
                if (selectionPath && selectionPath.length > 1) {
                    let parentObject = selectionPath[1].context.item;
                    let selectedContext = selectionPath[0].context;
                    return parentObject && 
                        parentObject.type === 'vista.chanTableGroup' &&
                        selectedContext.type === 'table-cell';
                }
                return false;
            },
            view: function (selection) {
                let component;
                let domainObject = selection[0][1].context.item;
                const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);
                return {
                    show: function (element) {
                        component = new Vue({
                            provide: {
                                openmct,
                                tableConfiguration
                            },
                            components: {
                                CellFormatConfiguration: CellFormatConfigurationComponent
                            },
                            template: '<cell-format-configuration></cell-format-configuration>',
                            el: element
                        });
                    },
                    destroy: function () {
                        component.$destroy();
                        component = undefined;
                    }
                }
            },
            priority: function () {
                return 1;
            }
        }
    }
    return ChannelTableFormatViewProvider;
});
