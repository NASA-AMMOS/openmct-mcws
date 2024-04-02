<template>
  <div class="c-session-selector__sessions">
    <div class="c-session-selector__sessions__hint">
      Select a session to use for all historical queries.
      <span v-if="sessions.length >= 100">Showing first 100 results, use filters to narrow results</span>
    </div>
    <div class="c-session-selector__sessions__table-w">
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
          <tr>
            <th><input type="text" v-model="filter.number"/></th>
            <th><input type="text" v-model="filter.user"/></th>
            <th><input type="text" v-model="filter.host"/></th>
            <th><input type="text" v-model="filter.name"/></th>
            <th><input type="text" v-model="filter.description"/></th>
            <th><input type="text" v-model="filter.start_time"/></th>
            <th><input type="text" v-model="filter.end_time"/></th>
            <th><input type="text" v-model="filter.downlink_stream_id"/></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="getSessionKey(session)"
              :class="{ 'is-selected': isSelected(session) }"
              @click="select(session)">
            <td>{{ session.number }}</td>
            <td>{{ session.user }}</td>
            <td>{{ session.host }}</td>
            <td>{{ session.name }}</td>
            <td>{{ session.description }}</td>
            <td>{{ session.start_time }}</td>
            <td>{{ session.end_time }}</td>
            <td>{{ session.downlink_stream_id }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import sessionService from '../services/session/SessionService';

export default {
  data() {
    return {
      sessions: [],
      filter: {},
      currentSelection: undefined,
      loading: false,
      filterTimeout: null,
    };
  },
  watch: {
    filter: {
      deep: true,
      handler() {
        if (this.filterTimeout) {
          clearTimeout(this.filterTimeout);
        }
        this.filterTimeout = setTimeout(this.applyFilter, 250);
      },
    },
  },
  mounted() {
    this.loadSessions();
  },
  methods: {
    select(session) {
      if (this.isSelected(session)) {
        this.currentSelection = undefined;
        // Handle unselect session
      } else {
        this.currentSelection = session;
        // Handle select session
      }
    },
    getSessionKey(session) {
      return session.host + '_' + session.number;
    },
    isSelected(session) {
      return this.currentSelection
        ? this.getSessionKey(this.currentSelection) === this.getSessionKey(session)
        : false;
    },
    applyFilter() {
      this.loadSessions();
    },
    loadSessions() {
      this.loading = true;
      this.sessions = [];
      const loadTracker = {};
      this.loadTracker = loadTracker;

      sessionService.getHistoricalSessions(this.filter) // Adjust this call based on your actual session service
        .then(sessions => {
          if (loadTracker !== this.loadTracker) {
            return;
          }
          this.sessions = sessions;
          this.loading = false;
        })
        .catch(() => {
          if (loadTracker !== this.loadTracker) {
            return;
          }
          this.loading = false;
        });
    },
  }
};
</script>
