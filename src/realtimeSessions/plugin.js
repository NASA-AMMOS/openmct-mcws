import Vue from 'vue';
import RealtimeSessionIndicator from './components/RealtimeSessionIndicator.vue';

export default function plugin(vistaTime) {
    return function install(openmct) {
        let indicator = {
            element: document.createElement('div'),
            priority: -4
        };

        openmct.indicators.add(indicator);
        openmct.on('start', () => {
            let component  = new Vue ({
                el: indicator.element,
                provide: {
                    openmct
                },
                components: {
                    RealtimeSessionIndicator
                },
                template: '<RealtimeSessionIndicator />'
            });
        });
    };
}

