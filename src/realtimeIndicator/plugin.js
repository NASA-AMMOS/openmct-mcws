import mount from 'ommUtils/mountVueComponent.js';
import RealtimeIndicator from './RealtimeIndicator.vue';

export default function plugin(vistaTime, format) {
  return function install(openmct) {
    const componentDefinition = {
      provide: {
        openmct,
        vistaTime,
        format
      },
      components: {
        RealtimeIndicator
      },
      template: '<RealtimeIndicator />'
    };

    const { destroy, el } = mount(componentDefinition);

    const indicator = {
      key: 'realtime-update-indicator',
      element: el,
      priority: -5,
      destroy
    };

    openmct.indicators.add(indicator);
  };
}
