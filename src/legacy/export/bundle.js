/*global define*/

define([
    "./src/ExportDataAction"
], function (
    ExportDataAction
) {
    "use strict";

    return function ExportPlugin(mct) {
        mct.legacyRegistry.register("vista/export", {
            "extensions": {
                "actions": [
                    {
                        "key": "vista.export",
                        "name": "Export Historical Data",
                        "description": "Export channel or EVR data as CSV",
                        "implementation": ExportDataAction,
                        "category": "contextual",
                        "depends": [
                            "exportService",
                            "openmct"
                        ]
                    }
                ]
            }
        });

        mct.legacyRegistry.enable('vista/export');
    };


});
