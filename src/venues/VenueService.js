import Vue from 'vue';
import sessionService from '../services/session/SessionService';
import VenueDialogComponent from './components/VenueDialogComponent.vue';
import Venue from './Venue';

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

    async getVenueSelectionFromUser() {
        this.selectionPromise = new Promise((resolve, reject) => {
            this.resolveSelection = resolve;
            this.rejectSelection = reject;
            const VenueDialogComponent = this.createVenueDialogElement();
            this.overlay = this.openmct.overlays.overlay({
                element: VenueDialogComponent.$mount().$el,
                size: 'small',
                dismissable: false,
                onDestroy: () => {
                    VenueDialogComponent.$destroy();
                }
            });
        }).finally(() => this.overlay.dismiss());

        return this.selectionPromise;
    }

    createVenueDialogElement() {
        const self = this;
        const VenueDialogVueComponent = new Vue({
            provide: {
                venueService: self
            },
            components: {
                VenueDialogComponent
            },
            template: `<VenueDialogComponent @submit="handleSubmit" />`,
            methods: {
                handleSubmit(isActive, selectedSession, selectedVenue) {
                    self.handleDialogSubmit(isActive, selectedSession, selectedVenue);
                }
            }
        });

        return VenueDialogVueComponent;
    }

    async handleDialogSubmit(isActive, selectedSession, selectedVenue) {
        try {
            const venue = await this.applyConfig({
                isActive,
                session: selectedSession,
                venue: selectedVenue
            });
            this.resolveSelection(venue);
        } catch (error) {
            this.rejectSelection(error);
        }
    }

    _instantiateVenues(venueDefinitions) {
        return venueDefinitions.map(venueDefinition => new Venue(venueDefinition));
    }

    async listVenues() {
        if (Array.isArray(this.venues)) {
            return this._instantiateVenues(this.venues);
        }

        try {
            const response = await fetch(this.venues, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return this._instantiateVenues(data);
        } catch (error) {
            console.error('VenueService - error fetching venues:', error);
            return [];
        }
    }

    async findSelectedVenue(session) {
        const venues = await this.listVenues();
        const matchingVenue = venues.find(v => v.host === session.host);
        return matchingVenue || venues[0];
    }

    async applyConfig(config) {
        const sessions = sessionService.default();
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
