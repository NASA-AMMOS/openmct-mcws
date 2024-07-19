import mount from 'utils/mountVueComponent';
import HistoricalSessionIndicator from './indicator/historicalSessionIndicator.vue';
import SessionTable from './sessionTable/SessionTable';
import HistoricalSessionMetadata from './HistoricalSessionMetadata';

export default function HistoricalSessionsPlugin(options) {
    return function install(openmct) {
        const renderWhenVisible = func => {
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

        const table = new SessionTable(
            domainObject,
            openmct,
            options,
            HistoricalSessionMetadata
        );
        const objectPath = [ domainObject ];

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
