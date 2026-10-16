/**
 * Render a channel table's initial rows immediately instead of waiting for
 * the visible-rows throttle's trailing edge (~1s of blank table on load).
 *
 * The core table updates visible rows at most once per second. On load the
 * leading throttle call usually fires before rows arrive, so the full table
 * waits for the trailing call. Flushing the throttle once the initial rows
 * are in renders them right away; the 1Hz throttle then applies normally.
 *
 * @param {object} args
 * @param {object} args.table The ChannelTable instance.
 * @param {Function} args.getTableComponent Returns the mounted core table component.
 * @param {number} [args.timeout=5000] Backstop delay before flushing regardless.
 * @returns {Function} Cleanup for view teardown.
 */
export default function flushInitialTableRows({ table, getTableComponent, timeout = 5000 }) {
  const tableRows = table.tableRows;
  const composition = table.domainObject && table.domainObject.composition;
  const expectedRowCount = composition ? composition.length : 0;
  let finished = false;
  let timer = null;

  function onRowsAdded() {
    if (tableRows.getRows().length >= expectedRowCount) {
      finish();
    }
  }

  function finish() {
    if (finished) {
      return;
    }

    finished = true;
    tableRows.off('add', onRowsAdded);
    clearTimeout(timer);

    const component = getTableComponent && getTableComponent();

    if (component && component.throttledUpdateVisibleRows) {
      component.throttledUpdateVisibleRows.flush();
    }
  }

  function cancel() {
    finished = true;
    tableRows.off('add', onRowsAdded);
    clearTimeout(timer);
  }

  timer = setTimeout(finish, timeout);

  if (tableRows.getRows().length >= expectedRowCount) {
    finish();
  } else {
    tableRows.on('add', onRowsAdded);
  }

  return cancel;
}
