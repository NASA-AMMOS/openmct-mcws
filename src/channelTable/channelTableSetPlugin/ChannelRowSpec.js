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

  function mountRow(paused) {
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
          pausedFlag: paused
        }),
        template:
          '<ChannelRow ref="row" :domain-object="testObject" :path-to-table="[]" :paused="pausedFlag" />'
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
});
