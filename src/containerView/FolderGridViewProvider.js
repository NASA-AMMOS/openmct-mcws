import FolderGridViewComponent from 'openmct.views.FolderGridViewComponent';
import mount from 'ommUtils/mountVueComponent';

export default class FolderGridView {
  constructor(openmct, types) {
    this.openmct = openmct;
    this.types = types;

    this.key = 'vista.folderGridView';
    this.name = 'Folder Grid View';
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
            gridViewComponent: FolderGridViewComponent
          },
          provide: {
            openmct,
            domainObject
          },
          template: '<grid-view-component></grid-view-component>'
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
