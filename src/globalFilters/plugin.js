import Vue from 'vue';
import GlobalFilterIndicator from './GlobalFilterIndicator.vue';

export default function plugin(config) {
  return function install(openmct) {
    const indicator = {
      element: document.createElement('div'),
      priority: openmct.priority.DEFAULT
    };

    openmct.indicators.add(indicator);
    openmct.on('start', () => {
      let component = new Vue({
        el: indicator.element,
        provide: {
          openmct,
          filters: config
        },
        components: {
          GlobalFilterIndicator
        },
        template: '<GlobalFilterIndicator />'
      });
    });
  };
}
