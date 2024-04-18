define([
    'services/dataset/DatasetCache',
    './DatasetCompositionProvider',
    './TaxonomyCompositionProvider',
    './TaxonomyObjectProvider',
    './ChannelAlarmPlugin',
    './EVRHighlightProvider',
    './FrameEventFilterObjectProvider'
], function (
    DatasetCache,
    DatasetCompositionProvider,
    TaxonomyCompositionProvider,
    TaxonomyObjectProvider,
    ChannelAlarmPlugin,
    EVRHighlightProvider,
    FrameEventFilterObjectProvider
) {

    const TIMESYSTEM_DOMAIN_MAP = {
        'msl.sol': {
            key: 'msl.sol',
            name: 'MSL Sol',
            source: 'lst'
        },
        'lmst': {
            key: 'lmst',
            name: 'LMST',
            source: 'lst'
        },
        'scet': {
            key: 'scet',
            name: 'SCET'
        },
        'ert': {
            key: 'ert',
            name: 'ERT'
        },
        'sclk': {
            key: 'sclk',
            name: 'SCLK as Float 64'
        }
    };

    function TaxonomyPlugin(options) {
        return function install(openmct) {
            const datasets = DatasetCache.default();
            const utcTimeSystems = openmct.time.getAllTimeSystems().filter(ts => ts.key !== 'utc')
            const domains = utcTimeSystems.map((timeSystem, i) => {
                const domain = TIMESYSTEM_DOMAIN_MAP[timeSystem.key];
                domain.format = timeSystem.timeFormat;
                domain.hints = {
                    domain: i
                };

                return domain;
            });

            openmct.objects.addProvider('vista', new TaxonomyObjectProvider(datasets, domains));
            openmct.composition.addProvider(new DatasetCompositionProvider(datasets));
            openmct.composition.addProvider(new TaxonomyCompositionProvider(datasets));
            openmct.install(new ChannelAlarmPlugin(domains, datasets));
            openmct.objects.addProvider('vista-frame-event-filter', new FrameEventFilterObjectProvider(datasets));
            openmct.telemetry.addProvider(new EVRHighlightProvider(options));

            // TODO: verify if this is still needed in a new format, old format below
            // openmct.legacyExtension('components', {
            //     provides: 'identifierService',
            //     type: 'decorator',
            //     implementation: function (identifierService) {
            //         // Monkey patch so that we don't generate identifiers in
            //         // vista namespace.
            //         var oldGenerate = identifierService.generate;
            //         identifierService.generate = function (space) {
            //             if (space === 'vista' || space === 'vista-active') {
            //                 return oldGenerate();
            //             }
            //             return oldGenerate(space);
            //         };
            //         return identifierService;
            //     }
            // });

            // /**
            //  * Generate a new domain object identifier. A persistence space
            //  * may optionally be included; if not specified, no space will
            //  * be encoded into the identifier.
            //  * @param {string} [space] the persistence space to encode
            //  *        in this identifier
            //  * @returns {string} a new domain object identifier
            //  */
            // IdentifierProvider.prototype.generate = function (space) {
            //     var id = uuid.v4();
            //     if (space !== undefined) {
            //         id = space + ":" + id;
            //     }

            //     return id;
            // };
        };
    }

    return TaxonomyPlugin;
});
