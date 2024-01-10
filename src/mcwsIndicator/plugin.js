import MCWSIndicator from './MCWSIndicator.vue';
import mount from 'utils/mountVueComponent';

export default function MCWSIndicatorPlugin() {
  return function install(openmct) {
    const componentDefinition = {
      components: {
        MCWSIndicator
      },
      provide: {
        openmct
      },
      template: '<MCWSIndicator />'
    };

    const {
        componentInstance,
        destroy,
        el
    } = mount(componentDefinition);

    const indicator = {
      key: 'mcws-indicator',
      priority: -3,
      element: el,
      destroy
    };

    openmct.indicators.add(indicator);
  };
}
