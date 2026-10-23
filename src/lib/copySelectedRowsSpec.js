import {
  COPY_SELECTED_ROWS_ACTION_KEY,
  copyTextToClipboard,
  encodeRowsToCsv,
  installCopySelectedOnCoreRows,
  selectedRowsTextFromTableComponent,
  withCopySelected
} from './copySelectedRows.js';
import CopyableTelemetryTableRow from './CopyableTelemetryTableRow.js';
import HistoricalContextTableRow from './HistoricalContextTableRow.js';
import FrameWatchRow from '../framesummary/FrameWatchRow.js';
import PacketSummaryRow from '../packetSummary/PacketSummaryRow.js';

describe('copySelectedRows', () => {
  describe('encodeRowsToCsv', () => {
    it('encodes a header row plus one CSV line per row in column order', () => {
      const rows = [
        { ID: 'CH1', Title: 'Bus Voltage', Value: '28.1' },
        { ID: 'CH2', Title: 'Bus Current', Value: '4.2' }
      ];

      expect(encodeRowsToCsv(rows, ['ID', 'Title', 'Value'])).toBe(
        '"ID","Title","Value"\r\n"CH1","Bus Voltage","28.1"\r\n"CH2","Bus Current","4.2"'
      );
    });

    it('quotes delimiters and blanks nulls', () => {
      const rows = [{ ID: 'CH1', Title: 'a,b"c', Value: null }];

      expect(encodeRowsToCsv(rows, ['ID', 'Title', 'Value'])).toBe(
        '"ID","Title","Value"\r\n"CH1","a,b""c",""'
      );
    });

    it('neutralizes spreadsheet formulas in the name column like CSV export', () => {
      const rows = [{ name: '=cmd|calc', value: '1' }];

      expect(encodeRowsToCsv(rows, ['name', 'value'])).toBe('"name","value"\r\n"\'=cmd|calc","1"');
    });
  });

  describe('selectedRowsTextFromTableComponent', () => {
    function fakeRow(marked, formatted) {
      return {
        marked,
        getFormattedDatum: () => formatted
      };
    }

    function fakeComponent(rows) {
      return {
        headers: { ID: {}, Title: {}, Value: {} },
        table: {
          tableRows: {
            getRows: () => rows
          }
        }
      };
    }

    it('includes only marked rows under a header row', () => {
      const component = fakeComponent([
        fakeRow(true, { ID: 'CH1', Title: 'V', Value: '1' }),
        fakeRow(false, { ID: 'CH2', Title: 'I', Value: '2' }),
        fakeRow(true, { ID: 'CH3', Title: 'T', Value: '3' })
      ]);

      expect(selectedRowsTextFromTableComponent(component)).toBe(
        '"ID","Title","Value"\r\n"CH1","V","1"\r\n"CH3","T","3"'
      );
    });

    it('returns an empty string when nothing is marked', () => {
      const component = fakeComponent([fakeRow(false, { ID: 'CH1', Title: 'V', Value: '1' })]);

      expect(selectedRowsTextFromTableComponent(component)).toBe('');
    });

    it('returns an empty string without a component, headers or rows', () => {
      expect(selectedRowsTextFromTableComponent(undefined)).toBe('');
      expect(selectedRowsTextFromTableComponent({})).toBe('');
      expect(selectedRowsTextFromTableComponent({ headers: {}, table: {} })).toBe('');
    });
  });

  describe('copyTextToClipboard', () => {
    let realClipboard;

    beforeEach(() => {
      realClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    });

    afterEach(() => {
      if (realClipboard) {
        Object.defineProperty(navigator, 'clipboard', realClipboard);
      } else {
        delete navigator.clipboard;
      }
    });

    function stubClipboard(writeText) {
      Object.defineProperty(navigator, 'clipboard', {
        value: writeText ? { writeText } : undefined,
        configurable: true
      });
    }

    it('resolves false for empty text without touching the clipboard', async () => {
      const writeText = jasmine.createSpy('writeText');

      stubClipboard(writeText);

      expect(await copyTextToClipboard('')).toBe(false);
      expect(writeText).not.toHaveBeenCalled();
    });

    it('uses navigator.clipboard when available', async () => {
      const writeText = jasmine.createSpy('writeText').and.resolveTo();

      stubClipboard(writeText);

      expect(await copyTextToClipboard('a\tb')).toBe(true);
      expect(writeText).toHaveBeenCalledWith('a\tb');
    });

    it('falls back to execCommand when the clipboard API rejects', async () => {
      stubClipboard(jasmine.createSpy('writeText').and.rejectWith(new Error('denied')));
      spyOn(document, 'execCommand').and.returnValue(true);

      expect(await copyTextToClipboard('a\tb')).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(document.querySelectorAll('textarea').length).toBe(0);
    });

    it('falls back to execCommand when the clipboard API is missing', async () => {
      stubClipboard(null);
      spyOn(document, 'execCommand').and.returnValue(true);

      expect(await copyTextToClipboard('a\tb')).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(document.querySelectorAll('textarea').length).toBe(0);
    });
  });

  describe('withCopySelected', () => {
    it('appends the key once and never duplicates it', () => {
      expect(withCopySelected(['viewHistoricalData'])).toEqual([
        'viewHistoricalData',
        COPY_SELECTED_ROWS_ACTION_KEY
      ]);
      expect(withCopySelected(['viewHistoricalData', COPY_SELECTED_ROWS_ACTION_KEY])).toEqual([
        'viewHistoricalData',
        COPY_SELECTED_ROWS_ACTION_KEY
      ]);
      expect(withCopySelected(undefined)).toEqual([COPY_SELECTED_ROWS_ACTION_KEY]);
    });
  });

  describe('installCopySelectedOnCoreRows', () => {
    it('appends the key to a row class exactly once', () => {
      class FakeRow {
        getContextMenuActions() {
          return ['viewHistoricalData'];
        }
      }

      installCopySelectedOnCoreRows(FakeRow);
      installCopySelectedOnCoreRows(FakeRow);

      expect(new FakeRow().getContextMenuActions()).toEqual([
        'viewHistoricalData',
        COPY_SELECTED_ROWS_ACTION_KEY
      ]);
    });
  });

  describe('menu wiring', () => {
    it('exposes the action key', () => {
      expect(COPY_SELECTED_ROWS_ACTION_KEY).toBe('vista.copySelectedRows');
    });

    it('appends the key to the shared row bases', () => {
      expect(new HistoricalContextTableRow({}, {}, 'k', null).getContextMenuActions()).toEqual([
        'viewHistoricalData',
        COPY_SELECTED_ROWS_ACTION_KEY
      ]);
      expect(new CopyableTelemetryTableRow({}, {}, 'k', null).getContextMenuActions()).toEqual([
        'viewDatumAction',
        'viewHistoricalData',
        COPY_SELECTED_ROWS_ACTION_KEY
      ]);
      expect(new FrameWatchRow({}, {}, 'k', null, 'r').getContextMenuActions()).toContain(
        COPY_SELECTED_ROWS_ACTION_KEY
      );
      expect(new PacketSummaryRow({}, {}, 'k', null, 'r').getContextMenuActions()).toContain(
        COPY_SELECTED_ROWS_ACTION_KEY
      );
    });
  });
});
