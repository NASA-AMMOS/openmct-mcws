<template>
  <div class="c-session-control">
    <div v-if="serviceError" class="c-session-control__error" role="alert">
      {{ serviceError }}
    </div>

    <section class="c-session-control__section">
      <h2>Tracking Sessions</h2>
      <button class="c-button" :disabled="busy" @click="refreshTracking">
        Refresh
      </button>
      <ul v-if="trackingSessions.length > 0" class="c-session-control__list">
        <li
          v-for="session in trackingSessions"
          :key="session.number"
          class="c-form__row"
        >
          <span>#{{ session.number }} {{ session.topic }} ({{ session.host }})</span>
          <button
            class="c-button"
            :disabled="busy"
            @click="startUplink([session.number])"
          >
            Start uplink
          </button>
          <button
            class="c-button"
            :disabled="busy"
            @click="startDownlink([session.number])"
          >
            Start downlink
          </button>
        </li>
      </ul>
      <p v-else>No tracking sessions loaded.</p>
    </section>

    <section class="c-session-control__section">
      <h2>Uplink Sessions</h2>
      <div class="c-form__row">
        <label>
          Session IDs
          <input v-model="uplinkIds" type="text" placeholder="7, 9" />
        </label>
        <label>
          Default target
          <select v-model="defaultTarget">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
          </select>
        </label>
        <label>
          Timeout (s)
          <input v-model="uplinkTimeout" type="text" />
        </label>
        <button
          class="c-button c-button--major"
          :disabled="busy"
          @click="startUplinkFromForm"
        >
          Start
        </button>
        <button
          class="c-button"
          :disabled="busy || uplinkSessions.length === 0"
          @click="stopUplink"
        >
          Stop
        </button>
        <button class="c-button" :disabled="busy" @click="refreshUplink">
          Refresh
        </button>
      </div>
      <p v-if="formError" class="c-session-control__error" role="alert">
        {{ formError }}
      </p>
      <ul v-if="uplinkSessions.length > 0" class="c-session-control__list">
        <li
          v-for="session in uplinkSessions"
          :key="session.sessionId"
          class="c-form__row"
        >
          <label>
            <input
              v-model="selectedSession"
              type="radio"
              name="uplink-session"
              :value="session.sessionId"
            />
            Session {{ session.sessionId }} (started {{ session.startTime }})
          </label>
        </li>
      </ul>
      <p v-else>No uplink sessions attached.</p>
      <p>
        Selected uplink session: {{ selectedSessionText }}. Command sending is
        {{ canSend ? 'enabled' : 'disabled' }}.
        <button v-if="hasSelection" class="c-button" @click="clearSelection">
          Clear selection
        </button>
      </p>
    </section>

    <section class="c-session-control__section">
      <h2>Downlink Sessions</h2>
      <div class="c-form__row">
        <label>
          Session IDs
          <input v-model="downlinkIds" type="text" placeholder="7, 9" />
        </label>
        <button
          class="c-button c-button--major"
          :disabled="busy"
          @click="startDownlinkFromForm"
        >
          Start
        </button>
        <button
          class="c-button"
          :disabled="busy || downlinkSessions.length === 0"
          @click="stopDownlink"
        >
          Stop
        </button>
        <button class="c-button" :disabled="busy" @click="refreshDownlink">
          Refresh
        </button>
      </div>
      <ul v-if="downlinkSessions.length > 0" class="c-session-control__list">
        <li
          v-for="session in downlinkSessions"
          :key="session.sessionId"
          class="c-form__row"
        >
          Session {{ session.sessionId }} (started {{ session.startTime }})
        </li>
      </ul>
      <p v-else>No downlink sessions started.</p>
    </section>
  </div>
</template>

<script>
export default {
  inject: ['openmct', 'missionControlService'],
  data() {
    return {
      busy: false,
      formError: null,
      uplinkIds: '',
      defaultTarget: 'AB',
      uplinkTimeout: '30',
      downlinkIds: ''
    };
  },
  computed: {
    serviceError() {
      return this.missionControlService.state.error;
    },
    trackingSessions() {
      return this.missionControlService.state.trackingSessions.filter(
        (session) => session.number !== undefined && session.number !== null
      );
    },
    uplinkSessions() {
      return this.missionControlService.state.uplinkSessions;
    },
    downlinkSessions() {
      return this.missionControlService.state.downlinkSessions;
    },
    canSend() {
      return this.missionControlService.canSendCommands();
    },
    hasSelection() {
      const selected = this.missionControlService.selectedUplinkSessionId;

      return selected !== null && selected !== undefined;
    },
    selectedSessionText() {
      const selected = this.missionControlService.selectedUplinkSessionId;

      return selected === null || selected === undefined ? 'none' : `session ${selected}`;
    },
    selectedSession: {
      get() {
        return this.missionControlService.selectedUplinkSessionId;
      },
      set(value) {
        this.missionControlService.selectUplinkSession(Number(value));
      }
    }
  },
  mounted() {
    this.refreshAll();
  },
  methods: {
    parseSessionIds(text) {
      return String(text)
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((value) => Number.isInteger(value));
    },
    async runExclusive(action) {
      this.busy = true;
      this.formError = null;

      try {
        await action();
      } catch (error) {
        // failures are recorded on service state for display
      } finally {
        this.busy = false;
      }
    },
    refreshAll() {
      return this.runExclusive(() =>
        Promise.all([
          this.missionControlService.refreshTrackingSessions(),
          this.missionControlService.refreshUplinkSessions(),
          this.missionControlService.refreshDownlinkSessions()
        ])
      );
    },
    refreshTracking() {
      return this.runExclusive(() => this.missionControlService.refreshTrackingSessions());
    },
    refreshUplink() {
      return this.runExclusive(() => this.missionControlService.refreshUplinkSessions());
    },
    refreshDownlink() {
      return this.runExclusive(() => this.missionControlService.refreshDownlinkSessions());
    },
    requireIds(text) {
      const ids = this.parseSessionIds(text);

      if (ids.length === 0) {
        this.formError = 'Enter at least one numeric session id.';

        return null;
      }

      return ids;
    },
    startUplink(sessionIds) {
      return this.runExclusive(() =>
        this.missionControlService.startUplinkSessions(sessionIds, {
          defaultTarget: this.defaultTarget,
          timeout: Number(this.uplinkTimeout) || 30
        })
      );
    },
    startUplinkFromForm() {
      const ids = this.requireIds(this.uplinkIds);

      if (!ids) {
        return Promise.resolve();
      }

      return this.startUplink(ids);
    },
    stopUplink() {
      return this.runExclusive(() => this.missionControlService.stopUplinkSessions());
    },
    startDownlink(sessionIds) {
      return this.runExclusive(() =>
        this.missionControlService.startDownlinkSessions(sessionIds)
      );
    },
    startDownlinkFromForm() {
      const ids = this.requireIds(this.downlinkIds);

      if (!ids) {
        return Promise.resolve();
      }

      return this.startDownlink(ids);
    },
    stopDownlink() {
      return this.runExclusive(() => this.missionControlService.stopDownlinkSessions());
    },
    clearSelection() {
      this.missionControlService.selectUplinkSession(null);
    }
  }
};
</script>

<style scoped>
.c-session-control {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  overflow-y: auto;
}
.c-session-control__list {
  list-style: none;
  margin: 8px 0;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
}
.c-session-control__error {
  font-weight: bold;
}
</style>
