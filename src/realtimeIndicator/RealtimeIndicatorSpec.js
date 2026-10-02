import RealtimeIndicator from './RealtimeIndicator.vue';
import getGlobalStaleness from 'services/globalStaleness/globalStaleness.js';
import mount from 'ommUtils/mountVueComponent.js';
import { nextTick } from 'vue';

function getText(el) {
  return el.querySelector('.label.c-indicator__label').innerText.trim();
}

describe('RealtimeIndicator', () => {
  let element;
  let destroyFn = null;
  let rootInstance = null;
  let tracker;
  const format = {
    format: () => 'FORMATTED'
  };

  function mountIndicator() {
    element = document.createElement('div');
    // Note: no vistaTime provided. The indicator tracks message arrival
    // directly and must work in every time mode (see issue 353).
    const { componentInstance, destroy } = mount(
      {
        provide: {
          openmct: {},
          format
        },
        components: {
          RealtimeIndicator
        },
        template: '<RealtimeIndicator ref="indicator" />'
      },
      {
        element
      }
    );
    destroyFn = destroy;
    rootInstance = componentInstance;
  }

  function indicator() {
    return rootInstance.$refs.indicator;
  }

  beforeEach(() => {
    tracker = getGlobalStaleness();
    tracker.resetTimestamp();
    mountIndicator();
  });

  afterEach(() => {
    destroyFn?.();
    destroyFn = null;
    rootInstance = null;
    tracker.resetTimestamp();
  });

  it('initially reports never', () => {
    expect(getText(element)).toBe('Last real-time display update: never');
  });

  it('shows the last message arrival time on refresh', (done) => {
    tracker.updateLatestTimestamp(Date.now());
    indicator().refresh();
    nextTick(() => {
      expect(getText(element)).toBe('Last real-time display update: FORMATTED');
      done();
    });
  });

  it('warns when messages arrive faster than 10hz', (done) => {
    const start = Date.now();
    tracker.updateLatestTimestamp(start);
    indicator().refresh();
    tracker.updateLatestTimestamp(start + 50);
    indicator().refresh();
    nextTick(() => {
      expect(getText(element)).toBe(
        'Data Rate is higher than 10hz, display may update less than once per second'
      );
      done();
    });
  });

  it('keeps the last update when no new messages arrive', (done) => {
    tracker.updateLatestTimestamp(Date.now());
    indicator().refresh();
    indicator().refresh();
    indicator().refresh();
    nextTick(() => {
      expect(getText(element)).toBe('Last real-time display update: FORMATTED');
      done();
    });
  });

  it('polls on an interval and clears it on destroy', () => {
    spyOn(window, 'clearInterval').and.callThrough();
    destroyFn();
    destroyFn = null;

    expect(window.clearInterval).toHaveBeenCalled();
  });
});
