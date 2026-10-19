import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import DictionaryViewTable from './dictionaryViewTable.js';
import CommandDictionaryTableRow from './CommandDictionaryTableRow.js';

describe('DictionaryViewTable rows', () => {
  function tableFor(urlProperty) {
    const table = Object.create(DictionaryViewTable.prototype);

    table.domainObject = { url_property: urlProperty };

    return table;
  }

  it('uses command rows for the command dictionary', () => {
    const row = tableFor('commandDictionaryUrl').createRow({ stem: 'MY_CMD' }, {}, 'key', {});

    expect(row).toBeInstanceOf(CommandDictionaryTableRow);
  });

  it('uses core rows for other dictionaries', () => {
    const row = tableFor('channelDictionaryUrl').createRow({ foo: 1 }, {}, 'key', {});

    expect(row).toBeInstanceOf(TelemetryTableRow);
    expect(row).not.toBeInstanceOf(CommandDictionaryTableRow);
  });
});
