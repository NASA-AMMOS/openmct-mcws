import ChannelTableSet from './ChannelTableSet.vue';
import ChannelTableSetViewActions from './ChannelTableSetViewActions.js';
import mount from 'ommUtils/mountVueComponent.js';
import { nextTick } from 'vue';

describe('ChannelTableSet pause', () => {
  let element;
  let destroyFn = null;
  let rootInstance = null;
  let actionCollection;
  let mutateSpy;
  let observeSpy;
  let unobserveSpy;

  function mockOpenmct() {
    actionCollection = {
      hide: jasmine.createSpy('hide'),
      show: jasmine.createSpy('show'),
      enable: jasmine.createSpy('enable'),
      disable: jasmine.createSpy('disable')
    };
    mutateSpy = jasmine.createSpy('mutate');
    unobserveSpy = jasmine.createSpy('unobserve');
    observeSpy = jasmine.createSpy('observe').and.returnValue(unobserveSpy);

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
        makeKeyString: () => 'test-key',
        mutate: (...args) => mutateSpy(...args),
        observe: (...args) => observeSpy(...args)
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

  function mountSet(testObject = { name: 'Test Set' }) {
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
          testObject
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
    expect(ChannelTableSetViewActions.length).toBe(7);

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

  it('shows only Expand until manual, then only Autosize', (done) => {
    nextTick(() => {
      expect(actionCollection.hide).toHaveBeenCalledWith(['channel-table-set-autosize-columns']);
      expect(actionCollection.show).toHaveBeenCalledWith(['channel-table-set-expand-columns']);

      actionCollection.hide.calls.reset();
      actionCollection.show.calls.reset();

      set().columnWidths = { id: 100 };
      nextTick(() => {
        expect(actionCollection.hide).toHaveBeenCalledWith(['channel-table-set-expand-columns']);
        expect(actionCollection.show).toHaveBeenCalledWith(['channel-table-set-autosize-columns']);

        actionCollection.hide.calls.reset();
        actionCollection.show.calls.reset();

        set().autosizeColumns();
        nextTick(() => {
          expect(actionCollection.hide).toHaveBeenCalledWith([
            'channel-table-set-autosize-columns'
          ]);
          expect(actionCollection.show).toHaveBeenCalledWith(['channel-table-set-expand-columns']);
          done();
        });
      });
    });
  });

  it('marks a row and pauses, accumulating further plain-click marks', () => {
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

    expect(set().markedRows.map((row) => row.key)).toEqual(['ch1', 'ch2']);
    expect(set().isMarked('ch1')).toBe(true);
  });

  it('keeps export actions out of the status bar', () => {
    const byKey = Object.fromEntries(
      ChannelTableSetViewActions.map((action) => [action.key, action])
    );

    expect(byKey['pause-channel-table-set'].showInStatusBar).toBe(true);
    expect(byKey['play-channel-table-set'].showInStatusBar).toBe(true);
    expect(byKey['channel-table-set-unmark-all'].showInStatusBar).toBe(true);
    expect(byKey['channel-table-set-export-all'].showInStatusBar).toBeFalsy();
    expect(byKey['channel-table-set-export-marked'].showInStatusBar).toBeFalsy();
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

  it('marks a range on shift-click anchored at the first mark', () => {
    set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
    set().ladTelemetryObjects = {
      table1: ['ch1', 'ch2', 'ch3', 'ch4'].map((key) => ({
        key,
        domainObject: { name: key }
      }))
    };

    set().markRow('ch2', false);
    set().markMultipleConcurrentRows('ch4');

    expect(set().paused).toBe(true);
    expect(set().markedRows.map((row) => row.key)).toEqual(['ch2', 'ch3', 'ch4']);
  });

  it('supports backward range selection and shrinks to the anchor', () => {
    set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
    set().ladTelemetryObjects = {
      table1: ['ch1', 'ch2', 'ch3', 'ch4'].map((key) => ({
        key,
        domainObject: { name: key }
      }))
    };

    set().markRow('ch3', false);
    set().markMultipleConcurrentRows('ch1');

    expect(set().markedRows.map((row) => row.key)).toEqual(['ch1', 'ch2', 'ch3']);

    set().markMultipleConcurrentRows('ch2');

    expect(set().markedRows.map((row) => row.key)).toEqual(['ch1', 'ch2']);
  });

  it('falls back to a single mark when shift-clicking with no marks', () => {
    set().ladTableObjects = [{ key: 'table1', domainObject: {}, objectPath: [] }];
    set().ladTelemetryObjects = {
      table1: ['ch1', 'ch2'].map((key) => ({ key, domainObject: { name: key } }))
    };

    set().markMultipleConcurrentRows('ch2');

    expect(set().paused).toBe(true);
    expect(set().markedRows.map((row) => row.key)).toEqual(['ch2']);
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

  it('renders a resize hitarea in every header', () => {
    const headers = element.querySelectorAll('thead th');
    const handles = element.querySelectorAll('thead .c-telemetry-table__resize-hitarea');

    expect(headers.length).toBe(4);
    expect(handles.length).toBe(4);
  });

  it('initializes column widths from the domain object configuration', () => {
    destroyFn();
    mountSet({
      name: 'Configured Set',
      configuration: { autosize: false, columnWidths: { id: 111, value: 222 } }
    });

    expect(set().columnWidths).toEqual({ id: 111, value: 222 });
  });

  it('ignores persisted widths while autosize stays enabled', () => {
    destroyFn();
    mountSet({
      name: 'Autosize Set',
      configuration: { columnWidths: { id: 111, value: 222 } }
    });

    expect(set().columnWidths).toEqual({});
  });

  it('reapplies widths when the configuration is mutated elsewhere', () => {
    expect(observeSpy).toHaveBeenCalledWith(
      rootInstance.testObject,
      'configuration',
      jasmine.any(Function)
    );

    rootInstance.testObject.configuration = {
      autosize: false,
      columnWidths: { id: 77 }
    };
    observeSpy.calls.argsFor(0)[2]();

    expect(set().columnWidths).toEqual({ id: 77 });

    rootInstance.testObject.configuration = { autosize: true };
    observeSpy.calls.argsFor(0)[2]();

    expect(set().columnWidths).toEqual({});
  });

  it('stops observing the configuration on unmount', () => {
    destroyFn();

    expect(unobserveSpy).toHaveBeenCalledTimes(1);
  });

  it('applies column widths to the headers', (done) => {
    set().columnWidths = { id: 123 };

    nextTick(() => {
      const header = element.querySelector('thead th');

      expect(header.style.width).toBe('123px');
      expect(header.style.maxWidth).toBe('123px');
      expect(header.style.position).toBe('');
      expect(header.querySelector('.c-lad-table-set__header-content').style.position).toBe(
        'relative'
      );
      done();
    });
  });

  it('updates widths live while dragging and honors the minimum', () => {
    // getComputedStyle resolves empty on detached trees, so connect the
    // mount for this drag; Karma serves no core CSS, so pin the minimum
    // the app provides via .c-table.
    document.body.appendChild(element);
    const header = element.querySelector('thead th');
    header.style.minWidth = '10px';
    set().columnWidths = { id: 100 };

    set().resizeColumnStart(
      {
        clientX: 100,
        currentTarget: { closest: () => header },
        preventDefault() {}
      },
      'id'
    );
    set().resizeColumnMove({ clientX: 130 });

    expect(set().columnWidths.id).toBe(130);

    set().resizeColumnMove({ clientX: 0 });

    expect(set().columnWidths.id).toBe(130);

    // A real mouseup must end the drag through the registered listener.
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(set().resizeKey).toBe(undefined);
    expect(mutateSpy).toHaveBeenCalled();

    element.remove();
  });

  it('pins the table to the columns total once widths are manual', (done) => {
    const table = element.querySelector('table');

    expect(table.style.width).toBe('');
    expect(table.classList.contains('fixed-layout')).toBe(false);

    set().columnWidths = { id: 100, title: 150 };

    nextTick(() => {
      expect(table.style.width).toBe('250px');
      expect(table.classList.contains('fixed-layout')).toBe(true);
      done();
    });
  });

  it('freezes unset columns at natural widths when a drag starts', () => {
    document.body.appendChild(element);
    const headers = element.querySelectorAll('thead th');
    set().columnWidths = { id: 100 };

    set().resizeColumnStart(
      {
        clientX: 100,
        currentTarget: { closest: () => headers[1] },
        preventDefault() {}
      },
      'title'
    );

    expect(set().columnWidths.id).toBe(100);
    expect(set().columnWidths.title).toBe(headers[1].offsetWidth);
    expect(set().columnWidths.value).toBe(headers[2].offsetWidth);
    expect(set().columnWidths.timestamp).toBe(headers[3].offsetWidth);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    element.remove();
  });

  it('persists column widths to the configuration on drag end', () => {
    const testObject = rootInstance.testObject;
    set().columnWidths = { id: 130, title: 140 };

    set().resizeColumnEnd({ preventDefault() {}, stopPropagation() {} });

    expect(mutateSpy).toHaveBeenCalledWith(testObject, 'configuration', {
      autosize: false,
      columnWidths: { id: 130, title: 140 }
    });
  });

  it('expands columns to content widths without persisting', (done) => {
    document.body.appendChild(element);
    set().columnWidths = { id: 999 };
    mutateSpy.calls.reset();

    set().expandColumns();

    expect(set().columnWidths).toEqual({});

    set().$nextTick(() => {
      set().$nextTick(() => {
        const headers = element.querySelectorAll('thead th');

        expect(set().columnWidths).toEqual({
          id: headers[0].offsetWidth,
          title: headers[1].offsetWidth,
          value: headers[2].offsetWidth,
          timestamp: headers[3].offsetWidth
        });
        expect(mutateSpy).not.toHaveBeenCalled();

        element.remove();
        done();
      });
    });
  });

  it('clears manual widths through autosizeColumns without persisting', () => {
    set().columnWidths = { id: 999 };
    mutateSpy.calls.reset();

    set().autosizeColumns();

    expect(set().columnWidths).toEqual({});
    expect(mutateSpy).not.toHaveBeenCalled();
  });

  it('sizes columns through the registered actions', () => {
    const expand = ChannelTableSetViewActions.find(
      (action) => action.key === 'channel-table-set-expand-columns'
    );
    const autosize = ChannelTableSetViewActions.find(
      (action) => action.key === 'channel-table-set-autosize-columns'
    );
    const view = { getViewContext: () => set().getViewContext() };

    expect(expand.showInStatusBar).toBe(true);
    expect(autosize.showInStatusBar).toBe(true);

    set().columnWidths = { id: 999 };
    autosize.invoke([], view);

    expect(set().columnWidths).toEqual({});

    set().expandColumns = jasmine.createSpy('expandColumns');
    expand.invoke([], view);

    expect(set().expandColumns).toHaveBeenCalledTimes(1);
  });
});
