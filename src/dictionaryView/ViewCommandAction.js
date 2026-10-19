const VIEW_COMMAND_ACTION_KEY = 'vista.viewCommand';

class ViewCommandAction {
  constructor(openmct) {
    this.name = 'View Full Datum';
    this.key = VIEW_COMMAND_ACTION_KEY;
    this.description = 'Open this command in the Command Detail view';
    this.cssClass = 'icon-object';

    this.openmct = openmct;
  }

  invoke(objectPath) {
    const keyString = this.openmct.objects.makeKeyString(objectPath[0].identifier);

    this.openmct.router.navigate(`#/browse/${keyString}`);
  }

  appliesTo(objectPath, view = {}) {
    const target = objectPath[0];

    if (!target || target.type !== 'vista.command') {
      return false;
    }

    const viewContext = view.getViewContext && view.getViewContext();

    return !!(viewContext && viewContext.row);
  }
}

export { VIEW_COMMAND_ACTION_KEY };

export default ViewCommandAction;
