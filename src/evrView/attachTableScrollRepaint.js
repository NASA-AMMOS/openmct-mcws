const ATTACH_RETRY_DELAY = 50;
const ATTACH_MAX_ATTEMPTS = 20;

/**
 * Repaint a core telemetry table's visible rows while the user scrolls.
 *
 * The core table repaints visible rows at most once per second, so a rapid
 * scroll moves the viewport past the rendered 100-row window and leaves
 * blank lines until the throttled repaint lands. A mouse wheel cannot
 * outrun a faster repaint cadence, but a scrollbar drag can: the thumb
 * maps a short mouse move to a huge scroll jump, so any fixed repaint
 * interval trails the viewport by that interval's worth of travel.
 *
 * This therefore calls the component's own updateVisibleRows on every
 * scroll event, with no added throttle. That cannot stack repaints: the
 * method is guarded against re-entry while a repaint is pending, and it
 * schedules the row slice through renderWhenVisible
 * (requestAnimationFrame), computing it from the live scroll position
 * when the frame runs. Scroll repaints thus track the viewport at frame
 * rate, while data-driven repaints keep the core 1s cadence.
 *
 * Tolerates a table component that lacks the expected internals: the view
 * then simply keeps the core behaviour.
 *
 * @param {object} args
 * @param {Function} args.getTableComponent Returns the mounted core table component.
 * @returns {Function} Cleanup for view teardown.
 */
export default function attachTableScrollRepaint({ getTableComponent } = {}) {
  let scrollable = null;
  let retryTimer = null;
  let attempts = 0;
  let cancelled = false;

  function repaint() {
    const component = getTableComponent && getTableComponent();

    if (!cancelled && typeof component?.updateVisibleRows === 'function') {
      component.updateVisibleRows();
    }
  }

  function tryAttach() {
    const component = getTableComponent && getTableComponent();
    const element = component?.scrollable || component?.$refs?.scrollable;

    if (element && typeof element.addEventListener === 'function') {
      scrollable = element;
      scrollable.addEventListener('scroll', repaint, { passive: true });

      return;
    }

    attempts += 1;

    if (!cancelled && attempts < ATTACH_MAX_ATTEMPTS) {
      retryTimer = setTimeout(tryAttach, ATTACH_RETRY_DELAY);
    }
  }

  tryAttach();

  return function cancel() {
    cancelled = true;
    clearTimeout(retryTimer);

    if (scrollable) {
      scrollable.removeEventListener('scroll', repaint);
      scrollable = null;
    }
  };
}
