import mount from 'utils/mountVueComponent';
import HistoricalSessionIndicator from './indicator/historicalSessionIndicator.vue';
import SessionTable from './sessionTable/SessionTable';
import HistoricalSessionMetadata from './HistoricalSessionMetadata';

export default function HistoricalSessionsPlugin() {
    return function install(openmct) {
        const indicator = {
            element: document.createElement('div'),
            priority: -1
        };

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
            
            const componentOptions = {
                element: indicator.element
            };
            
            const {
                componentInstance,
                destroy,
                el
            } = mount(componentDefinition, componentOptions);
        });

        openmct.indicators.add(indicator);
    };
}
