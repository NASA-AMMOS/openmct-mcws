<template>
  <div>
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
            <li class="l-venue-selection__tab c-tab"
                :class="{ 'is-current': isActiveVenueSelect }"
                @click="isActiveVenueSelect = true">
              Active Venues
            </li>
            <li class="l-venue-selection__tab c-tab"
                :class="{ 'is-current': !isActiveVenueSelect }"
                @click="isActiveVenueSelect = false">
              Previous Sessions
            </li>
          </ul>

          <VenueSelectorComponent v-if="isActiveVenueSelect"
              :selectVenue="selectVenue"
              :isSelected="isSelectedVenue">
          </VenueSelectorComponent>

          <ActiveSessionSelector v-if="isActiveVenueSelect && selectedVenue"
              :venue="selectedVenue"
              :selectSession="selectSession"
              :isSelected="isSelectedSession">
          </ActiveSessionSelector>

          <HistsoricalSessionSelector v-if="!isActiveVenueSelect && urlsForHistoricalSessions"
              :selectSession="selectSession"
              :urls="urlsForHistoricalSessions">
          </HistsoricalSessionSelector>

          <div v-if="!isActiveVenueSelect && selectedSession"
                  class="l-selected-session">
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
        <button class="c-button c-button--major"
            @click="submit"
            :class="{ disabled: !canSubmit }">
          Connect
        </button>
      </div>
    </span>
  </div>
</template>

<script>
export default {
   watch: {
    isActiveVenueSelect(newVal) {
      this.selectedSession = null;
      if (!newVal) {
        this.listVenues();
      } else {
        this.urlsForHistoricalSessions = [];
      }
    }
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
  data() {
    return {
      isActiveVenueSelect: true,
      selectedVenue: null,
      selectedSession: null,
      urlsForHistoricalSessions: [],
      // Other data properties as needed
    };
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
      // Adapt this method to match how you handle form submission in Vue
    },
    listVenues() {
      // This method should replace the venueService.listVenues call
      // Adapt it to your application's way of fetching data
    }
  }
};
</script>

<style scoped>
/* Add any styles that were originally in your AngularJS component */
</style>