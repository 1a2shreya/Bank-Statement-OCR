import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ProcessingSection } from './components/ProcessingSection';
import { SummaryCards } from './components/SummaryCards';
import { CategoryAnalytics } from './components/CategoryAnalytics';
import { TransactionTable } from './components/TransactionTable';
import { ExportSection } from './components/ExportSection';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';
import {
  TransactionRow,
  StatementMetadata,
  ProcessingStatus,
  ExtractionResponse,
} from './types';
import { AlertCircle, FileCheck, RefreshCw } from 'lucide-react';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingMessage, setProcessingMessage] = useState<string>('');

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [originalTransactions, setOriginalTransactions] = useState<TransactionRow[]>([]);
  const [metadata, setMetadata] = useState<StatementMetadata>({});
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filterNeedsReviewOnly, setFilterNeedsReviewOnly] = useState<boolean>(false);
  const [flowFilter, setFlowFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // File selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Process statement through OCR pipeline
  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('uploading');
    setProcessingProgress(15);
    setProcessingMessage('Uploading bank statement securely in memory...');

    // Progress interval simulator for smooth user feedback
    const progressTimer = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev < 30) {
          setProcessingStatus('reading');
          setProcessingMessage('Reading document structure & layout...');
          return prev + 5;
        } else if (prev < 60) {
          setProcessingStatus('ocr');
          setProcessingMessage('Running OCR & multi-column vision recognition...');
          return prev + 6;
        } else if (prev < 80) {
          setProcessingStatus('detecting');
          setProcessingMessage('Detecting transaction table, dates & amounts...');
          return prev + 4;
        } else if (prev < 92) {
          setProcessingStatus('categorizing');
          setProcessingMessage('Categorizing merchants (Food, Shopping, Salary, UPI)...');
          return prev + 2;
        }
        return prev;
      });
    }, 450);

    try {
      const base64Data = await fileToBase64(selectedFile);

      const response = await fetch('/api/extract-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
        }),
      });

      clearInterval(progressTimer);

      setProcessingStatus('validating');
      setProcessingProgress(98);
      setProcessingMessage('Normalizing dates, validating balances and checks...');

      const data: ExtractionResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract transactions from document.');
      }

      setProcessingStatus('done');
      setProcessingProgress(100);
      setProcessingMessage('Extraction complete!');

      setTransactions(data.transactions || []);
      setOriginalTransactions(data.transactions || []);
      setMetadata(data.metadata || {});
      setValidationIssues(data.validationIssues || []);

      if (!data.transactions || data.transactions.length === 0) {
        setErrorMessage('No transactions were detected in this document. Please verify the file contains a statement table.');
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setProcessingStatus('error');
      setProcessingProgress(0);
      let msg = err?.message || '';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      } catch {
        // Not a JSON string
      }
      if (
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('overloaded')
      ) {
        msg =
          'The AI model is temporarily experiencing high demand. Please click "Retry Extraction" to re-process your document.';
      }
      setErrorMessage(
        msg ||
          "We couldn't reliably read this statement. Please upload a clearer image or PDF."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Sample Selector
  const handleSelectSample = async (sampleId: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStatus('reading');
    setProcessingProgress(25);
    setProcessingMessage('Loading sample bank statement...');

    const timer = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev < 60) {
          setProcessingStatus('ocr');
          setProcessingMessage('Running OCR on statement...');
          return prev + 15;
        } else if (prev < 85) {
          setProcessingStatus('detecting');
          setProcessingMessage('Extracting transactions and merchants...');
          return prev + 10;
        }
        return prev;
      });
    }, 200);

    try {
      const res = await fetch(`/api/sample-statements/${sampleId}`);
      clearInterval(timer);

      if (!res.ok) throw new Error('Failed to load sample');
      const data: ExtractionResponse = await res.json();

      setProcessingStatus('done');
      setProcessingProgress(100);
      setProcessingMessage('Loaded sample successfully!');

      setTransactions(data.transactions || []);
      setOriginalTransactions(data.transactions || []);
      setMetadata(data.metadata || {});
      setValidationIssues([]);
    } catch (err: any) {
      clearInterval(timer);
      setProcessingStatus('error');
      setErrorMessage('Could not load sample data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cell Updates
  const handleUpdateTransaction = (id: string, field: keyof TransactionRow, value: any) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Delete Row
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Row
  const handleAddTransaction = (newTx: TransactionRow) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Resolve Review Flag
  const handleResolveReview = (id: string) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, needsReview: false } : item))
    );
  };

  // Reset Edits
  const handleResetToOriginal = () => {
    if (window.confirm('Reset all manual edits back to the initial OCR extraction?')) {
      setTransactions([...originalTransactions]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 flex flex-col font-sans antialiased">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upload Card */}
        <UploadSection
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onClearFile={handleClearFile}
          onProcess={handleProcess}
          isProcessing={isProcessing}
          onSelectSample={handleSelectSample}
          onTogglePreview={() => setIsPreviewOpen(true)}
          hasPreview={Boolean(selectedFile)}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <ProcessingSection
            status={processingStatus}
            progress={processingProgress}
            currentMessage={processingMessage}
          />
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Extraction Notice</h4>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  Retry Extraction
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 font-medium bg-rose-100/70 hover:bg-rose-100 rounded-xl transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Results Area (shown once transactions exist) */}
        {transactions.length > 0 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Financial Summaries */}
            <SummaryCards
              transactions={transactions}
              metadata={metadata}
              filterNeedsReviewOnly={filterNeedsReviewOnly}
              onToggleNeedsReviewFilter={() => setFilterNeedsReviewOnly(!filterNeedsReviewOnly)}
              flowFilter={flowFilter}
              onFlowFilterChange={setFlowFilter}
            />

            {/* Category Analytics & Graph */}
            <CategoryAnalytics
              transactions={transactions}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Editable Transactions Table */}
            <TransactionTable
              transactions={transactions}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
              onResolveReview={handleResolveReview}
              onResetToOriginal={originalTransactions.length > 0 ? handleResetToOriginal : undefined}
              filterNeedsReviewOnly={filterNeedsReviewOnly}
              onToggleNeedsReviewFilter={() => setFilterNeedsReviewOnly(!filterNeedsReviewOnly)}
              flowFilter={flowFilter}
              onFlowFilterChange={setFlowFilter}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* CSV Export & Download */}
            <ExportSection
              transactions={transactions}
              detectedBank={metadata.detectedBank}
            />
          </div>
        )}
      </main>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        file={selectedFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>Bank Statement OCR & AI Document Understanding</p>
          <div className="flex items-center gap-4">
            <span>RFC 4180 Compliant CSV</span>
            <span>•</span>
            <span>Zero Data Retention</span>
            <span>•</span>
            <span>Indian & Global Statement Formats</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
