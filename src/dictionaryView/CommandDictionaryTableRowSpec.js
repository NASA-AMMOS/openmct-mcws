import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import CommandDictionaryTableRow, {
  makeCommandObjectKeyString
} from './CommandDictionaryTableRow.js';
import { VIEW_COMMAND_ACTION_KEY } from './ViewCommandAction.js';

describe('CommandDictionaryTableRow', () => {
  it('offers only the view-command action', () => {
    const row = new CommandDictionaryTableRow(
      { stem: 'MY_CMD' },
      {},
      'vista:dictionary:test-dataset:commandDictionaryUrl',
      {}
    );

    expect(row).toBeInstanceOf(TelemetryTableRow);
    expect(row.getContextMenuActions()).toEqual([VIEW_COMMAND_ACTION_KEY]);
    expect(row.getContextMenuActions()).not.toContain('viewDatumAction');
    expect(row.getContextMenuActions()).not.toContain('viewHistoricalData');
  });

  describe('makeCommandObjectKeyString', () => {
    it('builds the vista.command key string for a stem', () => {
      expect(
        makeCommandObjectKeyString({ namespace: 'vista', key: 'test-dataset' }, 'MY_CMD')
      ).toBe('vista:command:vista:test-dataset:MY_CMD');
    });

    it('keeps dotted stems intact', () => {
      expect(
        makeCommandObjectKeyString(
          { namespace: 'vista', key: 'test-dataset' },
          'deployment.commanddispatcher.no_op'
        )
      ).toBe('vista:command:vista:test-dataset:deployment.commanddispatcher.no_op');
    });
  });
});
