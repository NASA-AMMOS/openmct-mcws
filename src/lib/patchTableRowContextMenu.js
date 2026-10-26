import TableComponent from 'openmct.tables.components.Table';

const PATCH_FLAG = '__vistaNoMarkOnContextMenu';

/**
 * Stop core table rows from changing the marked set when their context
 * menu is opened.
 *
 * Core's TableRow.showContextMenu calls markRow before showing the menu,
 * so a right-click on a marking table (EVR, Channel List, and siblings)
 * marks the clicked row or unmarks it if it was already marked. With
 * Copy Selected, the user marks 1-N rows first and right-clicks to act
 * on them; toggling the selection at that point copies the wrong rows or
 * none at all. The plugin's own rows (ChannelRow, Immediate Command)
 * already open their menus without marking.
 *
 * This patches only the plugin-bundled copy of the core row component
 * (core's own telemetry tables keep core behaviour). The original
 * showContextMenu still runs end to end — view context, contextual
 * object, menu items — with the row's markRow neutralized for the
 * synchronous span in which core invokes it, then restored.
 *
 * @param {Object} [rowComponent] row component definition to patch;
 *        defaults to the TelemetryTableRow registered by the bundled
 *        core TableComponent.
 * @returns {boolean} true if the component was patched.
 */
export default function patchTableRowContextMenu(rowComponent) {
  const target = rowComponent ?? TableComponent?.components?.TelemetryTableRow;

  if (!target?.methods?.showContextMenu || target[PATCH_FLAG]) {
    return false;
  }

  const originalShowContextMenu = target.methods.showContextMenu;

  target.methods.showContextMenu = async function (event) {
    const originalMarkRow = this.markRow;
    this.markRow = () => {};

    try {
      return await originalShowContextMenu.call(this, event);
    } finally {
      this.markRow = originalMarkRow;
    }
  };
  target[PATCH_FLAG] = true;

  return true;
}
