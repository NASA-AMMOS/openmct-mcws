define([
    "./src/directives/MCTTable"
], function (
    MCTTable
) {
    return function install(openmct) {
        openmct.legacyExtension('directives',{
            "key": "mctTable",
            "implementation": MCTTable,
            "depends": ["$timeout"]
        });
    }
});
