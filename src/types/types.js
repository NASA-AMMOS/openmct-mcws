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

  types.hasTypeForIdentifier = (identifier) => {
    const matchingType = getTypeForIdentifier(identifier);

    return Boolean(matchingType);
  };

  types.typeForIdentifier = (identifier) => {
    const matchingType = getTypeForIdentifier(identifier);

    if (!matchingType) {
      throw new Error('Unknown VISTA type for id ' + identifier.key);
    }

    return matchingType;
  };

  types.hasTypeForKey = (key) => {
    const matchingType = getTypeForKey(key);

    return Boolean(matchingType);
  };

  types.typeForKey = (key) => {
    const matchingType = getTypeForKey(key);

    if (!matchingType) {
      throw new Error('Unknown VISTA type for key ' + key);
    }

    return matchingType;
  };

  function getTypeForIdentifier(identifier) {
    const matchingType = _.values(types).filter(
      (type) => type instanceof VISTAType && type.test(identifier)
    )[0];

    return matchingType;
  }

  function getTypeForKey(key) {
    const matchingType = _.values(types).filter(
      (type) => type instanceof VISTAType && type.key === key
    )[0];

    return matchingType;
  }

  return types;
});
