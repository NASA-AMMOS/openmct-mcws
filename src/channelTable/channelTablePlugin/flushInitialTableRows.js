/**
 * Render a channel table's initial rows and first data immediately instead of
 * waiting for the visible-rows throttle's trailing edges (~1s of blank table
 * on load, then ~1s of empty rows).
 *
 * The core table updates visible rows at most once per second. On load the
 * leading throttle call usually fires before rows arrive, so the full table
 * waits for the trailing call; data landing right after that waits out
 * another fresh window. Flushing the throttle once the initial rows are in,
 * and again once they all carry data, renders both right away; the 1Hz
 * throttle then applies normally.
 *
 * @param {object} args
 * @param {object} args.table The ChannelTable instance.
 * @param {Function} args.getTableComponent Returns the mounted core table component.
 * @param {number} [args.timeout=5000] Backstop delay before flushing regardless.
 * @param {number} [args.dataTimeout=2000] Backstop delay for the data flush.
 * @returns {Function} Cleanup for view teardown.
 */
export default function flushInitialTableRows({
  table,
  getTableComponent,
  timeout = 5000,
  dataTimeout = 2000
}) {
  const tableRows = table.tableRows;
  const composition = table.domainObject && table.domainObject.composition;
  const expectedRowCount = composition ? composition.length : 0;
  let rowsDone = false;
  let dataDone = false;
  let timer = null;

  function hasExpectedRows() {
    return tableRows.getRows().length >= expectedRowCount;
  }

  function hasAllData() {
    const rows = tableRows.getRows();

    return rows.length >= expectedRowCount && rows.every((row) => !row.isDummyRow);
  }

  function flush() {
    const component = getTableComponent && getTableComponent();

    if (component && component.throttledUpdateVisibleRows) {
      component.throttledUpdateVisibleRows.flush();
    }
  }

  function finishData() {
    if (dataDone) {
      return;
    }

    dataDone = true;
    tableRows.off('add', onRowsAdded);
    clearTimeout(timer);
    flush();
  }

  function finishRows() {
    rowsDone = true;
    clearTimeout(timer);

    if (hasAllData()) {
      finishData();
    } else {
      flush();
      timer = setTimeout(finishData, dataTimeout);
    }
  }

  function onRowsAdded() {
    if (!rowsDone && hasExpectedRows()) {
      finishRows();
    } else if (rowsDone && !dataDone && hasAllData()) {
      finishData();
    }
  }

  function onTimeout() {
    rowsDone = true;
    finishData();
  }

  function cancel() {
    rowsDone = true;
    dataDone = true;
    tableRows.off('add', onRowsAdded);
    clearTimeout(timer);
  }

  timer = setTimeout(onTimeout, timeout);

  if (hasExpectedRows()) {
    finishRows();
  } else {
    tableRows.on('add', onRowsAdded);
  }

  return cancel;
}
