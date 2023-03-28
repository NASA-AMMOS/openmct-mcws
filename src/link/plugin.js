define([

], function (

) {

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
                        name: "URL",
                        key: "url",
                        control: "textfield",
                        cssClass: "l-input-lg"
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
                            container.innerHTML = '<a href="' + domainObject.url + '">' + domainObject.name + '</a>'
                        },
                        destroy: function () {}
                    };
                }
            });
        }
    }

    return LinkPlugin;

});
