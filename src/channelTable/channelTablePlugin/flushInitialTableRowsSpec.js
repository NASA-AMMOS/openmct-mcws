import flushInitialTableRows from './flushInitialTableRows.js';

describe('flushInitialTableRows', () => {
  let tableRows;
  let listeners;
  let flushSpy;
  let table;

  function emitAdd() {
    (listeners.add || []).slice().forEach((callback) => callback());
  }

  function addRows(count) {
    for (let i = 0; i < count; i++) {
      tableRows.rows.push({});
    }

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
    return flushInitialTableRows({
      table,
      getTableComponent: () => ({
        throttledUpdateVisibleRows: {
          flush: flushSpy
        }
      }),
      timeout: 30,
      ...options
    });
  }

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

  it('flushes only once and unsubscribes', () => {
    start();
    addRows(3);
    addRows(5);

    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(listeners.add || []).toEqual([]);
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
