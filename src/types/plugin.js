define([
    './types',
    './TypeCompositionPolicy',
    'lodash'
], function (
    types,
    TypeCompositionPolicy,
    _
) {

    function TypePlugin(options) {
        return function install(openmct) {

            _.forEach(types, function (t) {
                openmct.types.addType(t.key, _.pick(
                    t,
                    [
                        'key',
                        'name',
                        'description',
                        'cssClass',
                        'initialize',
                        'form',
                        'creatable'
                    ]
                ));
            });

            openmct.legacyExtension('policies', {
                category: 'composition',
                implementation: TypeCompositionPolicy
            });

            openmct.telemetry.addFormat({
                key: 'vista.invert-realtime-flag',
                format(raw) {
                    let formatted = raw;
                    if (typeof formatted === 'string') {
                        if (formatted.toUpperCase() === 'TRUE') {
                            formatted = 'False';
                        } else if (formatted.toUpperCase() === 'FALSE'){
                            formatted = 'True';
                        }
                    } else if (typeof formatted === 'boolean') {
                        formatted = formatted ? 'False' : 'True';
                    }
                    return formatted;
                },
                parse(text) {
                    return text;
                },
                validate() {
                    return true;
                }
            });
        };
    }

    return TypePlugin;
});
