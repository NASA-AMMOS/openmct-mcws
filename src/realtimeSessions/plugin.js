import mount from 'utils/mountVueComponent';
import RealtimeSessionIndicator from './components/RealtimeSessionIndicator.vue';

export default function plugin() {
  return function install(openmct) {
    const indicator = {
        element: document.createElement('div'),
        priority: -4
    };
    const componentDefinition = {
      provide: {
        openmct
      },
      components: {
          RealtimeSessionIndicator
      },
      template: '<RealtimeSessionIndicator />'
    };

    const componentOptions = {
        element: indicator.element
    };

    openmct.indicators.add(indicator);
    openmct.on('start', () => mount(componentDefinition, componentOptions));
  };
}

