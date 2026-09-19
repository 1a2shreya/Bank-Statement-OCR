import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  AlertTriangle,
  Building,
  Calendar,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Filter,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { StatementMetadata, TransactionRow } from '../types';

interface SummaryCardsProps {
  transactions: TransactionRow[];
  metadata: StatementMetadata;
  filterNeedsReviewOnly: boolean;
  onToggleNeedsReviewFilter: () => void;
  flowFilter?: 'all' | 'income' | 'expense';
  onFlowFilterChange?: (filter: 'all' | 'income' | 'expense') => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  transactions,
  metadata,
  filterNeedsReviewOnly,
  onToggleNeedsReviewFilter,
  flowFilter = 'all',
  onFlowFilterChange,
}) => {
  const totalTransactions = transactions.length;

  const creditTransactions = transactions.filter((t) => t.amount > 0);
  const debitTransactions = transactions.filter((t) => t.amount < 0);

  const creditCount = creditTransactions.length;
  const debitCount = debitTransactions.length;

  const totalCreditAmount = creditTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalDebitAmount = debitTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const netAmount = totalCreditAmount - totalDebitAmount;
  const totalVolume = totalCreditAmount + totalDebitAmount;

  const creditVolumePercent = totalVolume > 0 ? (totalCreditAmount / totalVolume) * 100 : 50;
  const debitVolumePercent = totalVolume > 0 ? (totalDebitAmount / totalVolume) * 100 : 50;

  const avgCredit = creditCount > 0 ? totalCreditAmount / creditCount : 0;
  const avgDebit = debitCount > 0 ? totalDebitAmount / debitCount : 0;

  const needsReviewCount = transactions.filter((t) => t.needsReview).length;

  // Currency detection
  const currencySymbol =
    metadata.currency === 'USD'
      ? '$'
      : metadata.currency === 'EUR'
      ? '€'
      : metadata.currency === 'GBP'
      ? '£'
      : '₹';

  const formatCurrency = (val: number): string => {
    const locale = metadata.currency === 'USD' ? 'en-US' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Statement Header Metadata Banner */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          {metadata.detectedBank && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Building className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400">Bank:</span>
              <span className="font-semibold text-white">{metadata.detectedBank}</span>
            </div>
          )}

          {metadata.statementPeriod && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-slate-400">Period:</span>
              <span className="font-semibold text-white">{metadata.statementPeriod}</span>
            </div>
          )}

          {metadata.accountNumberMasked && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400">Account:</span>
              <span className="font-semibold text-white font-mono">{metadata.accountNumberMasked}</span>
            </div>
          )}
        </div>

        {/* Action badges: Needs Review */}
        {needsReviewCount > 0 && (
          <button
            type="button"
            onClick={onToggleNeedsReviewFilter}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
              filterNeedsReviewOnly
                ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 shadow-xs'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              {needsReviewCount} {needsReviewCount === 1 ? 'Row Needs Review' : 'Rows Need Review'}
            </span>
            <span className="text-[10px] underline ml-1">
              {filterNeedsReviewOnly ? '(Showing Flagged)' : '(Click to Filter)'}
            </span>
          </button>
        )}
      </div>

      {/* 3 Core Financial Metric Cards + Net Cash Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Total Count of Transactions */}
        <div
          onClick={() => onFlowFilterChange && onFlowFilterChange('all')}
          className={`relative bg-white rounded-2xl border p-5 shadow-xs transition-all cursor-pointer select-none group hover:shadow-md ${
            flowFilter === 'all'
              ? 'border-indigo-500 ring-2 ring-indigo-500/15'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Transactions
                </span>
                {flowFilter === 'all' && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                    Active View
                  </span>
                )}
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 mt-2 font-mono">
                {totalTransactions}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:scale-105 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Breakdown chips */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
              <TrendingUp className="w-3 h-3" />
              {creditCount} credits
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded-md text-[11px]">
              <TrendingDown className="w-3 h-3" />
              {debitCount} debits
            </span>
          </div>
        </div>

        {/* CARD 2: Total Credit Amount */}
        <div
          onClick={() => onFlowFilterChange && onFlowFilterChange('income')}
          className={`relative bg-white rounded-2xl border p-5 shadow-xs transition-all cursor-pointer select-none group hover:shadow-md ${
            flowFilter === 'income'
              ? 'border-emerald-500 ring-2 ring-emerald-500/15'
              : 'border-emerald-100 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Total Credit Amount
                </span>
                {flowFilter === 'income' && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 mt-2 font-mono">
                +{currencySymbol}
                {formatCurrency(totalCreditAmount)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          {/* Subtext and stats */}
          <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">
              {creditCount} incoming deposit{creditCount === 1 ? '' : 's'}
            </span>
            <span className="text-slate-400 text-[11px]">
              Avg: {currencySymbol}
              {formatCurrency(avgCredit)}
            </span>
          </div>
        </div>

        {/* CARD 3: Total Debit Amount */}
        <div
          onClick={() => onFlowFilterChange && onFlowFilterChange('expense')}
          className={`relative bg-white rounded-2xl border p-5 shadow-xs transition-all cursor-pointer select-none group hover:shadow-md ${
            flowFilter === 'expense'
              ? 'border-rose-500 ring-2 ring-rose-500/15'
              : 'border-rose-100 hover:border-rose-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Total Debit Amount
                </span>
                {flowFilter === 'expense' && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 mt-2 font-mono">
                -{currencySymbol}
                {formatCurrency(totalDebitAmount)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>

          {/* Subtext and stats */}
          <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">
              {debitCount} outgoing charge{debitCount === 1 ? '' : 's'}
            </span>
            <span className="text-slate-400 text-[11px]">
              Avg: {currencySymbol}
              {formatCurrency(avgDebit)}
            </span>
          </div>
        </div>

        {/* CARD 4: Net Balance / Flow */}
        <div className="relative bg-white rounded-2xl border border-slate-200 p-5 shadow-xs select-none">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Net Cash Flow
              </span>
              <p
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 font-mono ${
                  netAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {netAmount >= 0 ? '+' : '-'}
                {currencySymbol}
                {formatCurrency(Math.abs(netAmount))}
              </p>
            </div>
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                netAmount >= 0
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          {/* Net indicator */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span
              className={`font-semibold inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${
                netAmount >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {netAmount >= 0 ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Net Inflow Surplus
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  Net Outflow Deficit
                </>
              )}
            </span>
            <span className="text-slate-400 text-[11px]">Credits vs Debits</span>
          </div>
        </div>
      </div>

      {/* Visual Inflow vs Outflow Distribution Bar */}
      {totalVolume > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Cash Flow Ratio</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                Total Turnover: {currencySymbol}
                {formatCurrency(totalVolume)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Credits: {creditVolumePercent.toFixed(1)}% ({currencySymbol}
                {formatCurrency(totalCreditAmount)})
              </span>
              <span className="flex items-center gap-1.5 font-medium text-rose-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                Debits: {debitVolumePercent.toFixed(1)}% ({currencySymbol}
                {formatCurrency(totalDebitAmount)})
              </span>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${creditVolumePercent}%` }}
              className="bg-emerald-500 hover:bg-emerald-600 transition-all"
              title={`Credits: ${creditVolumePercent.toFixed(1)}%`}
            />
            <div
              style={{ width: `${debitVolumePercent}%` }}
              className="bg-rose-500 hover:bg-rose-600 transition-all"
              title={`Debits: ${debitVolumePercent.toFixed(1)}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
