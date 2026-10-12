import { reactive } from 'vue';
import { CommandStatusTracker } from './commandStatusTracker.js';

const DEFAULT_API_BASE = './api/v1';
const DEFAULT_COMMAND_TARGET = 'AB';
const DEFAULT_START_TIMEOUT = 30;

function sessionPath(collection, sessionId) {
  return `/${collection}/${encodeURIComponent(String(sessionId))}`;
}

/**
 * Shared uplink/downlink session and commanding state for the mission
 * control plugins. Same-host proxy calls carry the OIDC session cookie.
 *
 * Sessions are opened either from configured `parameters`
 * (`missionControl.uplinkSessionFields` / `downlinkSessionFields`) or by
 * attaching to existing tracking session ids, and are stopped one at a time.
 */
export class MissionControlService {
  constructor(openmct, apiBase = DEFAULT_API_BASE) {
    this.openmct = openmct;
    this.apiBase = apiBase || DEFAULT_API_BASE;
    this.commandStatus = new CommandStatusTracker();
    this.state = reactive({
      uplinkSessions: [],
      downlinkSessions: [],
      trackingSessions: [],
      selectedUplinkSessionId: null,
      error: null
    });
  }

  get selectedUplinkSessionId() {
    return this.state.selectedUplinkSessionId;
  }

  isSessionAttached(sessionId) {
    return this.state.uplinkSessions.some((session) => session.sessionId === sessionId);
  }

  canSendCommands() {
    const selected = this.state.selectedUplinkSessionId;

    return selected !== null && selected !== undefined && this.isSessionAttached(selected);
  }

  selectUplinkSession(sessionId) {
    this.state.selectedUplinkSessionId = sessionId;
  }

  getUplinkSession(sessionId) {
    return this.state.uplinkSessions.find((session) => session.sessionId === sessionId) || null;
  }

  async refreshTrackingSessions() {
    return this.#guarded(async () => {
      this.state.trackingSessions = await this.#request('/sessions/active');

      return this.state.trackingSessions;
    });
  }

  async refreshUplinkSessions() {
    return this.#guarded(async () => {
      this.state.uplinkSessions = await this.#request('/command-sessions');

      if (!this.isSessionAttached(this.state.selectedUplinkSessionId)) {
        this.state.selectedUplinkSessionId = null;
      }

      return this.state.uplinkSessions;
    });
  }

  async startUplinkSessions(sessionIds, options = {}) {
    const { defaultTarget = DEFAULT_COMMAND_TARGET, timeout = DEFAULT_START_TIMEOUT } = options;

    return this.#guarded(async () => {
      const started = await this.#request('/command-sessions', {
        method: 'POST',
        body: JSON.stringify({ sessionIds, defaultTarget, timeout })
      });

      await this.refreshUplinkSessions();

      if (this.state.selectedUplinkSessionId === null && sessionIds.length > 0) {
        this.selectUplinkSession(sessionIds[0]);
      }

      return started;
    });
  }

  /**
   * Opens a new long-lived uplink session from configured parameters.
   * Commands sent afterwards reuse it until it is stopped.
   */
  async openUplinkSession(parameters, options = {}) {
    const { defaultTarget = DEFAULT_COMMAND_TARGET, timeout = DEFAULT_START_TIMEOUT } = options;

    return this.#guarded(async () => {
      const started = await this.#request('/command-sessions', {
        method: 'POST',
        body: JSON.stringify({ parameters, defaultTarget, timeout })
      });

      await this.refreshUplinkSessions();

      const [openedId] = started?.sessionIds || [];

      if (this.state.selectedUplinkSessionId === null && openedId !== undefined) {
        this.selectUplinkSession(openedId);
      }

      return started;
    });
  }

  async stopUplinkSession(sessionId) {
    return this.#guarded(async () => {
      await this.#request(sessionPath('command-sessions', sessionId), { method: 'DELETE' });
      this.state.uplinkSessions = this.state.uplinkSessions.filter(
        (session) => session.sessionId !== sessionId
      );

      if (this.state.selectedUplinkSessionId === sessionId) {
        this.state.selectedUplinkSessionId = null;
      }
    });
  }

  async refreshDownlinkSessions() {
    return this.#guarded(async () => {
      this.state.downlinkSessions = await this.#request('/downlink-sessions');

      return this.state.downlinkSessions;
    });
  }

  async startDownlinkSessions(sessionIds) {
    return this.#guarded(async () => {
      const started = await this.#request('/downlink-sessions', {
        method: 'POST',
        body: JSON.stringify({ sessionIds })
      });

      await this.refreshDownlinkSessions();

      return started;
    });
  }

  /**
   * Opens a new downlink session from configured parameters. The proxy
   * returns the new session with its id already assigned.
   */
  async openDownlinkSession(parameters) {
    return this.#guarded(async () => {
      const started = await this.#request('/downlink-sessions', {
        method: 'POST',
        body: JSON.stringify({ parameters })
      });

      await this.refreshDownlinkSessions();

      return started;
    });
  }

  async stopDownlinkSession(sessionId) {
    return this.#guarded(async () => {
      await this.#request(sessionPath('downlink-sessions', sessionId), { method: 'DELETE' });
      this.state.downlinkSessions = this.state.downlinkSessions.filter(
        (session) => session.sessionId !== sessionId
      );
    });
  }

  async sendFlightSoftwareCommand({ sessionId, commandString, validate = false, target, timeout }) {
    return this.#guarded(async () => {
      const dispatch = await this.#request('/commands/flight-software', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          commandString,
          validate,
          ...(target === undefined ? {} : { target }),
          ...(timeout === undefined ? {} : { timeout })
        })
      });

      this.commandStatus.track(dispatch, { sessionId, requested: commandString, kind: 'fsw' });

      return dispatch;
    });
  }

  async sendHardwareCommand({ sessionId, commandStem, target, timeout }) {
    return this.#guarded(async () => {
      const dispatch = await this.#request('/commands/hardware', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          commandStem,
          ...(target === undefined ? {} : { target }),
          ...(timeout === undefined ? {} : { timeout })
        })
      });

      this.commandStatus.track(dispatch, { sessionId, requested: commandStem, kind: 'hw' });

      return dispatch;
    });
  }

  async sendSimulatorCommand({ sessionId, commandString, timeout }) {
    return this.#guarded(async () => {
      const dispatch = await this.#request('/commands/simulator', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          commandString,
          ...(timeout === undefined ? {} : { timeout })
        })
      });

      this.commandStatus.track(dispatch, { sessionId, requested: commandString, kind: 'sim' });

      return dispatch;
    });
  }

  async #guarded(action) {
    this.state.error = null;

    try {
      return await action();
    } catch (error) {
      this.state.error = error.message;
      throw error;
    }
  }

  async #request(path, options = {}) {
    let response;

    try {
      response = await fetch(`${this.apiBase}${path}`, {
        credentials: 'include',
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
    } catch (error) {
      throw new Error(`Request to ${path} failed: ${error.message}`);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');

      throw new Error(
        `Request to ${path} failed (${response.status})${detail ? `: ${detail}` : ''}`
      );
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }
}

let missionControlServiceInstance = null;

export default function getMissionControlService(openmct, apiBase) {
  if (!missionControlServiceInstance) {
    missionControlServiceInstance = new MissionControlService(openmct, apiBase);
  }

  return missionControlServiceInstance;
}
