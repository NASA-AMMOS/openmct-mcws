import moment from 'moment';

class LMSTTimeSystem {
  constructor(openmct) {
    this.key = 'lmst';
    this.name = 'LMST';
    this.cssClass = 'icon-clock';
    this.timeFormat = 'lmst';
    this.durationFormat = 'duration';
    this.isUTCBased = false;

    this.openmct = openmct;
  }

  defaults() {
    const mode = this.openmct.time.getMode();
    if (mode === 'fixed') {
      const nowLST = this.solFormat.format(moment.utc());
      const sol = Number(/SOL-(\d+)M/.exec(nowLST)[1]);
      const start = this.solFormat.parse('SOL-' + sol);
      const end = this.solFormat.parse('SOL-' + (sol + 1));
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
  }
}

export default LMSTTimeSystem;
