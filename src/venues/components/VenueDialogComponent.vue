<template>
  <span class="u-contents">
    <div class="c-overlay__top-bar">
      <div class="c-overlay__dialog-title">Connect to a Data Source</div>
      <div class="c-overlay__dialog-hint">
        Select an active venue or a previous session to continue.
      </div>
    </div>
    <div class="c-overlay__contents-main c-venue-selector">
      <div class="abs l-venue-selection">
        <ul class="l-venue-selection__tabs c-tabs">
          <li
            class="l-venue-selection__tab c-tab"
            :class="{ 'is-current': isActiveVenueSelect }"
            @click="isActiveVenueSelect = true"
          >
            Active Venues
          </li>
          <li
            class="l-venue-selection__tab c-tab"
            :class="{ 'is-current': !isActiveVenueSelect }"
            @click="isActiveVenueSelect = false"
          >
            Previous Sessions
          </li>
        </ul>

        <ActiveVenueSelectorComponent
          v-if="isActiveVenueSelect"
          :venue="selectedVenue"
          @venue-selected="selectVenue"
        >
        </ActiveVenueSelectorComponent>

        <ActiveSessionSelectorComponent
          v-if="isActiveVenueSelect && selectedVenue"
          :venue="selectedVenue"
          :session="selectedSession"
          @session-selected="selectSession"
        >
        </ActiveSessionSelectorComponent>

        <HistoricalSessionSelectorComponent
          v-if="!isActiveVenueSelect && urlsForHistoricalSessions"
          :urls="urlsForHistoricalSessions"
          @session-selected="selectSession"
        >
        </HistoricalSessionSelectorComponent>

        <div v-if="!isActiveVenueSelect && selectedSession" class="l-selected-session">
          <div class="label">Selected Session:</div>
          <table>
            <thead>
              <tr>
                <th>Id</th>
                <th>User</th>
                <th>Host</th>
                <th>Name</th>
                <th>Description</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Downlink Stream Id</th>
              </tr>
            </thead>
            <tbody>
              <tr class="is-selected">
                <td>{{ selectedSession.number }}</td>
                <td>{{ selectedSession.user }}</td>
                <td>{{ selectedSession.host }}</td>
                <td>{{ selectedSession.name }}</td>
                <td>{{ selectedSession.description }}</td>
                <td>{{ selectedSession.start_time }}</td>
                <td>{{ selectedSession.end_time }}</td>
                <td>{{ selectedSession.downlink_stream_id }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="c-overlay__button-bar">
      <button class="c-button c-button--major" :class="{ disabled: !canSubmit }" @click="submit">
        Connect
      </button>
    </div>
  </span>
</template>

<script>
import ActiveVenueSelectorComponent from './ActiveVenueSelectorComponent.vue';
import ActiveSessionSelectorComponent from './ActiveSessionSelectorComponent.vue';
import HistoricalSessionSelectorComponent from './HistoricalSessionSelectorComponent.vue';
import { toRaw } from 'vue';

export default {
  components: {
    ActiveVenueSelectorComponent,
    ActiveSessionSelectorComponent,
    HistoricalSessionSelectorComponent
  },
  inject: ['venueService'],
  emits: ['submit'],
  data() {
    return {
      isActiveVenueSelect: true,
      selectedVenue: null,
      selectedSession: null,
      urlsForHistoricalSessions: []
    };
  },
  computed: {
    isSelectedVenue() {
      return this.selectedVenue !== null;
    },
    isSelectedSession() {
      return this.selectedSession !== null;
    },
    canSubmit() {
      return this.isActiveVenueSelect
        ? Boolean(this.selectedVenue && this.selectedSession)
        : Boolean(this.selectedSession);
    }
  },
  watch: {
    isActiveVenueSelect(newVal) {
      this.selectedSession = null;
      if (!newVal) {
        this.fetchAndSetUrlsForHistoricalSessions();
      } else {
        this.urlsForHistoricalSessions = [];
      }
    }
  },
  methods: {
    selectVenue(venue) {
      this.selectedVenue = venue;
      this.selectedSession = null;
    },
    selectSession(session) {
      this.selectedSession = session;
    },
    submit() {
      this.$emit(
        'submit',
        this.isActiveVenueSelect,
        toRaw(this.selectedSession),
        this.selectedVenue
      );
    },
    async fetchAndSetUrlsForHistoricalSessions() {
      try {
        const venues = await this.venueService.listVenues();
        this.urlsForHistoricalSessions = venues
          .map((v) => v.domainObject.sessionUrl)
          .filter((v) => !!v);
      } catch (error) {
        console.error('Error fetching venues:', error);
      }
    }
  }
};
</script>
