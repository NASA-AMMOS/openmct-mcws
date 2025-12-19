import mount from 'ommUtils/mountVueComponent.js';
import HistoricalSessionIndicator from './indicator/historicalSessionIndicator.vue';
import SessionTable from './sessionTable/SessionTable.js';
import HistoricalSessionMetadata from './HistoricalSessionMetadata.js';

export default function HistoricalSessionsPlugin(options) {
  return function install(openmct) {
    const renderWhenVisible = (func) => {
      window.requestAnimationFrame(func);
      return true;
    };

    const domainObject = {
      identifier: {
        key: 'session-historical',
        namespace: ''
      },
      name: 'Historical Session',
      type: 'vista.historical-session'
    };

    const table = new SessionTable(domainObject, openmct, options, HistoricalSessionMetadata);
    const objectPath = [domainObject];

    const componentDefinition = {
      provide: {
        openmct,
        table,
        objectPath,
        currentView: {},
        renderWhenVisible
      },
      components: {
        HistoricalSessionIndicator
      },
      template: '<HistoricalSessionIndicator></HistoricalSessionIndicator>'
    };

    const { destroy, el } = mount(componentDefinition);

    const indicator = {
      key: 'historical-session-indicator',
      element: el,
      priority: -1,
      destroy
    };

    openmct.indicators.add(indicator);
  };
}
