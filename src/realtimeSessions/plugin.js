import mount from 'ommUtils/mountVueComponent.js';
import RealtimeSessionIndicator from './components/RealtimeSessionIndicator.vue';

export default function plugin() {
  return function install(openmct) {
    const componentDefinition = {
      provide: {
        openmct
      },
      components: {
        RealtimeSessionIndicator
      },
      template: '<RealtimeSessionIndicator />'
    };

    const { destroy, el } = mount(componentDefinition);

    const indicator = {
      key: 'realtime-session-indicator',
      element: el,
      priority: -4,
      destroy
    };

    openmct.indicators.add(indicator);
  };
}
