import ChannelRow from './ChannelRow.vue';
import mount from 'ommUtils/mountVueComponent.js';
import { nextTick } from 'vue';

describe('ChannelRow pause', () => {
  let element;
  let destroyFn = null;
  let rootInstance = null;
  let collectionHandlers;

  function mockOpenmct() {
    collectionHandlers = {};

    return {
      objects: {
        makeKeyString: () => 'test-key'
      },
      telemetry: {
        getMetadata: () => ({
          valuesForHints: () => [{ key: 'value' }]
        }),
        getFormatMap: () => ({
          value: {
            format: () => 'FMT'
          },
          scet: {
            parse: () => 1
          }
        }),
        limitEvaluator: () => ({
          evaluate: () => null
        }),
        requestCollection: () => ({
          on(event, callback) {
            collectionHandlers[event] = callback;
          },
          off() {},
          load() {},
          destroy() {}
        })
      },
      time: {
        on() {},
        off() {},
        getTimeSystem: () => ({ key: 'scet' })
      }
    };
  }

  function mountRow(paused, marked = false) {
    element = document.createElement('div');
    const { componentInstance, destroy } = mount(
      {
        provide: {
          openmct: mockOpenmct(),
          currentView: {}
        },
        components: {
          ChannelRow
        },
        data: () => ({
          testObject: {
            name: 'CH1 - Title',
            identifier: { namespace: 'test', key: 'ch1' }
          },
          pausedFlag: paused,
          markedFlag: marked,
          emitted: []
        }),
        methods: {
          onMark(...args) {
            this.emitted.push(['mark', ...args]);
          },
          onUnmark(...args) {
            this.emitted.push(['unmark', ...args]);
          },
          onMarkMultiple(...args) {
            this.emitted.push(['mark-multiple-concurrent', ...args]);
          }
        },
        template:
          '<ChannelRow ref="row" :domain-object="testObject" :path-to-table="[]" :paused="pausedFlag" :marked="markedFlag" @mark="onMark" @unmark="onUnmark" @mark-multiple-concurrent="onMarkMultiple" />'
      },
      {
        element
      }
    );
    destroyFn = destroy;
    rootInstance = componentInstance;
  }

  function row() {
    return rootInstance.$refs.row;
  }

  afterEach(() => {
    destroyFn?.();
    destroyFn = null;
    rootInstance = null;
  });

  it('updates the view for data while not paused', () => {
    mountRow(false);
    row().updateView = jasmine.createSpy('updateView');

    collectionHandlers.add([{ value: 1 }]);

    expect(row().updateView).toHaveBeenCalledTimes(1);
    expect(row().latestDatum).toEqual({ value: 1 });
  });

  it('skips view updates while paused but keeps the latest datum', (done) => {
    mountRow(false);
    row().updateView = jasmine.createSpy('updateView');

    rootInstance.pausedFlag = true;
    nextTick(() => {
      collectionHandlers.add([{ value: 2 }]);

      expect(row().updateView).not.toHaveBeenCalled();
      expect(row().latestDatum).toEqual({ value: 2 });
      done();
    });
  });

  it('flushes the latest datum on unpause', (done) => {
    mountRow(true);
    row().updateView = jasmine.createSpy('updateView');

    collectionHandlers.add([{ value: 7 }]);
    expect(row().updateView).not.toHaveBeenCalled();

    rootInstance.pausedFlag = false;
    nextTick(() => {
      expect(row().updateView).toHaveBeenCalledTimes(1);
      expect(row().latestDatum).toEqual({ value: 7 });
      done();
    });
  });

  it('does not flush on unpause when no data arrived yet', (done) => {
    mountRow(true);
    row().updateView = jasmine.createSpy('updateView');

    rootInstance.pausedFlag = false;
    nextTick(() => {
      expect(row().updateView).not.toHaveBeenCalled();
      done();
    });
  });

  it('emits mark without modifier on row click', () => {
    mountRow(false);

    row().$el.click();

    expect(rootInstance.emitted).toEqual([['mark', 'test-key', false]]);
  });

  it('emits mark with modifier on ctrl-click', () => {
    mountRow(false);

    row().$el.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));

    expect(rootInstance.emitted).toEqual([['mark', 'test-key', true]]);
  });

  it('emits unmark when the marked row is clicked', () => {
    mountRow(true, true);

    row().$el.click();

    expect(rootInstance.emitted).toEqual([['unmark', 'test-key']]);
  });

  it('emits mark-multiple-concurrent on shift-click', () => {
    mountRow(false);

    row().$el.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));

    expect(rootInstance.emitted).toEqual([['mark-multiple-concurrent', 'test-key']]);
  });

  it('prefers range-mark over unmark on shift-click of a marked row', () => {
    mountRow(true, true);

    row().$el.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));

    expect(rootInstance.emitted).toEqual([['mark-multiple-concurrent', 'test-key']]);
  });

  it('highlights the row only while marked', (done) => {
    mountRow(false);

    expect(row().$el.classList.contains('is-selected')).toBe(false);

    rootInstance.markedFlag = true;
    nextTick(() => {
      expect(row().$el.classList.contains('is-selected')).toBe(true);
      done();
    });
  });
});
