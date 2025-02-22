define(['moment'], function (moment) {
  function MSLSolTimeSystem(openmct) {
    this.key = 'msl.sol';
    this.name = 'MSL Sol';
    this.cssClass = 'icon-clock';
    this.timeFormat = 'msl.sol';
    this.durationFormat = 'duration';
    this.isUTCBased = false;

    this.openmct = openmct;
  }

  MSLSolTimeSystem.prototype.defaults = function () {
    var mode = this.openmct.time.getMode();
    if (mode === 'fixed') {
      var nowLST = this.solFormat.format(moment.utc());
      var sol = Number(/SOL-(\d+)M/.exec(nowLST)[1]);
      var start = this.solFormat.parse('SOL-' + sol);
      var end = this.solFormat.parse('SOL-' + (sol + 1));
      return {
        bounds: {
          start: +start,
          end: +end
        },
        deltas: {
          start: 0,
          end: 0
        }
      };
    }

    throw new Error('Unknown mode: ' + mode);
  };

  return MSLSolTimeSystem;
});
