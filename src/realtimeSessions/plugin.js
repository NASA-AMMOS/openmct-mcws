import mount from 'ommUtils/mountVueComponent';
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
    
    const {
      componentInstance,
      destroy,
      el
    } = mount(componentDefinition);
    
    const indicator = {
      key: 'realtime-session-indicator',
      element: el,
      priority: -4,
      destroy
    };

    openmct.indicators.add(indicator);
  };
}

