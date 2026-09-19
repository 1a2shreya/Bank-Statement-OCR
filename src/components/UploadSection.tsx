import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
  Eye,
} from 'lucide-react';

interface UploadSectionProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  onProcess: () => void;
  isProcessing: boolean;
  onSelectSample: (sampleId: string) => void;
  onTogglePreview?: () => void;
  hasPreview?: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  selectedFile,
  onFileSelect,
  onClearFile,
  onProcess,
  isProcessing,
  onSelectSample,
  onTogglePreview,
  hasPreview,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);
    if (!acceptedTypes.includes(file.type)) {
      setErrorMessage('Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.');
      return;
    }

    // 25MB max size check
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds the 25MB limit. Please upload a smaller document.');
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isPdf = selectedFile?.type === 'application/pdf';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload Bank Statement</h2>
          <p className="text-sm text-slate-500">
            Upload clear scanned or digital statements in PDF, JPG, or PNG format.
          </p>
        </div>

        {/* Demo statement pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Quick Test:</span>
          <button
            type="button"
            onClick={() => onSelectSample('sample-hdfc')}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/60 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            HDFC UPI & Salary Demo
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('sample-sbi')}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/60 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            SBI Rent & Transfer Demo
          </button>
        </div>
      </div>

      {/* Drag & Drop Box */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-150 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">
                Drag and drop your bank statement here, or{' '}
                <span className="text-indigo-600 underline underline-offset-2">browse file</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Multi-page PDF, Scanned Images (JPG, PNG) up to 25MB
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> PDF (Native & Scanned)
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> High-Res Images
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              {isPdf ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 truncate">{selectedFile.name}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  {selectedFile.name.split('.').pop()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to process
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {hasPreview && onTogglePreview && (
              <button
                type="button"
                onClick={onTogglePreview}
                className="px-3 py-2 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                title="View document preview"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Preview File
              </button>
            )}

            <button
              type="button"
              onClick={onClearFile}
              disabled={isProcessing}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onProcess}
              disabled={isProcessing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Statement...</span>
                </>
              ) : (
                <>
                  <span>Process Statement</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
