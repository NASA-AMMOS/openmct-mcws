import flushInitialTableRows from './flushInitialTableRows.js';

describe('flushInitialTableRows', () => {
  let tableRows;
  let listeners;
  let flushSpy;
  let table;
  let cancelCurrent;

  function emitAdd() {
    (listeners.add || []).slice().forEach((callback) => callback());
  }

  function addRows(count, dummy = true) {
    for (let i = 0; i < count; i++) {
      tableRows.rows.push(dummy ? { isDummyRow: true } : {});
    }

    emitAdd();
  }

  function markAllWithData() {
    tableRows.rows.forEach((row) => {
      delete row.isDummyRow;
    });

    emitAdd();
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  beforeEach(() => {
    listeners = {};
    tableRows = {
      rows: [],
      getRows() {
        return this.rows;
      },
      on(event, callback) {
        listeners[event] = listeners[event] || [];
        listeners[event].push(callback);
      },
      off(event, callback) {
        listeners[event] = (listeners[event] || []).filter((fn) => fn !== callback);
      }
    };
    flushSpy = jasmine.createSpy('flush');
    table = {
      domainObject: {
        composition: [{}, {}, {}]
      },
      tableRows
    };
  });

  function start(options) {
    cancelCurrent = flushInitialTableRows({
      table,
      getTableComponent: () => ({
        throttledUpdateVisibleRows: {
          flush: flushSpy
        }
      }),
      timeout: 30,
      dataTimeout: 25,
      ...options
    });

    return cancelCurrent;
  }

  afterEach(() => {
    if (cancelCurrent) {
      cancelCurrent();
      cancelCurrent = null;
    }
  });

  it('flushes once all initial rows arrive', () => {
    start();
    addRows(2);

    expect(flushSpy).not.toHaveBeenCalled();

    addRows(1);

    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('flushes immediately when rows are already present', () => {
    tableRows.rows = [{}, {}, {}];

    start();

    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(listeners.add || []).toEqual([]);
  });

  it('flushes on timeout when rows never arrive', async () => {
    start({ timeout: 10 });
    await sleep(60);

    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('flushes again once initial data arrives, then unsubscribes', () => {
    start();
    addRows(3);

    expect(flushSpy).toHaveBeenCalledTimes(1);

    addRows(5);
    markAllWithData();

    expect(flushSpy).toHaveBeenCalledTimes(2);
    expect(listeners.add || []).toEqual([]);

    addRows(5);

    expect(flushSpy).toHaveBeenCalledTimes(2);
  });

  it('flushes partial data on data timeout', async () => {
    start({ dataTimeout: 15 });
    addRows(3);

    expect(flushSpy).toHaveBeenCalledTimes(1);

    delete tableRows.rows[0].isDummyRow;
    emitAdd();

    expect(flushSpy).toHaveBeenCalledTimes(1);

    await sleep(40);

    expect(flushSpy).toHaveBeenCalledTimes(2);
  });

  it('cleanup prevents a later flush', async () => {
    const cancel = start({ timeout: 10 });

    cancel();
    addRows(3);
    await sleep(60);

    expect(flushSpy).not.toHaveBeenCalled();
  });

  it('tolerates a missing component', () => {
    start({ getTableComponent: () => undefined });
    addRows(3);

    expect(flushSpy).not.toHaveBeenCalled();
  });

  it('tolerates a component without the throttled updater', () => {
    start({ getTableComponent: () => ({}) });
    addRows(3);

    expect(flushSpy).not.toHaveBeenCalled();
  });
});
