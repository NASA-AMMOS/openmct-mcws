import mount from 'utils/mountVueComponent';
import ClearDataIndicator from './indicator/clearDataIndicator.vue';

export default function plugin(globalStalenessMs) {
    return function install(openmct) {
        const indicator = {
            element: document.createElement('div')
        };
        const componentDefinition = {
            provide: {
                openmct,
                globalStalenessMs
            },
            components: {
                ClearDataIndicator
            },
            template: '<ClearDataIndicator />'
        };
        const componentOptions = {
            element: indicator.element
        };

        openmct.indicators.add(indicator);
        openmct.on(
            'start',
            () => mount(componentDefinition, componentOptions)
        );
    };
}
