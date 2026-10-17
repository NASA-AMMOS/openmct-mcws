import ChannelTableSet from './ChannelTableSet.vue';
import ChannelTableSetViewActions from './ChannelTableSetViewActions.js';
import mount from 'ommUtils/mountVueComponent.js';
import { nextTick } from 'vue';

describe('ChannelTableSet pause', () => {
  let element;
  let destroyFn = null;
  let rootInstance = null;
  let actionCollection;

  function mockOpenmct() {
    actionCollection = {
      hide: jasmine.createSpy('hide'),
      show: jasmine.createSpy('show'),
      enable: jasmine.createSpy('enable'),
      disable: jasmine.createSpy('disable')
    };

    return {
      actions: {
        getActionsCollection: () => actionCollection
      },
      composition: {
        get: () => ({
          on() {},
          off() {},
          load() {}
        })
      },
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
          on() {},
          off() {},
          load() {},
          destroy() {}
        })
      },
      time: {
        on() {},
        off() {},
        getTimeSystem: () => ({ key: 'scet', name: 'SCET' })
      }
    };
  }

  function mountSet() {
    element = document.createElement('div');
    const { componentInstance, destroy } = mount(
      {
        provide: {
          openmct: mockOpenmct(),
          objectPath: [],
          currentView: {}
        },
        components: {
          ChannelTableSet
        },
        data: () => ({
          testObject: { name: 'Test Set' }
        }),
        template: '<ChannelTableSet ref="set" :domain-object="testObject" />'
      },
      {
        element
      }
    );
    destroyFn = destroy;
    rootInstance = componentInstance;
  }

  function set() {
    return rootInstance.$refs.set;
  }

  beforeEach(() => {
    mountSet();
  });

  afterEach(() => {
    destroyFn?.();
    destroyFn = null;
    rootInstance = null;
  });

  it('exposes a channel-table-set view context with togglePauseByButton', () => {
    const context = set().getViewContext();

    expect(context.type).toBe('channel-table-set');
    expect(typeof context.togglePauseByButton).toBe('function');
  });

  it('toggles paused through the view context', () => {
    const context = set().getViewContext();

    expect(set().paused).toBe(false);
    context.togglePauseByButton();
    expect(set().paused).toBe(true);
    context.togglePauseByButton();
    expect(set().paused).toBe(false);
  });

  it('scopes pause and play actions to the set view context', () => {
    expect(ChannelTableSetViewActions.length).toBe(5);

    const setView = { getViewContext: () => set().getViewContext() };
    const tableView = { getViewContext: () => ({ type: 'telemetry-table' }) };

    ChannelTableSetViewActions.forEach((action) => {
      expect(action.appliesTo([], setView)).toBe(true);
      expect(action.appliesTo([], {})).toBe(false);
      expect(action.appliesTo([], tableView)).toBe(false);
    });
  });

  it('shows only Pause until paused, then only Play', (done) => {
    nextTick(() => {
      expect(actionCollection.hide).toHaveBeenCalledWith(['play-channel-table-set']);
      expect(actionCollection.show).toHaveBeenCalledWith(['pause-channel-table-set']);

      actionCollection.hide.calls.reset();
      actionCollection.show.calls.reset();

      set().togglePauseByButton();
      nextTick(() => {
        expect(actionCollection.hide).toHaveBeenCalledWith(['pause-channel-table-set']);
        expect(actionCollection.show).toHaveBeenCalledWith(['play-channel-table-set']);

        actionCollection.hide.calls.reset();
        actionCollection.show.calls.reset();

        set().togglePauseByButton();
        nextTick(() => {
          expect(actionCollection.hide).toHaveBeenCalledWith(['play-channel-table-set']);
          expect(actionCollection.show).toHaveBeenCalledWith(['pause-channel-table-set']);
          done();
        });
      });
    });
  });

  it('marks a row and pauses, replacing the previous mark without modifier', () => {
    set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
    set().ladTelemetryObjects = {
      table1: [
        { key: 'ch1', domainObject: { name: 'CH1' } },
        { key: 'ch2', domainObject: { name: 'CH2' } }
      ]
    };

    set().markRow('ch1', false);

    expect(set().paused).toBe(true);
    expect(set().markedRows.map((row) => row.key)).toEqual(['ch1']);
    expect(set().isMarked('ch1')).toBe(true);

    set().markRow('ch2', false);

    expect(set().markedRows.map((row) => row.key)).toEqual(['ch2']);
    expect(set().isMarked('ch1')).toBe(false);
  });

  it('adds marks with the modifier key and unpauses when the last mark clears', () => {
    set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
    set().ladTelemetryObjects = {
      table1: [
        { key: 'ch1', domainObject: { name: 'CH1' } },
        { key: 'ch2', domainObject: { name: 'CH2' } }
      ]
    };

    set().markRow('ch1', false);
    set().markRow('ch2', true);

    expect(set().markedRows.map((row) => row.key)).toEqual(['ch1', 'ch2']);

    set().unmarkRow('ch1');

    expect(set().paused).toBe(true);
    expect(set().markedRows.map((row) => row.key)).toEqual(['ch2']);

    set().unmarkRow('ch2');

    expect(set().paused).toBe(false);
    expect(set().markedRows.length).toBe(0);
  });

  it('clears marks on play and on unmark-all', () => {
    set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
    set().ladTelemetryObjects = {
      table1: [{ key: 'ch1', domainObject: { name: 'CH1' } }]
    };

    set().markRow('ch1', false);
    set().togglePauseByButton();

    expect(set().paused).toBe(false);
    expect(set().markedRows.length).toBe(0);

    set().markRow('ch1', false);
    set().getViewContext().unmarkAllRows();

    expect(set().paused).toBe(false);
    expect(set().markedRows.length).toBe(0);
  });

  it('enables mark actions only while rows are marked', (done) => {
    nextTick(() => {
      expect(actionCollection.disable).toHaveBeenCalledWith([
        'channel-table-set-unmark-all',
        'channel-table-set-export-marked'
      ]);

      set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
      set().ladTelemetryObjects = {
        table1: [{ key: 'ch1', domainObject: { name: 'CH1' } }]
      };
      set().markRow('ch1', false);

      nextTick(() => {
        expect(actionCollection.enable).toHaveBeenCalledWith([
          'channel-table-set-unmark-all',
          'channel-table-set-export-marked'
        ]);
        done();
      });
    });
  });

  it('exports all and marked rows as CSV', () => {
    set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
    set().ladTelemetryObjects = {
      table1: [
        { key: 'ch1', domainObject: { name: 'CH1' } },
        { key: 'ch2', domainObject: { name: 'CH2' } }
      ]
    };
    set().rowRefs = {
      ch1: { id: 'CH1', name: 'Title 1', value: '5', formattedTimestamp: 't1' },
      ch2: { id: 'CH2', name: 'Title 2', value: '6', formattedTimestamp: 't2' }
    };
    set().csvExporter = { export: jasmine.createSpy('export') };

    set().exportAllDataAsCSV();

    expect(set().csvExporter.export).toHaveBeenCalledWith(
      [
        { ID: 'CH1', Title: 'Title 1', Value: '5', SCET: 't1' },
        { ID: 'CH2', Title: 'Title 2', Value: '6', SCET: 't2' }
      ],
      { filename: 'Test Set.csv', headers: ['ID', 'Title', 'Value', 'SCET'] }
    );

    set().markRow('ch2', false);
    set().exportMarkedDataAsCSV();

    expect(set().csvExporter.export).toHaveBeenCalledWith(
      [{ ID: 'CH2', Title: 'Title 2', Value: '6', SCET: 't2' }],
      { filename: 'Test Set.csv', headers: ['ID', 'Title', 'Value', 'SCET'] }
    );
  });

  it('pauses and plays through the registered actions', () => {
    const pause = ChannelTableSetViewActions.find(
      (action) => action.key === 'pause-channel-table-set'
    );
    const play = ChannelTableSetViewActions.find(
      (action) => action.key === 'play-channel-table-set'
    );
    const view = { getViewContext: () => set().getViewContext() };

    pause.invoke([], view);
    expect(set().paused).toBe(true);
    play.invoke([], view);
    expect(set().paused).toBe(false);
  });
});
