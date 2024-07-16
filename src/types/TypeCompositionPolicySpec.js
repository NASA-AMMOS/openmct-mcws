define([
    './TypeCompositionPolicy'
], function (
    TypeCompositionPolicyModule // Importing the module, not the constructor directly
) {
    const TypeCompositionPolicy = TypeCompositionPolicyModule.default; // Accessing the default export

    describe('TypeCompositionPolicy', () => {
        let policy;
        let parent;
        let child;

        beforeEach(() => {
            parent = {};
            child = {};
            policy = new TypeCompositionPolicy();
        });

        it('Allows by default', () => {
            expect(policy.allow(parent, child)).toBe(true);
        });

        it('does not allow packet summary events in table', () => {
            parent.type = 'table';
            child.type = 'vista.packetSummaryEvents';
            expect(policy.allow(parent, child)).toBe(false);
        });

        it('allows other types in table', () => {
            parent.type = 'table';
            expect(policy.allow(parent, child)).toBe(true);
        });

        it('does not allow anything in dataset nodes', () => {
            const types = [
                'vista.channelAlarms',
                'vista.channelGroup',
                'vista.channelSource',
                'vista.channel',
                'vista.commandEvents',
                'vista.dataProducts',
                'vista.dataset',
                'vista.dictionarySource',
                'vista.dictionary',
                'vista.evrModule',
                'vista.evrSource',
                'vista.evr',
                'vista.packets',
                'vista.packetSummaryEvents'
            ];
            types.forEach(function (t) {
                parent.type = t;
                expect(policy.allow(parent, child)).toBe(false);
            });
        });

    });
});
