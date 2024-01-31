import Vue from 'vue';
import HistoricalSessionIndicator from './indicator/historicalSessionIndicator.vue';
import SessionTable from './sessionTable/SessionTable';
import HistoricalSessionMetadata from './HistoricalSessionMetadata';

export default function HistoricalSessionsPlugin() {
    return function install(openmct) {
        let indicator = {
                element: document.createElement('div'),
                priority: -1
            };

        openmct.indicators.add(indicator);

        openmct.on('start', () => {
            const domainObject = {
                identifier: {
                    key: 'session-historical',
                    namespace: ''
                },
                name: 'Historical Session',
                type: 'vista.channel'
            };
            
            const table = new SessionTable(domainObject, openmct, HistoricalSessionMetadata),
                objectPath = [domainObject];

            const component = new Vue ({
                el: indicator.element,
                provide: {
                    openmct,
                    table,
                    objectPath,
                    currentView: {}
                },
                components: {
                    HistoricalSessionIndicator
                },
                template: '<HistoricalSessionIndicator></HistoricalSessionIndicator>'
            });
        });
    };
}
