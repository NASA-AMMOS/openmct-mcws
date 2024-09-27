import Clock from './Clock.js';

export default class UTCClock extends Clock {
  constructor() {
    super();

    this.key = 'utc.local';
    this.name = 'Local UTC';
    this.description = 'Ticks based on your local computer time.';
  }

  initialize() {
    this.generateTick();
    setInterval(this.generateTick.bind(this), 1000/30);
  }

  generateTick() {
    super.tick(Date.now());
  }
}
