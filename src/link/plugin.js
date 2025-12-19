import urlSanitizeLib from '@braintree/sanitize-url';

function LinkPlugin() {
  return function install(openmct) {
    openmct.types.addType('vista.link', {
      name: 'Hyperlink',
      description: 'A link to another page in VISTA or an external resource.',
      cssClass: 'icon-activity',
      initialize: function (obj) {
        return obj;
      },
      creatable: true,
      form: [
        {
          name: 'URL',
          key: 'url',
          control: 'textfield',
          cssClass: 'l-input-lg'
        }
      ]
    });

    openmct.objectViews.addProvider({
      key: 'view.link',
      canView: function (domainObject) {
        return domainObject.type === 'vista.link';
      },
      view: function (domainObject) {
        return {
          show: function (container) {
            container.textContent = '';

            const anchor = document.createElement('a');
            anchor.href = urlSanitizeLib.sanitizeUrl(domainObject.url);
            anchor.textContent = domainObject.name;

            container.appendChild(anchor);
          },
          destroy: function () {}
        };
      }
    });
  };
}

export default LinkPlugin;
