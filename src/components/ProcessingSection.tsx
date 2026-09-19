import React from 'react';
import {
  Upload,
  FileSearch,
  ScanLine,
  Table,
  Tags,
  CheckCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ProcessingStatus } from '../types';

interface ProcessingSectionProps {
  status: ProcessingStatus;
  progress: number;
  currentMessage: string;
}

interface StepItem {
  id: ProcessingStatus;
  label: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  { id: 'uploading', label: 'Uploading file...', icon: Upload },
  { id: 'reading', label: 'Reading document...', icon: FileSearch },
  { id: 'ocr', label: 'Running OCR & vision analysis...', icon: ScanLine },
  { id: 'detecting', label: 'Detecting transactions...', icon: Table },
  { id: 'categorizing', label: 'Categorizing transactions...', icon: Tags },
  { id: 'validating', label: 'Validating data...', icon: CheckCheck },
];

export const ProcessingSection: React.FC<ProcessingSectionProps> = ({
  status,
  progress,
  currentMessage,
}) => {
  const getStepState = (stepId: ProcessingStatus) => {
    const order: ProcessingStatus[] = ['uploading', 'reading', 'ocr', 'detecting', 'categorizing', 'validating', 'done'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepId);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <h3 className="text-base font-semibold text-slate-900">
              Processing Bank Statement
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentMessage || 'Analyzing bank statement layout, dates, amounts, and merchant narrations...'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold tracking-tight text-indigo-600">
            {Math.min(100, Math.round(progress))}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      {/* Steps checklist grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        {STEPS.map((step) => {
          const state = getStepState(step.id);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                state === 'completed'
                  ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-800'
                  : state === 'active'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-slate-50/50 border-slate-200/60 text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                  state === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : state === 'active'
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : state === 'active' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-medium leading-tight line-clamp-2">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
