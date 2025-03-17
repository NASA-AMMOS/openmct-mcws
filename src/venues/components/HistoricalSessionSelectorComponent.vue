<template>
  <div class="c-session-selector__sessions">
    <div class="c-session-selector__sessions__hint">
      Select a session to use for all historical queries.
      <span v-if="sessions.length >= 100"
        >Showing first 100 results, use filters to narrow results</span
      >
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
            <th><input v-model="filter.number" type="text" /></th>
            <th><input v-model="filter.user" type="text" /></th>
            <th><input v-model="filter.host" type="text" /></th>
            <th><input v-model="filter.name" type="text" /></th>
            <th><input v-model="filter.description" type="text" /></th>
            <th><input v-model="filter.start_time" type="text" /></th>
            <th><input v-model="filter.end_time" type="text" /></th>
            <th><input v-model="filter.downlink_stream_id" type="text" /></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="session in sessions"
            :key="getSessionKey(session)"
            :class="{ 'is-selected': isSelected(session) }"
            @click="select(session)"
          >
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
import SessionService from '../../services/session/SessionService';

export default {
  props: {
    urls: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      sessions: [],
      filter: {},
      currentSelection: undefined,
      loading: false,
      filterTimeout: null
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
      }
    }
  },
  mounted() {
    this.sessionService = SessionService();
    this.loadSessions();
  },
  methods: {
    select(session) {
      if (this.isSelected(session)) {
        this.currentSelection = undefined;
        this.$emit('sessionSelected', undefined);
      } else {
        this.currentSelection = session;
        this.$emit('sessionSelected', session);
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
    async loadSessions() {
      this.loading = true;
      this.sessions = [];

      const loadTracker = {};
      this.loadTracker = loadTracker;

      try {
        const sessions = await this.sessionService.getHistoricalSessions(this.filter);
        if (loadTracker !== this.loadTracker) {
          return;
        }
        this.sessions = sessions;
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        if (loadTracker === this.loadTracker) {
          this.loading = false;
        }
      }
    }
  }
};
</script>
