import CSV from 'comma-separated-values';
import { sanitizeCsvFormulaInjection } from '@/exporters/CSVExporter.js';

// Action key for the Copy Selected menu item provided by openmct core
// (src/plugins/telemetryTable/CopySelectedRowsAction.js). Vista rows list
// this key in their context menus; core telemetry table rows get it
// from TelemetryTableRow.getContextMenuActions() directly.
export const COPY_SELECTED_ROWS_ACTION_KEY = 'copySelectedRows';

function sanitizeCellValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function encodeRowsToCsv(rows, columnKeys) {
  const sanitized = rows.map((row) => {
    const clean = {};

    columnKeys.forEach((key) => {
      clean[key] = sanitizeCellValue(row[key]);
    });

    if ('name' in clean) {
      clean.name = sanitizeCsvFormulaInjection(clean.name);
    }

    return clean;
  });

  return new CSV(sanitized, { header: columnKeys }).encode();
}

export function selectedRowsTextFromTableComponent(tableComponent) {
  const headers = tableComponent?.headers ?? {};
  const columnKeys = Object.keys(headers);
  const tableRows = tableComponent?.table?.tableRows?.getRows?.() ?? [];
  const markedRows = tableRows.filter((row) => row?.marked === true);

  if (!markedRows.length || !columnKeys.length) {
    return '';
  }

  return encodeRowsToCsv(
    markedRows.map((row) => row.getFormattedDatum(headers)),
    columnKeys
  );
}

export function copyTextToClipboard(text) {
  if (!text) {
    return Promise.resolve(false);
  }

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => fallbackCopyText(text)
    );
  }

  return Promise.resolve(fallbackCopyText(text));
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea');

  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;

  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);

  return copied;
}
