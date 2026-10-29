import EVRTable from './EVRTable.js';
import attachTableScrollRepaint from './attachTableScrollRepaint.js';
import createEvrPauseCountdown, {
  formatPauseCountdown,
  normalizePauseTimerSeconds,
  observePauseTimerSeconds
} from './evrPauseCountdown.js';
import { PAUSE_COUNTDOWN_ACTION_KEY } from './EVRPauseCountdownAction.js';
import TableComponent from 'openmct.tables.components.Table';
import mount from 'ommUtils/mountVueComponent.js';
import { selectedRowsTextFromTableComponent } from 'lib/copySelectedRows';

const RESTRICTED_VIEWS = ['plot-single', 'table'];
const EVR_SOURCES = ['evrHistoricalUrl', 'evrStreamUrl', 'evrLADUrl'];

function providesEVRData(domainObject) {
  return EVR_SOURCES.some((evrSource) => Boolean(domainObject.telemetry?.[evrSource]));
}
export default class EVRViewProvider {
  constructor(openmct, options) {
    this.key = 'vista.evrView';
    this.name = 'EVR View';
    this.cssClass = 'icon-tabular-realtime';
    this.openmct = openmct;
    this.options = options;

    this.view = this.view.bind(this);
  }

  canView(domainObject) {
    // suppress plot and table views for evr providing telemetry
    const wrappedGet = this.openmct.objectViews.get;
    this.openmct.objectViews.get = function (object) {
      return wrappedGet
        .apply(this, arguments)
        .filter(
          (viewProvider) =>
            !(providesEVRData(object) && RESTRICTED_VIEWS.includes(viewProvider.key))
        );
    };

    return providesEVRData(domainObject) || domainObject.type === 'vista.evrView';
  }

  view(domainObject, objectPath) {
    let component;
    let _destroy = null;
    const self = this;

    let pauseTimerSeconds = normalizePauseTimerSeconds(
      domainObject.configuration?.pauseTimerSeconds
    );
    let pauseCountdownDismissed = false;

    const pauseCountdown = createEvrPauseCountdown({
      onTick: (remainingSeconds) => updatePauseCountdownAction(remainingSeconds),
      onExpire: () => {
        updatePauseCountdownAction(null);

        const tableComponent = component?.$refs.tableComponent;

        if (tableComponent?.paused) {
          tableComponent.togglePauseByButton();
        }
      }
    });

    function updatePauseCountdownAction(remainingSeconds) {
      const actionCollection = component?.$refs.tableComponent?.viewActionsCollection;

      if (!actionCollection) {
        return;
      }

      // Collections hold clones of the registered definition, so the
      // countdown label and visibility must be set on the clone.
      const action = actionCollection.getActionsObject()[PAUSE_COUNTDOWN_ACTION_KEY];

      if (!action) {
        return;
      }

      if (remainingSeconds === null) {
        action.name = 'Pause Countdown';
        actionCollection.hide([PAUSE_COUNTDOWN_ACTION_KEY]);
      } else {
        action.name = formatPauseCountdown(remainingSeconds);
        orderCountdownAfterPlay(actionCollection);
        actionCollection.show([PAUSE_COUNTDOWN_ACTION_KEY]);
      }
    }

    // Status-bar actions render in collection order, which follows global
    // registration order (this plugin registers after core). Move the
    // countdown so it sits immediately after Play/Pause instead of after
    // the column actions.
    function orderCountdownAfterPlay(actionCollection) {
      const actions = actionCollection.getActionsObject();
      const countdown = actions[PAUSE_COUNTDOWN_ACTION_KEY];

      if (!countdown) {
        return;
      }

      const keys = Object.keys(actions).filter((key) => key !== PAUSE_COUNTDOWN_ACTION_KEY);
      const playIndex = keys.indexOf('play-data');
      const pauseIndex = keys.indexOf('pause-data');
      const insertAfter = playIndex !== -1 ? playIndex : pauseIndex;

      if (insertAfter === -1) {
        return;
      }

      keys.splice(insertAfter + 1, 0, PAUSE_COUNTDOWN_ACTION_KEY);

      const ordered = {};
      keys.forEach((key) => {
        ordered[key] = key === PAUSE_COUNTDOWN_ACTION_KEY ? countdown : actions[key];
      });
      actionCollection.applicableActions = ordered;
    }

    function dismissPauseCountdown() {
      pauseCountdownDismissed = true;
      pauseCountdown.dismiss();
      updatePauseCountdownAction(null);
    }

    // The table owns its paused flag (marking and the Pause button both set
    // it inside the core component), so poll it: any pause with a configured
    // timer counts down, whatever caused the pause. Marking changes are
    // handled separately in onMarkedRowsUpdated.
    function syncPauseCountdown() {
      const tableComponent = component?.$refs.tableComponent;

      if (!tableComponent) {
        return;
      }

      if (!tableComponent.paused || pauseTimerSeconds === null || pauseCountdownDismissed) {
        if (!tableComponent.paused) {
          pauseCountdownDismissed = false;
        }

        if (pauseCountdown.isRunning()) {
          pauseCountdown.dismiss();
        }

        updatePauseCountdownAction(null);

        return;
      }

      if (!pauseCountdown.isRunning()) {
        pauseCountdown.start(pauseTimerSeconds);
      }
    }

    function onMarkedRowsUpdated(newRows) {
      if (newRows.length > 0) {
        pauseCountdownDismissed = false;

        if (pauseCountdown.isRunning()) {
          pauseCountdown.reset();
        }
      }
    }

    const table = new EVRTable(domainObject, this.openmct, this.options);
    const markingProp = {
      enable: true,
      useAlternateControlBar: false,
      rowName: '',
      rowNamePlural: ''
    };

    const view = {
      show: function (element, editMode, { renderWhenVisible }) {
        const componentDefinition = {
          components: {
            TableComponent
          },
          provide: {
            openmct: self.openmct,
            table,
            objectPath,
            currentView: view,
            renderWhenVisible
          },
          data() {
            return {
              isEditing: editMode,
              markingProp
            };
          },
          methods: {
            onMarkedRowsUpdated
          },
          template: `
                        <table-component
                            ref="tableComponent"
                            :is-editing="isEditing"
                            :allow-sorting="true"
                            :marking="markingProp"
                            @marked-rows-updated="onMarkedRowsUpdated"
                        ></table-component>
                    `
        };

        const componentOptions = {
          element
        };

        const { componentInstance, destroy } = mount(componentDefinition, componentOptions);

        component = componentInstance;
        const cancelScrollRepaint = attachTableScrollRepaint({
          getTableComponent: () => component && component.$refs.tableComponent
        });

        const stopObservingPauseTimer = observePauseTimerSeconds(
          self.openmct,
          domainObject,
          (newSeconds) => {
            pauseTimerSeconds = newSeconds;
            pauseCountdownDismissed = false;

            // Apply edits to a live countdown immediately, like other
            // Config-tab settings: restart at the new value, or stop
            // counting (staying paused) when the timer is cleared.
            if (pauseCountdown.isRunning()) {
              if (newSeconds === null) {
                pauseCountdown.dismiss();
                updatePauseCountdownAction(null);
              } else {
                pauseCountdown.start(newSeconds);
              }
            }
          }
        );

        const pauseCountdownPoll = setInterval(syncPauseCountdown, 250);

        _destroy = () => {
          clearInterval(pauseCountdownPoll);
          stopObservingPauseTimer();
          pauseCountdown.destroy();
          updatePauseCountdownAction(null);
          cancelScrollRepaint();
          destroy();
        };
      },
      onEditModeChange(editMode) {
        component.isEditing = editMode;
      },
      onClearData() {
        table.clearData();
      },
      getViewContext() {
        if (component) {
          return {
            ...component.$refs.tableComponent.getViewContext(),
            dismissPauseCountdown
          };
        } else {
          return {
            type: 'telemetry-table',
            dismissPauseCountdown
          };
        }
      },
      getSelectedRowsText() {
        if (component?.$refs.tableComponent) {
          return selectedRowsTextFromTableComponent(component.$refs.tableComponent);
        }

        return '';
      },
      destroy: function () {
        _destroy?.();
      }
    };

    return view;
  }

  canEdit(domainObject) {
    return domainObject.type === 'vista.evrView';
  }
}
