import { EventEmitter } from 'eventemitter3';

export default class Clock extends EventEmitter {
  constructor() {
    super();

    this.value = 0;
    this.cssClass = 'icon-clock';

    if (this.initialize) {
      this.initialize.apply(this, arguments);
    }
  }

  currentValue() {
    return this.value;
  }

  tick(value) {
    if (value !== this.value) {
      this.value = value;
      this.emit('tick', value);
    }
  }
}
