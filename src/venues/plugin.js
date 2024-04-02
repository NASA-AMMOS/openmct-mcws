import VenueService from './VenueService';
import VenueDialogController from './controllers/VenueDialogController';
import venueDialogTemplate from './templates/venue-dialog.html';
import ActiveVenueSelectorController from './controllers/ActiveVenueSelectorController';
import activeVenueSelectorTemplate from './templates/active-venue-selector.html';
import VenueController from './controllers/VenueController';
import venueTemplate from './templates/venue.html';
import ActiveSessionSelectorController from './controllers/ActiveSessionSelectorController';
import activeSessionSelectorTemplate from './templates/active-session-selector.html';
import HistoricalSessionSelectorController from './controllers/HistoricalSessionSelectorController';
import historicalSessionSelectorTemplate from './templates/historical-session-selector.html';

export function VISTAVenuePlugin(options) {
    if (!options.venueAware) {
        options.venueAware = {
            enabled: false
        };
    }

    return function install(openmct) {
        const configuration = options.venueAware;

        // Need to install some providers even if the plugin is disabled.
        openmct.legacyExtension('templates', {
            key: 'vista.historical-session-selector',
            template: historicalSessionSelectorTemplate
        });

        openmct.legacyExtension('controllers', {
            key: 'HistoricalSessionSelectorController',
            implementation: HistoricalSessionSelectorController,
            depends: [
                "$scope",
                "vista.sessions"
            ]
        });

        // Everything after this is only installed if we enable the plugin.
        if (!options.venueAware.enabled) {
            return;
        }

        const venueService = new VenueService(configuration, openmct);

        openmct.legacyExtension('services', {
            key: 'vista.venues',
            implementation: function () {
                return venueService;
            }
        });

        openmct.legacyExtension('templates', {
            key: 'vista.venue-dialog',
            template: venueDialogTemplate
        });

        openmct.legacyExtension('controllers', {
            key: 'VenueDialogController',
            implementation: VenueDialogController,
            depends: [
                "$scope",
                "vista.venues"
            ]
        });

        openmct.legacyExtension('templates', {
            key: 'vista.venue',
            template: venueTemplate
        });

        openmct.legacyExtension('controllers', {
            key: 'VenueController',
            implementation: VenueController,
            depends: [
                "$scope"
            ]
        });

        openmct.legacyExtension('templates', {
            key: 'vista.venue-selector',
            template: activeVenueSelectorTemplate
        });

        openmct.legacyExtension('controllers', {
            key: 'ActiveVenueSelectorController',
            implementation: ActiveVenueSelectorController,
            depends: [
                "$scope",
                "vista.venues"
            ]
        });

        openmct.legacyExtension('templates', {
            key: 'vista.active-session-selector',
            template: activeSessionSelectorTemplate
        });

        openmct.legacyExtension('controllers', {
            key: 'ActiveSessionSelectorController',
            implementation: ActiveSessionSelectorController,
            depends: [
                "$scope",
                "vista.sessions"
            ]
        });

        openmct.objects.addRoot({
            namespace: 'vista-active',
            key: 'dataset'
        });

        openmct.objects.addProvider('vista-active', {
            get: function () {
                return venueService.getSelectedVenue()
                    .then(function (venue) {
                        return venue.getModel();
                    })
                    .then(function (model) {
                        model.identifier = {
                            namespace: 'vista-active',
                            key: 'dataset'
                        };
                        model.location = 'ROOT';
                        return model;
                    });
            }
        });
    };
}
