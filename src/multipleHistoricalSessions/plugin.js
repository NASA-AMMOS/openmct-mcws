import mount from 'utils/mountVueComponent';
import HistoricalSessionIndicator from './indicator/historicalSessionIndicator.vue';
import SessionTable from './sessionTable/SessionTable';
import HistoricalSessionMetadata from './HistoricalSessionMetadata';

export default function HistoricalSessionsPlugin() {
    return function install(openmct) {
        const domainObject = {
            identifier: {
                key: 'session-historical',
                namespace: ''
            },
            name: 'Historical Session',
            type: 'vista.channel'
        };

        const table = new SessionTable(
            domainObject,
            openmct,
            HistoricalSessionMetadata
        );
        const objectPath = [ domainObject ];

        const componentDefinition = {
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
        };

        const {
            componentInstance,
            destroy,
            el
        } = mount(componentDefinition);

        const indicator = {
            key: 'historical-session-indicator',
            element: el,
            priority: -1,
            destroy
        };

        openmct.indicators.add(indicator);
    };
}
