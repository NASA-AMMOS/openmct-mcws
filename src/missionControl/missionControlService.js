import { reactive } from 'vue';

const DEFAULT_API_BASE = './api/v1';
const DEFAULT_COMMAND_TARGET = 'AB';
const DEFAULT_START_TIMEOUT = 30;

/**
 * Shared uplink/downlink session and commanding state for the mission
 * control plugins. Same-host proxy calls carry the OIDC session cookie.
 */
export class MissionControlService {
  constructor(openmct, apiBase = DEFAULT_API_BASE) {
    this.openmct = openmct;
    this.apiBase = apiBase;
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

    return (
      selected !== null && selected !== undefined && this.isSessionAttached(selected)
    );
  }

  selectUplinkSession(sessionId) {
    this.state.selectedUplinkSessionId = sessionId;
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
    const { defaultTarget = DEFAULT_COMMAND_TARGET, timeout = DEFAULT_START_TIMEOUT } =
      options;

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

  async stopUplinkSessions() {
    return this.#guarded(async () => {
      await this.#request('/command-sessions', { method: 'DELETE' });
      this.state.uplinkSessions = [];
      this.state.selectedUplinkSessionId = null;
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

  async stopDownlinkSessions() {
    return this.#guarded(async () => {
      await this.#request('/downlink-sessions', { method: 'DELETE' });
      this.state.downlinkSessions = [];
    });
  }

  async sendFlightSoftwareCommand({ sessionId, commandString, validate = false, target, timeout }) {
    return this.#guarded(async () => {
      return this.#request('/commands/flight-software', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          commandString,
          validate,
          ...(target === undefined ? {} : { target }),
          ...(timeout === undefined ? {} : { timeout })
        })
      });
    });
  }

  async sendHardwareCommand({ sessionId, commandStem, target, timeout }) {
    return this.#guarded(async () => {
      return this.#request('/commands/hardware', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          commandStem,
          ...(target === undefined ? {} : { target }),
          ...(timeout === undefined ? {} : { timeout })
        })
      });
    });
  }

  async sendSimulatorCommand({ sessionId, commandString, timeout }) {
    return this.#guarded(async () => {
      return this.#request('/commands/simulator', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          commandString,
          ...(timeout === undefined ? {} : { timeout })
        })
      });
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
