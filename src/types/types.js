define([
    './HeaderChannelSourceType',
    './HeaderChannelType',
    './ChannelSourceType',
    './ChannelGroupType',
    './ChannelType',
    './DictionarySourceType',
    './DataProductsType',
    './DatasetType',
    './DictionaryType',
    './EVRModuleType',
    './EVRSourceType',
    './EVRType',
    './PacketsType',
    './PacketSummaryEventsType',
    './CommandEventsType',
    './MessageType',
    './FrameSummaryType',
    './FrameEventType',
    './AlarmMessageStreamType',
    './FrameEventFilterType',
    './VISTAType',
    'lodash'
], function (
    HeaderChannelSourceType,
    HeaderChannelType,
    ChannelSourceType,
    ChannelGroupType,
    ChannelType,
    DictionarySourceType,
    DataProductsType,
    DatasetType,
    DictionaryType,
    EVRModuleType,
    EVRSourceType,
    EVRType,
    PacketsType,
    PacketSummaryEventsType,
    CommandEventsType,
    MessageType,
    FrameSummaryType,
    FrameEventType,
    AlarmMessageStreamType,
    FrameEventFilterType,
    VISTAType,
    _
) {

    var types = {
        HeaderChannelSource: HeaderChannelSourceType.default,
        HeaderChannel: HeaderChannelType.default,
        ChannelSource: ChannelSourceType,
        ChannelGroup: ChannelGroupType,
        Channel: ChannelType,
        DictionarySource: DictionarySourceType,
        DataProducts: DataProductsType,
        Dataset: DatasetType,
        Dictionary: DictionaryType,
        EVRModule: EVRModuleType,
        EVRSource: EVRSourceType,
        EVR: EVRType,
        Packets: PacketsType,
        PacketSummaryEvents: PacketSummaryEventsType,
        CommandEvents: CommandEventsType,
        Message: MessageType,
        FrameSummary: FrameSummaryType,
        FrameEvent: FrameEventType,
        AlarmMessageStream: AlarmMessageStreamType,
        FrameEventFilter: FrameEventFilterType
    };

    types.typeForIdentifier = function (identifier) {
        var matchingType = _.values(types).filter(function (t) {
            return t instanceof VISTAType && t.test(identifier)
        })[0];

        if (!matchingType) {
            throw new Error('Unknown VISTA type for id ' + identifier.key);
        }
        return matchingType;
    };

    types.hasTypeForKey = function (key) {
        var matchingType = _.values(types).filter(function (t) {
            return t instanceof VISTAType && t.key === key;
        })[0];

        return !!matchingType;
    };

    types.typeForKey = function (key) {
        var matchingType = _.values(types).filter(function (t) {
            return t instanceof VISTAType && t.key === key;
        })[0];

        if (!matchingType) {
            throw new Error('Unknown VISTA type for key ' + key);
        }
        return matchingType;
    };

    return types;

});

