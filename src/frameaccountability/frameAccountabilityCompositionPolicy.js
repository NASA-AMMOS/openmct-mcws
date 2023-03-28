export default function FrameAccountabilityCompositionPolicy(openmct) {
    return function(parent, child) {
        if (parent.type === 'vista.frameaccountability') {
            if (child.type === 'vista.frameEvent' || child.type === "vista.commandEvents") {
                return true;
            } else {
                return false;
            }
        }

        return true;
    };
}
