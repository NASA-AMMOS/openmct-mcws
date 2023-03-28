/*global define*/

define([
    "./src/DataProductViewAggregator",
    "./src/EMDViewProvider",
    "./src/VistaProductView",
    "./res/product-dialog.html",
], function (
    DataProductViewAggregator,
    EMDViewProvider,
    VistaProductView,
    productDialogTemplate
) {
    return function DataProductsPlugin(mct) {
        mct.legacyRegistry.register("../src/legacy/products", {
            "extensions": {
                "directives": [
                    {
                        "key": "vistaProductView",
                        "implementation": VistaProductView,
                        "depends": [
                            "dataProductViewService"
                        ]
                    }
                ],
                "components": [
                    {
                        "implementation": DataProductViewAggregator,
                        "type": "aggregator",
                        "provides": "dataProductViewService"
                    },
                    {
                        "implementation": EMDViewProvider,
                        "type": "provider",
                        "provides": "dataProductViewService",
                        "depends": [
                            "$document"
                        ],
                        "priority": "fallback"
                    }
                ],
                "templates": [
                    {
                        "key": "product-dialog",
                        "template": productDialogTemplate
                    }
                ]
            }
        });

        mct.legacyRegistry.enable('../src/legacy/products');
    };
});
