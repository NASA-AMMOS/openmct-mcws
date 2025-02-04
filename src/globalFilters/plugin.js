import mount from 'ommUtils/mountVueComponent';
import GlobalFilterIndicator from './GlobalFilterIndicator.vue';

export default function plugin(config) {
  return function install(openmct) {
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

    const { componentInstance, destroy, el } = mount(componentDefinition);

    const indicator = {
      key: 'global-filter-indicator',
      priority: openmct.priority.DEFAULT,
      element: el,
      destroy
    };

    openmct.indicators.add(indicator);
  };
}
