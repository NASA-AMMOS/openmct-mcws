import SessionService from '../session/SessionService.js';

class GlobalStaleness {
  constructor(stalenessInterval) {
    this.stalenessInterval = stalenessInterval;
    this.latestTimestamp = 0;

    this.updateLatestTimestamp = this.updateLatestTimestamp.bind(this);
    this.isStale = this.isStale.bind(this);
    this.resetTimestamp = this.resetTimestamp.bind(this);
  }

  updateLatestTimestamp(timestamp) {
    this.latestTimestamp = timestamp;
  }

  isStale(timestamp) {
    return timestamp > this.latestTimestamp + this.stalenessInterval;
  }

  resetTimestamp() {
    this.latestTimestamp = 0;
  }
}

let globalStalenessInstance = null;

export default function (openmct, stalenessInterval) {
  if (stalenessInterval) {
    globalStalenessInstance = new GlobalStaleness(stalenessInterval);

    openmct.on('start', () => {
      const sessionService = SessionService();
      sessionService.listen((session) => {
        if (!session) {
          globalStalenessInstance.resetTimestamp();
        }
      });
    });
  }

  return globalStalenessInstance;
}
