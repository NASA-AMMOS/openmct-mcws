import Vue from 'vue';
import RealtimeIndicator from './RealtimeIndicator.vue';

export default function plugin(vistaTime) {
    return function install(openmct) {
        let indicator = {
            element: document.createElement('div'),
            priority: -5
        };

        openmct.indicators.add(indicator);
        openmct.on('start', () => {
            let component  = new Vue ({
                el: indicator.element,
                provide: {
                    openmct,
                    vistaTime
                },
                components: {
                    RealtimeIndicator
                },
                template: '<RealtimeIndicator />'
            });
        });
    };
}

