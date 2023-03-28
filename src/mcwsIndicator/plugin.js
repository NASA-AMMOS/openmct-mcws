import MCWSIndicator from './MCWSIndicator.vue';
import Vue from 'vue';

export default function MCWSIndicatorPlugin() {
    return function install(openmct) {
        const mcwsIndicator = new Vue ({
            components: {
                MCWSIndicator
            },
            provide: {
                openmct: openmct
            },
            template: '<MCWSIndicator />'
        });

        openmct.indicators.add({
            key: 'mcws-indicator',
            element: mcwsIndicator.$mount().$el,
            priority: -3
        });
    };
}
