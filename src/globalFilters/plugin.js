import mount from 'utils/mountVueComponent';
import GlobalFilterIndicator from './GlobalFilterIndicator.vue';

export default function plugin(config) {
  return function install(openmct) {
    const indicator = {
      element: document.createElement('div'),
      priority: openmct.priority.DEFAULT
    };

    openmct.indicators.add(indicator);
    openmct.on('start', () => {
      const componentDefinition = {
        provide: {
          openmct,
          filters: config
        },
        components: {
          GlobalFilterIndicator
        },
        template: '<GlobalFilterIndicator />'
      };
      
      const componentOptions = {
          element: indicator.element
      };
      
      const {
          componentInstance,
          destroy,
          el
      } = mount(componentDefinition, componentOptions);
    });
  };
}
