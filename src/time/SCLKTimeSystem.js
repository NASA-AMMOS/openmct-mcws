define([], function () {
  function SCLKTimeSystem() {
    this.key = 'sclk';
    this.name = 'SCLK as Float 64';
    this.cssClass = 'icon-clock';
    this.timeFormat = 'sclk.float64';
    this.durationFormat = 'number';
    this.isUTCBased = false;
  }

  return SCLKTimeSystem;
});
