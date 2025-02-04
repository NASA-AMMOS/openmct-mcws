import DataProductViewProvider from './DataProductViewProvider.js';
import DataProductInspectorViewProvider from './DataProductInspectorViewProvider.js';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider.js';
import DataProductViewActions from './DataProductViewActions.js';

export default function install(options) {
  return function ProductStatusPlugin(openmct) {
    openmct.types.addType('vista.dataProductsView', {
      name: 'Data Product View',
      description: 'Shows data product status information',
      cssClass: 'icon-tabular-lad',
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
      }
    });
    openmct.objectViews.addProvider(new DataProductViewProvider(openmct, options));
    openmct.inspectorViews.addProvider(new DataProductInspectorViewProvider(openmct, options));

    openmct.inspectorViews.addProvider(
      new VistaTableConfigurationProvider(
        'vista.data-products-configuration',
        'Config',
        'vista.dataProductsView',
        options
      )
    );

    // Suppress new views via monkey-patching (for now)
    let wrappedGet = openmct.objectViews.get;
    openmct.objectViews.get = function (domainObject) {
      const restrictedViews = ['plot-single', 'table'];

      return wrappedGet
        .apply(this, arguments)
        .filter(
          (viewProvider) =>
            !(
              domainObject.type === 'vista.dataProducts' &&
              restrictedViews.includes(viewProvider.key)
            )
        );
    };

    DataProductViewActions.forEach((action) => {
      openmct.actions.register(action);
    });
  };
}
