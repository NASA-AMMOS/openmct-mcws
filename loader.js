define([
    'openmct',
    './src/AMMOSPlugins',
    // './src/legacy/export/bundle',
    // './src/legacy/products/bundle',
    // './src/legacy/table/bundle',
    './src/legacy/general/res/sass/vista.scss',
    './src/commandEventsView/plugin',
    './src/messagesView/plugin',
    './src/product-status/plugin',
    './about.html',
    './src/metadataAction/plugin',
    './src/clearDataIndicator/plugin',
    './src/dictionaryView/plugin',
    './src/packetSummary/plugin',
    './src/containerView/plugin',
    'services/identity/MCWSIdentityProvider',
    './src/persistence/plugin'
], function (
    openmct,
    AMMOSPlugins,
    // exportBundle,
    // productsBundle,
    // legacyTablesBundle,
    VistaStyles, /** Do not delete, needed for webpack to compile scss file*/
    CommandEventsViewPlugin,
    MessagesPlugin,
    ProductStatusPlugin,
    AboutTemplate,
    MetadataActionPlugin,
    ClearDataIndicator,
    DictionaryViewPlugin,
    PacketSummaryPlugin,
    ContainerViewPlugin,
    IdentityProvider,
    MCWSPersistenceProviderPlugin
) {

    function loader(config) {
        let persistenceLoaded;
        const persistenceLoadedPromise = new Promise(resolve => {
            persistenceLoaded = resolve;
        });
        openmct.setAssetPath(config.assetPath);

        //Optional Themes
        if (config.theme) {
            openmct.install(openmct.plugins[config.theme]());
        } else {
            openmct.install(openmct.plugins.Snow());
        }

        openmct.install(openmct.plugins.Filters([
            'vista.alarmsView',
            'telemetry.plot.overlay',
            'table',
            'vista.chanTableGroup',
            'vista.commandEventsView',
            'vista.messagesView',
            'vista.evrView'
        ]));
        openmct.install(openmct.plugins.ObjectMigration());
        openmct.install(openmct.plugins.DisplayLayout({
            showAsView: [
                'summary-widget', 'vista.packetSummaryEvents', 'vista.dataProducts',
                'vista.packets', 'vista.frameSummary', 'vista.frameWatch'
            ]
        }));
        openmct.install(openmct.plugins.ClearData([
                'table', 'telemetry.plot.overlay', 'telemetry.plot.stacked',
                'vista.packetSummaryEvents', 'vista.dataProducts', 'vista.packets',
                'vista.frameSummary', 'vista.frameWatch', 'vista.chanTableGroup'
            ],
            {
                indicator: false
            }
        ));
        openmct.install(ClearDataIndicator.default(config.globalStalenessInterval));
        openmct.install(CommandEventsViewPlugin.default());
        openmct.install(MessagesPlugin.default());
        openmct.install(ProductStatusPlugin.default());
        openmct.install(openmct.plugins.UTCTimeSystem())
        openmct.install(openmct.plugins.Notebook());
        openmct.install(MetadataActionPlugin.default());
        openmct.install(DictionaryViewPlugin.default());
        openmct.install(PacketSummaryPlugin.default());
        openmct.install(ContainerViewPlugin.default());
        openmct.install(openmct.plugins.Clock(
            { useClockIndicator: false }
        ));

        openmct.install(new AMMOSPlugins(config));

        openmct.user.setProvider(new IdentityProvider.default(openmct));
        
        if (config.useDeveloperStorage) {
            openmct.install(openmct.plugins.LocalStorage());
            openmct.install(openmct.plugins.MyItems());
            persistenceLoaded();
        } else {
            const mcwsPersistenceProvider =  MCWSPersistenceProviderPlugin.default(config.namespaces);
            openmct.install(async (_openmct) => {
                await mcwsPersistenceProvider(_openmct);
                persistenceLoaded();
            });
        }

        // [
        //     exportBundle,
        //     productsBundle,
        //     legacyTablesBundle
        // ].forEach(openmct.install, openmct);

        if (config.plugins) {
            if (config.plugins.summaryWidgets) {
                openmct.install(openmct.plugins.SummaryWidget());
            }
        }

        openmct.branding({
            aboutHtml: insertBuildInfo(AboutTemplate),
        });

        // do not show telemetry if it falls out of bounds
        // even if there is no new telemetry
        openmct.telemetry.greedyLAD(false);

        persistenceLoadedPromise.then(() => {
            openmct.start();
            window.openmct = openmct;
        });
    }

    /**
     * Replaces placeholders in the HTML with build info provided by webpack. 
     * Build info is defined in webpack config, and is exposed as global 
     * JavaScript variables
     * @param {*} markup 
     */
    function insertBuildInfo(markup) {
        return markup.replace(/\$\{project\.version\}/g, __VISTA_VERSION__)
            .replace(/\$\{timestamp\}/g, __VISTA_BUILD_DATE__)
            .replace(/\$\{buildNumber\}/g, __VISTA_REVISION__)
            .replace(/\$\{branch\}/g, __VISTA_BUILD_BRANCH__);
    }

    return loader;
});
