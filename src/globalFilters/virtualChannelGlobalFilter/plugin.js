import Vue from 'vue';
import VirtualChannelGlobalFilterIndicator from './VirtualChannelGlobalFilterIndicator.vue';

export default function plugin(config) {
  const virtualChannelGroups = config;

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
          openmct
        },
        components: {
          VirtualChannelGlobalFilterIndicator
        },
        template: '<VirtualChannelGlobalFilterIndicator :virtual-channel-groups="virtualChannelGroups" />'
      });
    });
  };
}
