import Vue from 'vue';
import FrameWatchTableConfiguration from './FrameWatchTableConfiguration';
import TableConfigurationComponent from 'openmct.tables.components.TableConfiguration';

export default class FrameWatchConfigurationViewProvider {
    constructor(key, name, type) {
        this.key = key;
        this.name = name;
        this.type = type;
    }

    canView(selection) {
        if (selection.length === 0) {
            return false;
        }
        let object = selection[0][0].context.item;
        return object && object.type === this.type;
    }

    view(selection) {
        let component;
        let domainObject = selection[0][0].context.item;
        const tableConfiguration = new FrameWatchTableConfiguration(domainObject, openmct, this.type);

        return {
            show: function (element) {
                component = new Vue({
                    provide: {
                        openmct,
                        tableConfiguration
                    },
                    components: {
                        TableConfiguration: TableConfigurationComponent
                    },
                    template: '<table-configuration></table-configuration>',
                    el: element
                });
            },
            destroy: function () {
                component.$destroy();
                component = undefined;
            }
        }
    }

    priority() {
        return 1;
    }
}
