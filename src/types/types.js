import HeaderChannelSourceType from './HeaderChannelSourceType.js';
import HeaderChannelType from './HeaderChannelType.js';
import ChannelSourceType from './ChannelSourceType.js';
import ChannelGroupType from './ChannelGroupType.js';
import ChannelType from './ChannelType.js';
import DictionarySourceType from './DictionarySourceType.js';
import DataProductsType from './DataProductsType.js';
import DatasetType from './DatasetType.js';
import DictionaryType from './DictionaryType.js';
import EVRModuleType from './EVRModuleType.js';
import EVRSourceType from './EVRSourceType.js';
import EVRType from './EVRType.js';
import PacketsType from './PacketsType.js';
import PacketSummaryEventsType from './PacketSummaryEventsType.js';
import CommandEventsType from './CommandEventsType.js';
import MessageType from './MessageType.js';
import FrameSummaryType from './FrameSummaryType.js';
import FrameEventType from './FrameEventType.js';
import AlarmMessageStreamType from './AlarmMessageStreamType.js';
import FrameEventFilterType from './FrameEventFilterType.js';
import VISTAType from './VISTAType.js';

const types = {
  HeaderChannelSource: HeaderChannelSourceType,
  HeaderChannel: HeaderChannelType,
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
  const matchingType = Object.values(types).filter(
    (type) => type instanceof VISTAType && type.test(identifier)
  )[0];

  return matchingType;
}

function getTypeForKey(key) {
  const matchingType = Object.values(types).filter(
    (type) => type instanceof VISTAType && type.key === key
  )[0];

  return matchingType;
}

export default types;
