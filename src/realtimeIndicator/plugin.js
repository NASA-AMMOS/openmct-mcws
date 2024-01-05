import mount from 'utils/mountVueComponent';
import RealtimeIndicator from './RealtimeIndicator.vue';

export default function plugin(vistaTime) {
  return function install(openmct) {
    const indicator = {
        element: document.createElement('div'),
        priority: -5
    };
    const componentDefinition = {
      provide: {
        openmct,
        vistaTime
      },
      components: {
          RealtimeIndicator
      },
      template: '<RealtimeIndicator />'
    };
    const componentOptions = {
      element: indicator.element
    };

    openmct.on('start', () => mount(componentDefinition, componentOptions));
    openmct.indicators.add(indicator);
  };
}
