define([
    '../lib/extend',
    'EventEmitter',
    'lodash'
], function (
    extend,
    EventEmitter,
    _
) {

    function Clock() {
        this.value = 0;
        if (this.initialize) {
            this.initialize.apply(this, arguments);
        }
    }

    Clock.extend = extend;

    _.assignIn(Clock.prototype, EventEmitter.prototype);

    Clock.prototype.cssClass = 'icon-clock';

    Clock.prototype.currentValue = function () {
        return this.value;
    };

    Clock.prototype.tick = function (value) {
        if (value !== this.value) {
            this.value = value;
            this.emit('tick', value);
        }
    };

    return Clock;

});
