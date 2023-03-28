define([
    './TypeCompositionPolicy'
], function (
    TypeCompositionPolicy
) {

    describe('TypeCompositionPolicy', function () {
        var policy;
        var parentModel;
        var parent;
        var childModel;
        var child;

        beforeEach(function () {
            parentModel = {};
            parent = jasmine.createSpyObj('parentObject', [
                'getModel'
            ]);
            parent.getModel.and.returnValue(parentModel);

            childModel = {};
            child = jasmine.createSpyObj('childObject', [
                'getModel'
            ]);
            child.getModel.and.returnValue(childModel);
            policy = new TypeCompositionPolicy();
        });

        it('Allows by default', function () {
            expect(policy.allow(parent, child)).toBe(true);
        });

        it('does not allow packet summary events in table', function () {
            parentModel.type = 'table';
            childModel.type = 'vista.packetSummaryEvents';
            expect(policy.allow(parent, child)).toBe(false);
        });

        it('allows other types in table', function () {
            parentModel.type = 'table';
            expect(policy.allow(parent, child)).toBe(true);
        });

        it('does not allow anything in dataset nodes', function () {
            [
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
            ].forEach(function (t) {
                parentModel.type = t;
                expect(policy.allow(parent, child)).toBe(false);
            });
        });

    });
});
