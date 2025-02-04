import mount from 'ommUtils/mountVueComponent';
import RealtimeIndicator from './RealtimeIndicator.vue';

export default function plugin(vistaTime) {
  return function install(openmct) {
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

    const { componentInstance, destroy, el } = mount(componentDefinition);

    const indicator = {
      key: 'realtime-update-indicator',
      element: el,
      priority: -5,
      destroy
    };

    openmct.indicators.add(indicator);
  };
}
