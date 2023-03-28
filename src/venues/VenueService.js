define([
    'services/session/SessionService',
    './Venue',
    'axios'
], function (
    sessionServiceDefault,
    Venue,
    axios
) {

    function VenueService(configuration, openmct) {
        this.venues = configuration.venues;
        this.openmct = openmct;
    }

    VenueService.prototype.getSelectedVenue = function () {
        // TODO: Check localstorage/url for already selected venue.
        // Needs resolution process similar to session url handler.
        if (!this.selectionPromise) {
            this.selectionPromise = this.getVenueSelectionFromUser();
        }

        return this.selectionPromise;
    };

    VenueService.prototype.getVenueSelectionFromUser = function () {
        return new Promise(function (resolve, reject) {
            // TODO: this overlay should block.
            var overlay = this.openmct.$injector.get('overlayService').createOverlay(
                'vista.venue-dialog',
                {
                    submit: function (isActive, selectedSession, selectedVenue) {
                        this.applyConfig({
                                isActive: isActive,
                                session: selectedSession,
                                venue: selectedVenue
                            })
                            .then(resolve, reject)
                            .then(function () {
                                overlay.dismiss();
                            });
                    }.bind(this)
                }
            );
        }.bind(this));
    }

    VenueService.prototype._instantiateVenues = function (venueDefinitions) {
        return venueDefinitions.map(function(venueDefinition) {
            return new Venue(venueDefinition, openmct);
        });
    };

    VenueService.prototype.listVenues = function () {
        if (Array.isArray(this.venues)) {
            return Promise.resolve(this._instantiateVenues(this.venues));
        }
        return axios.request({
            withCredentials: true,
            url: this.venues
        }).then(function (response) {
            return response.data;
        }, function (error) {
            console.error('VenueService got error fetching venues:', error);
            return [];
        }).then(this._instantiateVenues);
    };

    // Tries to find the correct venue for a given session by matching
    // against venue definitions.  If it can't find the correct venue, will
    // use the first venue in the configuration.
    VenueService.prototype.findSelectedVenue = function (session) {
        return this.listVenues()
            .then(function (venues) {
                var matchingVenue = venues.filter(function (v) {
                    return v.host === session.host;
                })[0];
                if (matchingVenue) {
                    return matchingVenue;
                }
                return venues[0];
            });
    };

    VenueService.prototype.applyConfig = function (config) {
        const sessions = sessionServiceDefault.default();
        this.activeConfig = config;

        if (config.session.number) {
            config.session.numbers = [config.session.number];
            sessions.setHistoricalSession(config.session);
        } else if (config.session.sessions[0]) {
            // It's a topic, filter by first session.
            var session = config.session.sessions[0];
            session.numbers = [session.number];
            sessions.setHistoricalSession(config.session.sessions[0]);
        }

        if (config.isActive) {
            sessions.setActiveTopicOrSession(config.session);
        }

        var findVenue;
        if (!config.venue) {
            findVenue = this.findSelectedVenue(config.session)
        } else {
            findVenue = Promise.resolve(config.venue);
        }
        return findVenue.then(function (venue) {
            config.venue = venue;
            return venue;
        });
    };

    return VenueService;
});
