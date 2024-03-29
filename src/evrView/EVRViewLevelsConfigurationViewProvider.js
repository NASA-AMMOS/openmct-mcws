import EVRViewLevelsConfigurationView from './EVRViewLevelsConfigurationView.vue'
import Vue from 'vue';

export default function EVRViewLevelsConfigurationViewProvider(options) {
    return {
        key: 'vista.evrView-configuration',
        name: 'Level Color',
        canView: function (selection) {
            if (selection.length === 0) {
                return false;
            }

            let object = selection[0][0].context.item;

            return object && object.type === 'vista.evrView';
        },
        view: function (selection) {
            let component;
            let domainObject = selection[0][0].context.item;

            return {
                show: function (element) {
                    component = new Vue({
                        el: element,
                        provide: {
                            openmct
                        },
                        data() {
                            return {
                                domainObject: domainObject,
                                options: options
                            };
                        },
                        components: {
                            EvrLevelsConfiguration: EVRViewLevelsConfigurationView
                        },
                        template: `
                            <evr-levels-configuration
                                :domain-object="domainObject"
                                :options="options"
                            ></evr-levels-configuration>
                        `,
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
    };
}
