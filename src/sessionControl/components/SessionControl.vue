<template>
  <div class="c-session-control">
    <div v-if="serviceError" class="c-session-control__error" role="alert">
      {{ serviceError }}
    </div>

    <section class="c-session-control__section">
      <h2>Tracking Sessions</h2>
      <button class="c-button" :disabled="busy" @click="refreshTracking">Refresh</button>
      <ul v-if="trackingSessions.length > 0" class="c-session-control__list">
        <li v-for="session in trackingSessions" :key="session.number" class="c-form__row">
          <span>#{{ session.number }} {{ session.topic }} ({{ session.host }})</span>
          <button class="c-button" :disabled="busy" @click="startUplink([session.number])">
            Start uplink
          </button>
          <button class="c-button" :disabled="busy" @click="startDownlink([session.number])">
            Start downlink
          </button>
        </li>
      </ul>
      <p v-else>No tracking sessions loaded.</p>
    </section>

    <section class="c-session-control__section">
      <h2>Uplink Sessions</h2>
      <h3>Open a new uplink session</h3>
      <p>The session stays open and every command reuses it until you stop it.</p>
      <div class="c-form__row">
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
      </div>
      <SessionFieldsForm
        id-prefix="uplink-field"
        :fields="sessionFields.uplink"
        :active-sessions="uplinkSessions"
        :busy="busy"
        submit-label="Open uplink session"
        empty-text="No uplink session fields are configured (missionControl.uplinkSessionFields); the proxy defaults apply."
        @submit="openUplink"
      />

      <h3>Attach to existing sessions</h3>
      <div class="c-form__row">
        <label>
          Session IDs
          <input v-model="uplinkIds" type="text" placeholder="7, 9" />
        </label>
        <button class="c-button" :disabled="busy" @click="startUplinkFromForm">Attach</button>
        <button class="c-button" :disabled="busy" @click="refreshUplink">Refresh</button>
      </div>
      <p v-if="formError" class="c-session-control__error" role="alert">
        {{ formError }}
      </p>
      <ul v-if="uplinkSessions.length > 0" class="c-session-control__list">
        <li v-for="session in uplinkSessions" :key="session.sessionId" class="c-form__row">
          <label>
            <input
              v-model="selectedSession"
              type="radio"
              name="uplink-session"
              :value="session.sessionId"
            />
            Session {{ session.sessionId }} (started {{ session.startTime }})
          </label>
          <span
            v-for="parameter in describe(sessionFields.uplink, session)"
            :key="parameter.key"
            class="c-session-control__parameter"
          >
            {{ parameter.label }}: {{ parameter.value }}
          </span>
          <button
            class="c-button"
            :disabled="busy"
            :aria-label="`Stop uplink session ${session.sessionId}`"
            @click="stopUplink(session.sessionId)"
          >
            Stop
          </button>
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
      <h3>Open a new downlink session</h3>
      <SessionFieldsForm
        id-prefix="downlink-field"
        :fields="sessionFields.downlink"
        :active-sessions="downlinkSessions"
        :busy="busy"
        submit-label="Open downlink session"
        empty-text="No downlink session fields are configured (missionControl.downlinkSessionFields); the proxy defaults apply."
        @submit="openDownlink"
      />

      <h3>Attach to existing sessions</h3>
      <div class="c-form__row">
        <label>
          Session IDs
          <input v-model="downlinkIds" type="text" placeholder="7, 9" />
        </label>
        <button class="c-button" :disabled="busy" @click="startDownlinkFromForm">Attach</button>
        <button class="c-button" :disabled="busy" @click="refreshDownlink">Refresh</button>
      </div>
      <ul v-if="downlinkSessions.length > 0" class="c-session-control__list">
        <li v-for="session in downlinkSessions" :key="session.sessionId" class="c-form__row">
          <span>Session {{ session.sessionId }} (started {{ session.startTime }})</span>
          <span v-if="session.state" class="c-session-control__parameter">
            State: {{ session.state }}
          </span>
          <span
            v-for="parameter in describe(sessionFields.downlink, session)"
            :key="parameter.key"
            class="c-session-control__parameter"
          >
            {{ parameter.label }}: {{ parameter.value }}
          </span>
          <button
            class="c-button"
            :disabled="busy"
            :aria-label="`Stop downlink session ${session.sessionId}`"
            @click="stopDownlink(session.sessionId)"
          >
            Stop
          </button>
        </li>
      </ul>
      <p v-else>No downlink sessions started.</p>
    </section>
  </div>
</template>

<script>
import SessionFieldsForm from './SessionFieldsForm.vue';
import { describeParameters } from '../../missionControl/sessionFields.js';

export default {
  components: {
    SessionFieldsForm
  },
  inject: {
    openmct: { from: 'openmct' },
    missionControlService: { from: 'missionControlService' },
    sessionFields: {
      from: 'sessionFields',
      default: () => ({ uplink: [], downlink: [] })
    }
  },
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
    describe(fields, session) {
      return describeParameters(fields, session.parameters);
    },
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
      } catch {
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
    uplinkOptions() {
      return {
        defaultTarget: this.defaultTarget,
        timeout: Number(this.uplinkTimeout) || 30
      };
    },
    openUplink(parameters) {
      return this.runExclusive(() =>
        this.missionControlService.openUplinkSession(parameters, this.uplinkOptions())
      );
    },
    startUplink(sessionIds) {
      return this.runExclusive(() =>
        this.missionControlService.startUplinkSessions(sessionIds, this.uplinkOptions())
      );
    },
    startUplinkFromForm() {
      const ids = this.requireIds(this.uplinkIds);

      if (!ids) {
        return Promise.resolve();
      }

      return this.startUplink(ids);
    },
    stopUplink(sessionId) {
      return this.runExclusive(() => this.missionControlService.stopUplinkSession(sessionId));
    },
    openDownlink(parameters) {
      return this.runExclusive(() => this.missionControlService.openDownlinkSession(parameters));
    },
    startDownlink(sessionIds) {
      return this.runExclusive(() => this.missionControlService.startDownlinkSessions(sessionIds));
    },
    startDownlinkFromForm() {
      const ids = this.requireIds(this.downlinkIds);

      if (!ids) {
        return Promise.resolve();
      }

      return this.startDownlink(ids);
    },
    stopDownlink(sessionId) {
      return this.runExclusive(() => this.missionControlService.stopDownlinkSession(sessionId));
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
.c-session-control__parameter {
  opacity: 0.8;
  margin-left: 12px;
}
</style>
