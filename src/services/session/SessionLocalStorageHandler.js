define([

], function (

) {
    // Checks for availability of localstorage.  Taken from
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch(e) {
            return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage.length !== 0;
        }
    }

    var REALTIME_SESSION_KEY = 'vista_realtime_session';
    var HISTORICAL_SESSION_KEY = 'vista_historical_session';

    /**
     * Stores the current session in localStorage, and restores it on
     * application load only if no session is currently selected.  If
     * localstorage is not available (e.g. private browsing) then it will
     * do nothing.
     */
    function SessionLocalStorageHandler(sessionService) {
        if (!storageAvailable('localStorage')) {
            // Do nothing without localStorage.
            return;
        }

        this.sessionService = sessionService;

        sessionService.listen(this.storeRealtimeSession.bind(this));
        sessionService.listenForHistoricalChange(
            this.storeHistoricalSession.bind(this)
        );
        this.initializeFromStorage();
    }

    /**
     * If no session is currently selected, restore the last selected session
     * from localStorage (if it exists)
     */
    SessionLocalStorageHandler.prototype.initializeFromStorage = function () {
        if (this.sessionService.hasActiveTopicOrSession()) {
            return;
        }

        var realtimeSession = localStorage.getItem(REALTIME_SESSION_KEY);
        if (realtimeSession) {
            this.sessionService.setActiveTopicOrSession(JSON.parse(realtimeSession));
        }

        var historicalSessionJSON = localStorage.getItem(HISTORICAL_SESSION_KEY);

        if (historicalSessionJSON) {
            var historicalSession = JSON.parse(historicalSessionJSON);

            if (!historicalSession.numbers) {
                historicalSession.numbers = [historicalSession.number];
            }

            this.sessionService.setHistoricalSession(historicalSession);
        }
    };

    /**
     * store the realtime session in localStorage.
     */
    SessionLocalStorageHandler.prototype.storeRealtimeSession = function (realtimeSession) {
        if (realtimeSession) {
            localStorage.setItem(REALTIME_SESSION_KEY, JSON.stringify(realtimeSession));
        } else {
            localStorage.removeItem(REALTIME_SESSION_KEY);
        }
    };

    /**
     * store the historical session in localStorage.
     */
    SessionLocalStorageHandler.prototype.storeHistoricalSession = function (historicalSession) {
        if (historicalSession) {
            localStorage.setItem(HISTORICAL_SESSION_KEY, JSON.stringify(historicalSession));
        } else {
            localStorage.removeItem(HISTORICAL_SESSION_KEY);
        }
    };




    return SessionLocalStorageHandler;
});
