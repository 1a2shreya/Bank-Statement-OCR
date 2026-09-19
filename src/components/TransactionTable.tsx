import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { TransactionRow, TransactionCategory, TRANSACTION_CATEGORIES } from '../types';

interface TransactionTableProps {
  transactions: TransactionRow[];
  onUpdateTransaction: (id: string, field: keyof TransactionRow, value: any) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransaction: (row: TransactionRow) => void;
  onResolveReview: (id: string) => void;
  onResetToOriginal?: () => void;
  filterNeedsReviewOnly: boolean;
  onToggleNeedsReviewFilter: () => void;
  flowFilter?: 'all' | 'income' | 'expense';
  onFlowFilterChange?: (filter: 'all' | 'income' | 'expense') => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

type SortField = 'date' | 'description' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
  onResolveReview,
  onResetToOriginal,
  filterNeedsReviewOnly,
  onToggleNeedsReviewFilter,
  flowFilter: externalFlowFilter,
  onFlowFilterChange,
  selectedCategory: externalSelectedCategory,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<string>('all');
  const selectedCategory =
    externalSelectedCategory !== undefined ? externalSelectedCategory : internalSelectedCategory;

  const handleCategoryChange = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      setInternalSelectedCategory(cat);
    }
  };

  const [internalFlowFilter, setInternalFlowFilter] = useState<'all' | 'income' | 'expense'>('all');
  const flowFilter = externalFlowFilter !== undefined ? externalFlowFilter : internalFlowFilter;

  const handleFlowFilterChange = (val: 'all' | 'income' | 'expense') => {
    if (onFlowFilterChange) {
      onFlowFilterChange(val);
    } else {
      setInternalFlowFilter(val);
    }
  };

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // State for Add Row modal / drawer
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<TransactionRow>>({
    date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
    description: '',
    amount: -100,
    category: 'Other',
    notes: '',
  });

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Helper to parse DD/MM/YYYY into timestamp for sorting
  const parseDateToTime = (dStr: string): number => {
    const parts = dStr.split(/[/.-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day).getTime();
      }
    }
    return 0;
  };

  // Filtered and sorted transactions
  const processedTransactions = useMemo(() => {
    let list = [...transactions];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.notes.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.date.includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category === selectedCategory);
    }

    // Income / Expense filter
    if (flowFilter === 'income') {
      list = list.filter((t) => t.amount > 0);
    } else if (flowFilter === 'expense') {
      list = list.filter((t) => t.amount < 0);
    }

    // Needs review filter
    if (filterNeedsReviewOnly) {
      list = list.filter((t) => t.needsReview);
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = parseDateToTime(a.date) - parseDateToTime(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'description') {
        comparison = a.description.localeCompare(b.description);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [
    transactions,
    searchQuery,
    selectedCategory,
    flowFilter,
    filterNeedsReviewOnly,
    sortField,
    sortOrder,
  ]);

  const handleSaveNewRow = () => {
    if (!newRowData.description?.trim()) {
      alert('Please enter a description for the transaction');
      return;
    }

    const newTx: TransactionRow = {
      id: `tx-user-${Date.now()}`,
      date: newRowData.date || new Date().toLocaleDateString('en-GB'),
      description: newRowData.description.trim(),
      amount: Number(newRowData.amount) || 0,
      category: (newRowData.category as TransactionCategory) || 'Other',
      notes: newRowData.notes?.trim() || '',
      needsReview: false,
    };

    onAddTransaction(newTx);
    setIsAddingRow(false);
    setNewRowData({
      date: new Date().toLocaleDateString('en-GB'),
      description: '',
      amount: -100,
      category: 'Other',
      notes: '',
    });
  };

  // Summary totals for table header badges
  const totalTableCredits = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);
  const totalTableDebits = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const tableCreditCount = transactions.filter((t) => t.amount > 0).length;
  const tableDebitCount = transactions.filter((t) => t.amount < 0).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Table Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              Extracted Transactions
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {processedTransactions.length} of {transactions.length} rows
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {tableCreditCount} Credits (+₹{totalTableCredits.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {tableDebitCount} Debits (-₹{totalTableDebits.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Editable table with real-time validation. Double-click or click any cell to edit.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddingRow(!isAddingRow)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>

          {onResetToOriginal && (
            <button
              type="button"
              onClick={onResetToOriginal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Reset all manual edits back to original OCR"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-white text-xs rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {TRANSACTION_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Flow Filter */}
        <div>
          <select
            value={flowFilter}
            onChange={(e) => handleFlowFilterChange(e.target.value as any)}
            className="w-full px-3 py-1.5 bg-white text-xs rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">All Flows (Credits & Debits)</option>
            <option value="income">Income / Credits Only (+)</option>
            <option value="expense">Expenses / Debits Only (-)</option>
          </select>
        </div>

        {/* Needs Review Filter Toggle */}
        <div>
          <button
            type="button"
            onClick={onToggleNeedsReviewFilter}
            className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
              filterNeedsReviewOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filterNeedsReviewOnly ? 'text-white' : 'text-amber-500'}`} />
            <span>Needs Review {filterNeedsReviewOnly ? '(Active)' : ''}</span>
          </button>
        </div>
      </div>

      {/* Add Row Inline Panel */}
      {isAddingRow && (
        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Add New Transaction
            </span>
            <button
              type="button"
              onClick={() => setIsAddingRow(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="text"
                value={newRowData.date || ''}
                onChange={(e) => setNewRowData({ ...newRowData, date: e.target.value })}
                placeholder="DD/MM/YYYY"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={newRowData.description || ''}
                onChange={(e) => setNewRowData({ ...newRowData, description: e.target.value })}
                placeholder="Narration, merchant, or transfer ref"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Amount (+/-)</label>
              <input
                type="number"
                step="0.01"
                value={newRowData.amount || ''}
                onChange={(e) => setNewRowData({ ...newRowData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="-500.00"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={newRowData.category || 'Other'}
                onChange={(e) => setNewRowData({ ...newRowData, category: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {TRANSACTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <input
              type="text"
              value={newRowData.notes || ''}
              onChange={(e) => setNewRowData({ ...newRowData, notes: e.target.value })}
              placeholder="Optional notes (e.g. Online order, Electricity bill)"
              className="w-2/3 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
            />
            <button
              type="button"
              onClick={handleSaveNewRow}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Save Transaction
            </button>
          </div>
        </div>
      )}

      {/* The Editable Transactions Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors w-32"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {sortField === 'date' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('description')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors min-w-[240px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Description</span>
                  {sortField === 'description' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors w-36 text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Amount</span>
                  {sortField === 'amount' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors w-40"
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  {sortField === 'category' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 min-w-[200px]">Notes</th>
              <th className="py-3 px-4 w-20 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
            {processedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-500">No transactions match your filter</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the search keyword or filters</p>
                </td>
              </tr>
            ) : (
              processedTransactions.map((tx, idx) => {
                const isIncome = tx.amount > 0;
                const isExpense = tx.amount < 0;

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      tx.needsReview ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Date (Editable) */}
                    <td className="py-2 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={tx.date}
                          onChange={(e) => onUpdateTransaction(tx.id, 'date', e.target.value)}
                          placeholder="DD/MM/YYYY"
                          className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs transition-colors"
                        />
                        {tx.needsReview && (
                          <div
                            title={tx.reviewReason || 'Check extracted date'}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Description (Editable) */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={tx.description}
                        onChange={(e) => onUpdateTransaction(tx.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-900 transition-colors"
                      />
                    </td>

                    {/* Amount (Editable) */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-mono">
                        <input
                          type="number"
                          step="0.01"
                          value={tx.amount}
                          onChange={(e) =>
                            onUpdateTransaction(tx.id, 'amount', parseFloat(e.target.value) || 0)
                          }
                          className={`w-28 text-right px-2 py-1 bg-transparent hover:bg-white focus:bg-white rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold text-xs transition-colors ${
                            isIncome
                              ? 'text-emerald-700'
                              : isExpense
                              ? 'text-rose-700'
                              : 'text-slate-600'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Category (Dropdown) */}
                    <td className="py-2 px-3">
                      <select
                        value={tx.category}
                        onChange={(e) =>
                          onUpdateTransaction(tx.id, 'category', e.target.value as TransactionCategory)
                        }
                        className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700 transition-colors"
                      >
                        {TRANSACTION_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Notes (Editable) */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={tx.notes}
                        onChange={(e) => onUpdateTransaction(tx.id, 'notes', e.target.value)}
                        placeholder="Add note..."
                        className="w-full px-2 py-1 bg-transparent hover:bg-white focus:bg-white rounded border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-600 placeholder:text-slate-300 transition-colors"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {tx.needsReview && (
                          <button
                            type="button"
                            onClick={() => onResolveReview(tx.id)}
                            title="Mark as reviewed and verified"
                            className="p-1 text-amber-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          title="Delete transaction"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Instructions */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-1 gap-2">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Positive values = Income/Credit</span>
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block ml-2" />
          <span>Negative values = Expenses/Debit</span>
        </span>
        <span>Click any text or number to edit inline</span>
      </div>
    </div>
  );
};
