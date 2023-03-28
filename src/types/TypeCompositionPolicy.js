define([

], function (

) {
    /**
     * Allows / denies types based on
     */

    var TYPE_DENY_MAP = {
        'table': [
            'vista.packetSummaryEvents'
        ],
        'vista.channelAlarms': '*',
        'vista.channelGroup': '*',
        'vista.channelSource': '*',
        'vista.channel': '*',
        'vista.commandEvents': '*',
        'vista.dataProducts': '*',
        'vista.dataset': '*',
        'vista.dictionarySource': '*',
        'vista.dictionary': '*',
        'vista.evrModule': '*',
        'vista.evrSource': '*',
        'vista.evr': '*',
        'vista.packets': '*',
        'vista.packetSummaryEvents': '*'
    };

    function TypeCompositionPolicy() {
    }

    TypeCompositionPolicy.prototype.allow = function (parent, child) {
        var denyTypes = TYPE_DENY_MAP[parent.getModel().type];
        if (denyTypes) {
            if (denyTypes === '*') {
                return false;
            }
            if (Array.isArray(denyTypes)) {
                return denyTypes.indexOf(child.getModel().type) === -1;
            }
        }
        var model = parent.getModel();
        if (model.hasOwnProperty('containsNamespaces') && model.containsNamespaces) {
            return false;
        }
        return true;
    };

    return TypeCompositionPolicy;
});
