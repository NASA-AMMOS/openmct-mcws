export default function getVistaTime({ options, format }) {
  // Minimum wall-clock interval between ticks of any one LAD clock.
  // Telemetry dispatch is unaffected; only the conductor/indicator fan-out
  // slows down. Clocks always tick the newest seen value (trailing edge
  // arrives with the next message after the interval elapses).
  const MIN_TICK_INTERVAL_MS = 200;
  const lastTickByClock = {};

  function throttledTick(clockName, value) {
    const clock = options.ladClocks[clockName];

    if (!clock) {
      return;
    }

    const now = Date.now();

    if (now - (lastTickByClock[clockName] ?? -Infinity) < MIN_TICK_INTERVAL_MS) {
      return;
    }

    lastTickByClock[clockName] = now;
    clock.tick(value);
  }

  return {
    ladClocks: options.ladClocks,
    timeSystems: options.timeSystems,
    update: function (datum) {
      if (datum.ert) {
        throttledTick('ert', format.parse(datum.ert));
      } else if (datum.last_ert_time) {
        throttledTick('ert', format.parse(datum.last_ert_time));
      }
      if (datum.scet) {
        throttledTick('scet', format.parse(datum.scet));
      } else if (datum.last_scet_time) {
        throttledTick('scet', format.parse(datum.last_scet_time));
      }
      if (datum.sclk) {
        throttledTick('sclk', Number(datum.sclk));
      } else if (datum.last_sclk_time) {
        throttledTick('sclk', Number(datum.last_sclk_time));
      }
      // console.log('timeupdate!', datum);
      // TODO: Update timestamps based on received values.
    }
  };
}
