import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TransactionRow } from '../types';
import { generateTransactionsCSV, downloadCSVFile } from '../utils/csvExport';

interface ExportSectionProps {
  transactions: TransactionRow[];
  detectedBank?: string;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  transactions,
  detectedBank,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const prefix = detectedBank ? detectedBank.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'bank';
    return `${prefix}_statement_ocr_${today}.csv`;
  });

  const csvContent = generateTransactionsCSV(transactions);

  const handleDownload = () => {
    downloadCSVFile(csvContent, fileName);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Export Structured Data
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Export strictly formatted CSV with columns: Date, Description, Amount, Category, Notes.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={transactions.length === 0}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied CSV!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy CSV</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={transactions.length === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* CSV File Options & Privacy Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
        <div className="sm:col-span-2 flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 shrink-0">File Name:</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full sm:max-w-md px-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 font-mono text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center sm:justify-end">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{showPreview ? 'Hide CSV Preview' : 'Inspect CSV Output'}</span>
            {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable CSV Preview */}
      {showPreview && (
        <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-64 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>RFC 4180 Escaped Output:</span>
            <span>{transactions.length} rows</span>
          </div>
          <pre className="text-slate-300 whitespace-pre leading-relaxed">{csvContent}</pre>
        </div>
      )}

      {/* Privacy Notice Reminder */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-700">Privacy Safeguard:</strong> This export contains only transaction data (Date, Description, Amount, Category, Notes). Full bank account numbers, IFSC codes, customer postal addresses, and PAN numbers are intentionally excluded to protect your financial privacy.
        </p>
      </div>
    </div>
  );
};
