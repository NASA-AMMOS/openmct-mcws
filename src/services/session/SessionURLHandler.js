export default class SessionURLHandler {
  constructor(sessionService, openmct) {
    this.sessionService = sessionService;
    this.openmct = openmct;
    this.params = {};

    openmct.router.on('change:params', this.updateSession.bind(this));

    sessionService.listen(this.updateURLFromRealtimeSession.bind(this));
    sessionService.listenForHistoricalChange(this.updateURLFromHistoricalSessionFilter.bind(this));

    this.didSessionParamsChange = this.didSessionParamsChange.bind(this);

    this.updateSession();
  }

  getParams() {
    return {
      historical: {
        numbers: this.openmct.router.getSearchParam('v_hsi'),
        host: this.openmct.router.getSearchParam('v_hsh')
      },
      realtime: {
        topic: this.openmct.router.getSearchParam('v_rt'),
        number: this.openmct.router.getSearchParam('v_rsi'),
        fsw_version: this.openmct.router.getSearchParam('v_rfsw')
      }
    };
  }

  updateSession() {
    const params = this.getParams();

    if (!this.didSessionParamsChange(params)) {
      return;
    }

    if (params.historical.numbers && params.historical.host) {
      const historicalSessionFilter = this.sessionService.getHistoricalSessionFilter();

      if (
        !historicalSessionFilter ||
        historicalSessionFilter.numbers.join(',') !== params.historical.numbers ||
        historicalSessionFilter.host !== params.historical.host
      ) {
        params.historical.numbers = params.historical.numbers.split(',');
        this.sessionService.setHistoricalSessionFilter(params.historical);
      }
    }

    if (params.realtime.topic) {
      var realtimeSession = this.sessionService.getActiveTopicOrSession();

      if (
        !realtimeSession ||
        realtimeSession.topic !== params.realtime.topic ||
        (realtimeSession.number && realtimeSession.number !== params.realtime.number)
      ) {
        this.sessionService.setActiveTopicOrSession(params.realtime);
      }
    }

    this.params = params;
    this.updateAfterNavigation();
  }

  updateAfterNavigation() {
    const params = this.getParams();
    const historicalSessionFilter = this.sessionService.getHistoricalSessionFilter();
    const realtimeSession = this.sessionService.getActiveTopicOrSession();

    if (
      historicalSessionFilter &&
      (historicalSessionFilter.numbers.join(',') !== params.historical.numbers ||
        historicalSessionFilter.host !== params.historical.host)
    ) {
      this.updateURLFromHistoricalSessionFilter(historicalSessionFilter);
    }
    if (
      realtimeSession &&
      (realtimeSession.topic !== params.realtime.topic ||
        realtimeSession.number !== params.realtime.number ||
        realtimeSession.fsw_version !== params.realtime.fsw_version)
    ) {
      this.updateURLFromRealtimeSession(realtimeSession);
    }
  }

  didSessionParamsChange(params) {
    let newParamsString = JSON.stringify(params);
    let oldParamsString = JSON.stringify(this.params);

    return newParamsString !== oldParamsString;
  }

  updateURLFromRealtimeSession(realtimeSession) {
    if (realtimeSession) {
      this.openmct.router.setSearchParam('v_rt', realtimeSession.topic);
      this.openmct.router.setSearchParam('v_rfsw', realtimeSession.fsw_version);
      if (realtimeSession.number) {
        this.openmct.router.setSearchParam('v_rsi', realtimeSession.number);
      }
    } else {
      this.openmct.router.deleteSearchParam('v_rt');
      this.openmct.router.deleteSearchParam('v_rsi');
      this.openmct.router.deleteSearchParam('v_rfsw');
    }
  }

  updateURLFromHistoricalSessionFilter(sessionFilter) {
    if (sessionFilter) {
      this.openmct.router.setSearchParam('v_hsi', sessionFilter.numbers.join(','));
      this.openmct.router.setSearchParam('v_hsh', sessionFilter.host);
    } else {
      this.openmct.router.deleteSearchParam('v_hsi');
      this.openmct.router.deleteSearchParam('v_hsh');
    }
  }
}
