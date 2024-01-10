import mount from 'utils/mountVueComponent';
import HistoricalSessionIndicator from './indicator/historicalSessionIndicator.vue';
import SessionTable from './sessionTable/SessionTable';
import HistoricalSessionMetadata from './HistoricalSessionMetadata';

export default function HistoricalSessionsPlugin() {
    return function install(openmct) {
        openmct.on('start', () => {
            const instantiate = openmct.$injector.get('instantiate');
            const model = {
                identifier: {
                    key: 'session-historical',
                    namespace: ''
                },
                name: 'Historical Session',
                type: 'vista.channel'
            };
            const oldStyleDomainObject = instantiate(model);
            const newStyleDomainObject = oldStyleDomainObject.useCapability('adapter');
            const table = new SessionTable(
                newStyleDomainObject,
                openmct,
                HistoricalSessionMetadata
            );
            const objectPath = [ model ];

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
        });

    };
}
