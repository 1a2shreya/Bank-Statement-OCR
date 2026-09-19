import React from 'react';
import { ShieldCheck, Sparkles, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  modelName?: string;
}

export const Header: React.FC<HeaderProps> = ({ modelName = 'gemini-3.8-flash' }) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Bank Statement OCR
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  AI Document Vision
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Upload your bank statement and convert transactions into structured CSV data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong className="text-slate-800">Privacy First:</strong> In-memory OCR, zero permanent storage, PII masked.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
