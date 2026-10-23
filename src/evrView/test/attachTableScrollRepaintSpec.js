import attachTableScrollRepaint from '../attachTableScrollRepaint.js';

describe('attachTableScrollRepaint', () => {
  let scrollable;
  let updateVisibleRows;
  let component;
  let cancelCurrent;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  beforeEach(() => {
    const listeners = new Set();
    scrollable = {
      listeners,
      addEventListener(type, callback) {
        if (type === 'scroll') {
          listeners.add(callback);
        }
      },
      removeEventListener(type, callback) {
        if (type === 'scroll') {
          listeners.delete(callback);
        }
      },
      emitScroll() {
        [...listeners].forEach((callback) => callback());
      }
    };
    updateVisibleRows = jasmine.createSpy('updateVisibleRows');
    component = {
      scrollable,
      updateVisibleRows
    };
  });

  function start(options) {
    cancelCurrent = attachTableScrollRepaint({
      getTableComponent: () => component,
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

  it('repaints immediately on scroll', () => {
    start();
    scrollable.emitScroll();

    expect(updateVisibleRows).toHaveBeenCalledTimes(1);
  });

  it('forwards every scroll so repaints track a scrollbar drag at frame rate', () => {
    start();
    scrollable.emitScroll();
    scrollable.emitScroll();
    scrollable.emitScroll();

    // No plugin-side throttle: coalescing is the component's job (its
    // re-entry guard plus requestAnimationFrame), so a fast drag is never
    // left waiting on a plugin interval.
    expect(updateVisibleRows).toHaveBeenCalledTimes(3);
  });

  it('falls back to the component $refs scrollable element', () => {
    component = {
      $refs: { scrollable },
      updateVisibleRows
    };

    start();
    scrollable.emitScroll();

    expect(updateVisibleRows).toHaveBeenCalledTimes(1);
  });

  it('cancel removes the listener and stops further repaints', async () => {
    const cancel = start();
    scrollable.emitScroll();
    scrollable.emitScroll();

    cancel();
    cancelCurrent = null;
    scrollable.emitScroll();
    await sleep(50);

    expect(updateVisibleRows).toHaveBeenCalledTimes(2);
    expect(scrollable.listeners.size).toBe(0);
  });

  it('tolerates a missing component', () => {
    expect(() => start({ getTableComponent: () => undefined })).not.toThrow();
  });

  it('tolerates a component without updateVisibleRows', () => {
    component = { scrollable };

    expect(() => start()).not.toThrow();
    expect(() => scrollable.emitScroll()).not.toThrow();
  });

  it('tolerates a component without a scrollable element', () => {
    component = { updateVisibleRows };

    expect(() => start()).not.toThrow();
  });
});
