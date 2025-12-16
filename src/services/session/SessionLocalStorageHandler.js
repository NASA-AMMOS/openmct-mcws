// Checks for availability of localstorage.  Taken from
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
function storageAvailable(type) {
  let storage;

  try {
    storage = window[type];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

const REALTIME_SESSION_KEY = 'vista_realtime_session';
const HISTORICAL_SESSION_KEY = 'vista_historical_session';

/**
 * Stores the current session in localStorage, and restores it on
 * application load only if no session is currently selected.  If
 * localstorage is not available (e.g. private browsing) then it will
 * do nothing.
 */
class SessionLocalStorageHandler {
  constructor(sessionService) {
    if (!storageAvailable('localStorage')) {
      // Do nothing without localStorage.
      return;
    }

    this.sessionService = sessionService;

    sessionService.listen(this.storeRealtimeSession);
    sessionService.listenForHistoricalChange(this.storeHistoricalSessionFilter);
    this.initializeFromStorage();
  }

  /**
   * If no session is currently selected, restore the last selected session
   * from localStorage (if it exists)
   */
  initializeFromStorage() {
    if (!this.sessionService.hasActiveTopicOrSession()) {
      const realtimeSession = localStorage.getItem(REALTIME_SESSION_KEY);

      if (realtimeSession) {
        this.sessionService.setActiveTopicOrSession(JSON.parse(realtimeSession));
      }
    }

    if (!this.sessionService.hasHistoricalSessionFilter()) {
      const sessionFilterJSON = localStorage.getItem(HISTORICAL_SESSION_KEY);

      if (sessionFilterJSON) {
        const sessionFilter = JSON.parse(sessionFilterJSON);

        if (!sessionFilter.numbers) {
          sessionFilter.numbers = [sessionFilter.number];
        }

        this.sessionService.setHistoricalSessionFilter(sessionFilter);
      }
    }
  }

  /**
   * store the realtime session in localStorage.
   */
  storeRealtimeSession = (realtimeSession) => {
    if (realtimeSession) {
      localStorage.setItem(REALTIME_SESSION_KEY, JSON.stringify(realtimeSession));
    } else {
      localStorage.removeItem(REALTIME_SESSION_KEY);
    }
  };

  /**
   * store the historical session filter in localStorage.
   */
  storeHistoricalSessionFilter = (sessionFilter) => {
    if (sessionFilter) {
      localStorage.setItem(HISTORICAL_SESSION_KEY, JSON.stringify(sessionFilter));
    } else {
      localStorage.removeItem(HISTORICAL_SESSION_KEY);
    }
  };
}

export default SessionLocalStorageHandler;
