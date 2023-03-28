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
        return timestamp > (this.latestTimestamp + this.stalenessInterval);
    }

    resetTimestamp() {
        this.latestTimestamp = 0;
    }
}

export default GlobalStaleness;
