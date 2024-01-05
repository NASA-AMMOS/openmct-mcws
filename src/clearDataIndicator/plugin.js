import mount from 'utils/mountVueComponent';
import ClearDataIndicator from './indicator/clearDataIndicator.vue';

export default function plugin(globalStalenessMs) {
    return function install(openmct) {
        openmct.indicators.add(indicator);
        openmct.on('start', () => {
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
        });
    };
}
