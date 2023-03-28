import Vue from 'vue';
import ClearDataIndicator from './indicator/clearDataIndicator.vue';

export default function plugin(globalStalenessMs) {
    return function install(openmct) {
        let indicator = {
            element: document.createElement('div')
        };

        openmct.indicators.add(indicator);
        openmct.on('start', () => {
            let component  = new Vue ({
                el: indicator.element,
                provide: {
                    openmct,
                    globalStalenessMs
                },
                components: {
                    ClearDataIndicator
                },
                template: '<ClearDataIndicator />'
            });
        });
    };
}
