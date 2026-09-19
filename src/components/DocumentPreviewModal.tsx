import React from 'react';
import { X, FileText, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface DocumentPreviewModalProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  file,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !file) return null;

  const fileUrl = URL.createObjectURL(file);
  const isPdf = file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
            <h4 className="font-semibold text-slate-900 text-sm truncate">{file.name}</h4>
            <span className="text-xs text-slate-500">
              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={fileUrl}
              title="Bank Statement PDF Preview"
              className="w-full h-full rounded-lg bg-white border border-slate-300 shadow-xs"
            />
          ) : (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={fileUrl}
                alt="Bank Statement Document"
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-sm border border-slate-200"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <span>Compare original statement with the extracted table rows</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
