define([
    'openmct.tables.TelemetryTableConfiguration',
    'openmct.tables.components.TableConfiguration',
    'vue'
],function(TelemetryTableConfiguration, TableConfigurationComponent, Vue) {
    function VistaTableConfigurationProvider(key, name, type){
        this.key = key;
        this.name = name;
        this.type = type;
    }

    VistaTableConfigurationProvider.prototype.canView = function (selection){
        if (selection.length === 0) {
            return false;
        }
        let object = selection[0][0].context.item;
        return object && object.type === this.type;
    };

    VistaTableConfigurationProvider.prototype.view = function (selection) {
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
                        TableConfiguration: TableConfigurationComponent.default
                    },
                    template: '<table-configuration></table-configuration>',
                    el: element
                });
            },
            showTab: function (isEditing) {
              return isEditing;
            },
            priority: function () {
              return openmct.priority.HIGH + 1;
            },
            destroy: function () {
                component.$destroy();
                component = undefined;
            }
        }
    };

    return VistaTableConfigurationProvider;
});