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
      show: jasmine.createSpy('show')
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
      time: {
        on() {},
        off() {},
        getTimeSystem: () => ({ name: 'SCET' })
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
          testObject: {}
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
    expect(ChannelTableSetViewActions.length).toBe(2);

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
