import { TransactionRow } from '../types';

/**
 * Generates an RFC 4180 compliant CSV string with exact columns:
 * Date,Description,Amount,Category,Notes
 */
export function generateTransactionsCSV(transactions: TransactionRow[]): string {
  const header = ['Date', 'Description', 'Amount', 'Category', 'Notes'];

  const escapeCSVField = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // If field contains comma, double-quote, or newline, wrap in double quotes and escape internal quotes
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = transactions.map(t => {
    // Format amount as signed number with 2 decimal places
    const formattedAmount = Number(t.amount || 0).toFixed(2);
    return [
      escapeCSVField(t.date),
      escapeCSVField(t.description),
      formattedAmount,
      escapeCSVField(t.category),
      escapeCSVField(t.notes || ''),
    ].join(',');
  });

  return [header.join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of the CSV content
 */
export function downloadCSVFile(csvContent: string, defaultName: string = 'bank_transactions.csv'): void {
  // Add UTF-8 BOM for Excel compatibility with international characters/symbols
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', defaultName.endsWith('.csv') ? defaultName : `${defaultName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
