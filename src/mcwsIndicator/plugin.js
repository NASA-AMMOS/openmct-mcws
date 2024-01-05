import MCWSIndicator from './MCWSIndicator.vue';
import mount from 'utils/mountVueComponent';

export default function MCWSIndicatorPlugin() {
  return function install(openmct) {
    const indicator = {
      key: 'mcws-indicator',
      element: document.createElement('div'),
      priority: -3
    };

    const componentDefinition = {
      components: {
        MCWSIndicator
      },
      provide: {
        openmct
      },
      template: '<MCWSIndicator />'
    };

    const componentOptions = {
      element: indicator.element
    };

    const {
        componentInstance,
        destroy,
        el
    } = mount(componentDefinition, componentOptions);

    openmct.indicators.add(indicator);
  };
}
