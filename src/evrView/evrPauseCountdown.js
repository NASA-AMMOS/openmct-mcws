/**
 * Countdown behind the EVR view's auto-resume pause (#506).
 *
 * A vista.evrView may persist `configuration.pauseTimerSeconds`. When the
 * table pauses (rows marked, or the Pause button) and that setting holds a
 * usable value, this countdown runs; at zero the view resumes as if Play
 * were pressed. Absent/invalid values mean no countdown, which preserves
 * the historical pause-until-Play behaviour.
 */

export function formatPauseCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, '0');

  return `${minutes}:${remainder}`;
}

/**
 * Observe the view's Pause Timer setting.
 *
 * The setting is persisted through TelemetryTableConfiguration, which
 * mutates the whole 'configuration' object. Core emits mutation events
 * for the mutated path and its parents, never for child paths, so this
 * must observe 'configuration' and extract the timer; observing
 * 'configuration.pauseTimerSeconds' would never fire. Changes that leave
 * the timer value untouched (e.g. column toggles mutating the same
 * object) are ignored.
 */
export function observePauseTimerSeconds(openmct, domainObject, onChange) {
  let currentSeconds = normalizePauseTimerSeconds(domainObject.configuration?.pauseTimerSeconds);

  return openmct.objects.observe(domainObject, 'configuration', (configuration) => {
    const newSeconds = normalizePauseTimerSeconds(configuration?.pauseTimerSeconds);

    if (newSeconds === currentSeconds) {
      return;
    }

    currentSeconds = newSeconds;
    onChange(newSeconds);
  });
}

export function normalizePauseTimerSeconds(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return Math.floor(seconds);
}

export default function createEvrPauseCountdown({ onTick, onExpire } = {}) {
  let intervalId = null;
  let configuredSeconds = null;
  let remainingSeconds = null;

  function stopInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function tick() {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      stopInterval();
      remainingSeconds = null;
      onExpire?.();
    } else {
      onTick?.(remainingSeconds);
    }
  }

  return {
    start(seconds) {
      const normalized = normalizePauseTimerSeconds(seconds);

      if (normalized === null) {
        return false;
      }

      stopInterval();
      configuredSeconds = normalized;
      remainingSeconds = normalized;
      onTick?.(remainingSeconds);
      intervalId = setInterval(tick, 1000);

      return true;
    },
    reset() {
      if (configuredSeconds === null) {
        return false;
      }

      return this.start(configuredSeconds);
    },
    dismiss() {
      stopInterval();
      remainingSeconds = null;
    },
    isRunning() {
      return intervalId !== null;
    },
    getRemainingSeconds() {
      return remainingSeconds;
    },
    destroy() {
      stopInterval();
      configuredSeconds = null;
      remainingSeconds = null;
    }
  };
}
