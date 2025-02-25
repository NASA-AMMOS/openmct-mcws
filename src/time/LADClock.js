import Clock from './Clock.js';

export default class LADClock extends Clock {
  initialize(source) {
    this.description = `Ticks based on the latest ${source} value received from the server.`;
    this.key = `${source}.lad`;
    this.name = `Latest ${source}`;
  }
}
