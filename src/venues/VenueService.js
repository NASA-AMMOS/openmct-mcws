import sessionServiceDefault from 'services/session/SessionService';
import Venue from './Venue';
import axios from 'axios';

class VenueService {
    constructor(configuration, openmct) {
        this.venues = configuration.venues;
        this.openmct = openmct;
        this.selectionPromise = null;
    }

    async getSelectedVenue() {
        if (!this.selectionPromise) {
            this.selectionPromise = this.getVenueSelectionFromUser();
        }
        return await this.selectionPromise;
    }

    getVenueSelectionFromUser() {
        // Note: The overlay logic is inherently callback-based due to UI interaction. 
        // It's not straightforward to convert this part to async/await without changing the UI logic.
        return new Promise((resolve, reject) => {
            const overlay = this.openmct.$injector.get('overlayService').createOverlay('vista.venue-dialog', {
                submit: async (isActive, selectedSession, selectedVenue) => {
                    try {
                        const venue = await this.applyConfig({
                            isActive: isActive,
                            session: selectedSession,
                            venue: selectedVenue
                        });
                        resolve(venue);
                    } catch (error) {
                        reject(error);
                    } finally {
                        overlay.dismiss();
                    }
                }
            });
        });
    }

    _instantiateVenues(venueDefinitions) {
        return venueDefinitions.map(venueDefinition => new Venue(venueDefinition));
    }

    async listVenues() {
        if (Array.isArray(this.venues)) {
            return this._instantiateVenues(this.venues);
        }
        try {
            const response = await axios.request({
                withCredentials: true,
                url: this.venues
            });
            return this._instantiateVenues(response.data);
        } catch (error) {
            console.error('VenueService got error fetching venues:', error);
            return [];
        }
    }

    async findSelectedVenue(session) {
        const venues = await this.listVenues();
        const matchingVenue = venues.find(v => v.host === session.host);
        return matchingVenue || venues[0];
    }

    async applyConfig(config) {
        const sessions = sessionServiceDefault.default();
        this.activeConfig = config;

        if (config.session.number) {
            config.session.numbers = [config.session.number];
            sessions.setHistoricalSession(config.session);
        } else if (config.session.sessions && config.session.sessions[0]) {
            let session = config.session.sessions[0];
            session.numbers = [session.number];
            sessions.setHistoricalSession(session);
        }

        if (config.isActive) {
            sessions.setActiveTopicOrSession(config.session);
        }

        let venue = config.venue ? config.venue : await this.findSelectedVenue(config.session);
        config.venue = venue;
        return venue;
    }
}

export default VenueService;
