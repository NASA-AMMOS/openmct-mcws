import FolderListViewComponent from 'openmct.views.FolderListViewComponent';
import mount from 'ommUtils/mountVueComponent';

export default class FolderListView {
  constructor(openmct, types) {
    this.openmct = openmct;
    this.types = types;

    this.key = 'vista.folderListView';
    this.name = 'Folder List View';
    this.cssClass = 'icon-folder';
  }

  canView(domainObject) {
    return this.types.includes(domainObject.type);
  }

  view(domainObject, objectPath) {
    let _destroy = null;

    return {
      show: function (element) {
        const componentDefinition = {
          components: {
            listViewComponent: FolderListViewComponent
          },
          provide: {
            openmct,
            domainObject
          },
          template: '<list-view-component></list-view-component>'
        };

        const componentOptions = {
          element
        };

        const { componentInstance, destroy, el } = mount(componentDefinition, componentOptions);

        _destroy = destroy;
      },
      destroy: function () {
        _destroy?.();
      }
    };
  }

  priority() {
    return this.openmct.priority.LOW;
  }
}
