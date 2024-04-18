import types from './types';
import TypeCompositionPolicy from './TypeCompositionPolicy';

export default function TypePlugin() {
    return (openmct) => {
        Object.values(types).forEach((type) => {
            const pickedType = (({ key, name, description, cssClass, initialize, form, creatable }) => ({
                key, name, description, cssClass, initialize, form, creatable
            }))(type);

            openmct.types.addType(type.key, pickedType);
        });

        openmct.composition.addPolicy(TypeCompositionPolicy);

        openmct.telemetry.addFormat({
            key: 'vista.invert-realtime-flag',
            format(raw) {
                let formatted = raw;
                if (typeof formatted === 'string') {
                    if (formatted.toUpperCase() === 'TRUE') {
                        formatted = 'False';
                    } else if (formatted.toUpperCase() === 'FALSE') {
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
