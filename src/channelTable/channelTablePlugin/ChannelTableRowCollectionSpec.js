import ChannelTableRowCollection from './ChannelTableRowCollection.js';
import ChannelTableRow from './ChannelTableRow.js';

describe('ChannelTableRowCollection marked carry', () => {
  function collection() {
    return new ChannelTableRowCollection({
      time: {
        getTimeSystem: () => ({ key: 'scet' })
      }
    });
  }

  function row(scet) {
    return new ChannelTableRow({ scet }, {}, 'test-key', null);
  }

  function seedDummy(rows) {
    rows.addOne({ isDummyRow: true, objectKeyString: 'test-key', datum: { scet: 0 } });
  }

  it('carries marked across replacement by newer datums', () => {
    const rows = collection();
    seedDummy(rows);

    const first = row(1);
    rows.addOne(first);
    first.marked = true;

    const second = row(2);
    rows.addOne(second);

    expect(rows.getRows()[0]).toBe(second);
    expect(second.marked).toBe(true);
  });

  it('leaves replacements unmarked when the old row was unmarked', () => {
    const rows = collection();
    seedDummy(rows);

    rows.addOne(row(1));

    const second = row(2);
    rows.addOne(second);

    expect(rows.getRows()[0]).toBe(second);
    expect(second.marked).toBeFalsy();
  });
});
