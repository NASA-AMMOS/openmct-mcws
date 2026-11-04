import getVistaTime from './vistaTime.js';

describe('vistaTime clock throttling', () => {
  let clocks;
  let vistaTime;

  const format = {
    parse: Number
  };

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1792000000000));

    clocks = {
      ert: { tick: jasmine.createSpy('ertTick') },
      scet: { tick: jasmine.createSpy('scetTick') },
      sclk: { tick: jasmine.createSpy('sclkTick') }
    };

    vistaTime = getVistaTime({
      options: { ladClocks: clocks, timeSystems: {} },
      format
    });
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('ticks immediately on the first update', () => {
    vistaTime.update({ ert: '1000', scet: '2000', sclk: '3000' });

    expect(clocks.ert.tick).toHaveBeenCalledTimes(1);
    expect(clocks.ert.tick).toHaveBeenCalledWith(1000);
    expect(clocks.scet.tick).toHaveBeenCalledWith(2000);
    expect(clocks.sclk.tick).toHaveBeenCalledWith(3000);
  });

  it('suppresses ticks within the throttle interval', () => {
    vistaTime.update({ ert: '1000' });
    jasmine.clock().tick(50);
    vistaTime.update({ ert: '1001' });
    jasmine.clock().tick(50);
    vistaTime.update({ ert: '1002' });

    expect(clocks.ert.tick).toHaveBeenCalledTimes(1);
  });

  it('ticks the newest value once the interval elapses', () => {
    vistaTime.update({ ert: '1000' });
    jasmine.clock().tick(50);
    vistaTime.update({ ert: '1001' });
    jasmine.clock().tick(200);
    vistaTime.update({ ert: '1002' });

    expect(clocks.ert.tick).toHaveBeenCalledTimes(2);
    expect(clocks.ert.tick).toHaveBeenCalledWith(1002);
  });

  it('throttles each clock independently', () => {
    vistaTime.update({ ert: '1000' });
    jasmine.clock().tick(50);
    vistaTime.update({ scet: '2000' });

    expect(clocks.ert.tick).toHaveBeenCalledTimes(1);
    expect(clocks.scet.tick).toHaveBeenCalledTimes(1);
  });

  it('falls back to last_*_time fields and tolerates missing clocks', () => {
    const partialTime = getVistaTime({
      options: { ladClocks: { ert: clocks.ert }, timeSystems: {} },
      format
    });

    expect(() => {
      partialTime.update({ last_ert_time: '5000' });
      partialTime.update({ scet: '2000' });
      partialTime.update({});
    }).not.toThrow();

    expect(clocks.ert.tick).toHaveBeenCalledWith(5000);
  });
});
