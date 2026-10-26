import TableComponent from 'openmct.tables.components.Table';
import patchTableRowContextMenu from './patchTableRowContextMenu.js';

describe('patchTableRowContextMenu', () => {
  let rowComponent;

  beforeEach(() => {
    const coreRowComponent = TableComponent.components.TelemetryTableRow;
    // Patch a clone so this spec does not leak the patch into other specs.
    rowComponent = {
      ...coreRowComponent,
      methods: { ...coreRowComponent.methods }
    };
  });

  function makeRowContext() {
    const markRow = jasmine.createSpy('markRow');
    const showMenu = jasmine.createSpy('showMenu');

    return {
      markRow,
      showMenu,
      context: {
        marked: true,
        objectPath: [{ identifier: { namespace: 'test', key: 'evr1' }, type: 'vista.evr' }],
        currentView: {},
        openmct: {
          actions: {
            getAction: (key) => ({ key })
          },
          menus: {
            actionsToMenuItems: (actions) => actions.map((action) => ({ name: action.key })),
            showMenu
          }
        },
        row: {
          objectKeyString: 'test:evr1',
          getContextMenuActions: () => ['vista.copySelectedRows']
        },
        markRow,
        updateViewContext: jasmine.createSpy('updateViewContext')
      }
    };
  }

  it('opens the context menu without marking or unmarking the row', async () => {
    expect(patchTableRowContextMenu(rowComponent)).toBe(true);

    const { context, markRow, showMenu } = makeRowContext();
    const event = { x: 10, y: 20, preventDefault: jasmine.createSpy('preventDefault') };
    await rowComponent.methods.showContextMenu.call(context, event);

    expect(markRow).not.toHaveBeenCalled();
    expect(context.updateViewContext).toHaveBeenCalled();
    expect(showMenu).toHaveBeenCalledWith(10, 20, [{ name: 'vista.copySelectedRows' }]);
    // the row keeps its own markRow once the menu has been shown
    expect(context.markRow).toBe(markRow);
  });

  it('only patches a component once', () => {
    expect(patchTableRowContextMenu(rowComponent)).toBe(true);
    expect(patchTableRowContextMenu(rowComponent)).toBe(false);
  });

  it('leaves components without a context menu alone', () => {
    expect(patchTableRowContextMenu({})).toBe(false);
    expect(patchTableRowContextMenu({ methods: {} })).toBe(false);
  });
});
