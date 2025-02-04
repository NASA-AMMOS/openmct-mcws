const TYPE_DENY_MAP = {
  table: ['vista.packetSummaryEvents'],
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

class TypeCompositionPolicy {
  allow(parent, child) {
    const denyTypes = TYPE_DENY_MAP[parent.type];

    if (denyTypes) {
      if (denyTypes === '*') {
        return false;
      }

      if (Array.isArray(denyTypes)) {
        return !denyTypes.includes(child.type);
      }
    }

    if (parent.hasOwnProperty('containsNamespaces') && parent.containsNamespaces) {
      return false;
    }

    return true;
  }
}

export default TypeCompositionPolicy;
