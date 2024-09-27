import mount from 'ommUtils/mountVueComponent';
import ClearDataIndicator from './ClearDataIndicator.vue';

export default function plugin(globalStalenessMs) {
    return function install(openmct) {
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

        const {
          componentInstance,
          destroy,
          el
        } = mount(componentDefinition);

        const indicator = {
            key: 'clear-data-indicator',
            element: el,
            destroy
        };

        openmct.indicators.add(indicator);
    };
}
