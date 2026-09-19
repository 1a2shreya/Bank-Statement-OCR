import React, { useState, useMemo } from 'react';
import { TransactionRow, TransactionCategory, TRANSACTION_CATEGORIES } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Filter,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';

interface CategoryAnalyticsProps {
  transactions: TransactionRow[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

// Sophisticated, distinct color palette for financial categories
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316', // Orange
  Shopping: '#ec4899', // Pink
  'Bills & Utilities': '#0284c7', // Sky blue
  Rent: '#8b5cf6', // Violet
  Transportation: '#eab308', // Yellow
  Healthcare: '#ef4444', // Red
  Education: '#3b82f6', // Blue
  Entertainment: '#d946ef', // Fuchsia
  Travel: '#14b8a6', // Teal
  'EMI/Loan': '#dc2626', // Deep red
  'Bank Charges': '#64748b', // Slate
  'ATM/Cash Withdrawal': '#f59e0b', // Amber
  Transfer: '#6366f1', // Indigo
  Investment: '#10b981', // Emerald
  Insurance: '#06b6d4', // Cyan
  Income: '#16a34a', // Green
  UPI: '#0ea5e9', // Light blue
  Other: '#94a3b8', // Gray
};

const DEFAULT_COLOR = '#64748b';

interface CategoryDataPoint {
  category: string;
  amount: number;
  formattedAmount: string;
  count: number;
  percentage: number;
  color: string;
}

export const CategoryAnalytics: React.FC<CategoryAnalyticsProps> = ({
  transactions,
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const [activeFlow, setActiveFlow] = useState<'expense' | 'income' | 'all'>('expense');
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Compute category distributions
  const { categoryData, totalFlowAmount, topCategory } = useMemo(() => {
    // Filter transactions based on activeFlow
    const filtered = transactions.filter((t) => {
      if (activeFlow === 'expense') return t.amount < 0;
      if (activeFlow === 'income') return t.amount > 0;
      return true;
    });

    const categoryMap: Record<string, { total: number; count: number }> = {};

    filtered.forEach((t) => {
      const cat = t.category || 'Other';
      const absAmount = Math.abs(t.amount);
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, count: 0 };
      }
      categoryMap[cat].total += absAmount;
      categoryMap[cat].count += 1;
    });

    const total = Object.values(categoryMap).reduce((acc, curr) => acc + curr.total, 0);

    const sortedData: CategoryDataPoint[] = Object.entries(categoryMap)
      .map(([cat, data]) => ({
        category: cat,
        amount: Math.round(data.total * 100) / 100,
        formattedAmount: (Math.round(data.total * 100) / 100).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        count: data.count,
        percentage: total > 0 ? Math.round((data.total / total) * 1000) / 10 : 0,
        color: CATEGORY_COLORS[cat] || DEFAULT_COLOR,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      categoryData: sortedData,
      totalFlowAmount: total,
      topCategory: sortedData[0] || null,
    };
  }, [transactions, activeFlow]);

  // Handle category selection toggle
  const handleCategoryClick = (cat: string) => {
    if (!onSelectCategory) return;
    if (selectedCategory === cat) {
      onSelectCategory('all');
    } else {
      onSelectCategory(cat);
    }
  };

  const activeCategoryData = useMemo(() => {
    if (hoveredCategory) {
      return categoryData.find((c) => c.category === hoveredCategory);
    }
    if (selectedCategory && selectedCategory !== 'all') {
      return categoryData.find((c) => c.category === selectedCategory);
    }
    return topCategory;
  }, [categoryData, hoveredCategory, selectedCategory, topCategory]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Header with Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Category Analytics & Breakdown</h3>
              <p className="text-xs text-slate-500">
                Visual analysis of transaction distribution across financial categories.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Flow Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveFlow('expense')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFlow === 'expense'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              Expenses
            </button>
            <button
              type="button"
              onClick={() => setActiveFlow('income')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFlow === 'income'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Income
            </button>
            <button
              type="button"
              onClick={() => setActiveFlow('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFlow === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              All
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-lg text-slate-600 transition-all ${
                chartType === 'donut' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Donut Chart View"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-slate-600 transition-all ${
                chartType === 'bar' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Bar Chart View"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Filter Notice */}
      {selectedCategory !== 'all' && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              Filtering table by category: <strong className="font-semibold">{selectedCategory}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectCategory && onSelectCategory('all')}
            className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-950 font-semibold text-xs"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filter
          </button>
        </div>
      )}

      {categoryData.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm font-medium">No {activeFlow} transactions found in statement.</p>
          <p className="text-xs text-slate-400 mt-1">
            Try switching to another flow view or verifying extraction.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Chart Column */}
          <div className="lg:col-span-7 h-72 sm:h-80 relative flex items-center justify-center">
            {chartType === 'donut' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="84%"
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                    onMouseEnter={(_, index) => setHoveredCategory(categoryData[index]?.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={(entry: any) => handleCategoryClick(entry?.category || entry?.payload?.category || '')}
                    cursor="pointer"
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={`cell-${entry.category}`}
                        fill={entry.color}
                        stroke={selectedCategory === entry.category ? '#1e1b4b' : '#ffffff'}
                        strokeWidth={selectedCategory === entry.category ? 3 : 2}
                        opacity={
                          selectedCategory !== 'all' && selectedCategory !== entry.category
                            ? 0.45
                            : 1
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                      String(name),
                    ]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '10px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    width={90}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                      'Amount',
                    ]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '10px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    radius={[0, 6, 6, 0]}
                    cursor="pointer"
                    onClick={(entry: any) => handleCategoryClick(entry?.category || entry?.payload?.category || '')}
                  >
                    {categoryData.slice(0, 8).map((entry) => (
                      <Cell
                        key={`bar-${entry.category}`}
                        fill={entry.color}
                        opacity={
                          selectedCategory !== 'all' && selectedCategory !== entry.category
                            ? 0.4
                            : 1
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Donut Center Display */}
            {chartType === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {activeCategoryData ? activeCategoryData.category : 'Total Volume'}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  ₹
                  {activeCategoryData
                    ? activeCategoryData.formattedAmount
                    : totalFlowAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {activeCategoryData
                    ? `${activeCategoryData.percentage}% • ${activeCategoryData.count} txns`
                    : `${categoryData.length} categories`}
                </span>
              </div>
            )}
          </div>

          {/* Category List & Quick Insights Column */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>Category Breakdown</span>
              <span>Share & Amount</span>
            </div>

            <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              {categoryData.map((item) => {
                const isSelected = selectedCategory === item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => handleCategoryClick(item.category)}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-md shrink-0 shadow-xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {item.count} {item.count === 1 ? 'transaction' : 'transactions'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900">₹{item.formattedAmount}</div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        {item.percentage}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Summary Pill Footer */}
            {topCategory && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Highest {activeFlow === 'expense' ? 'Spending' : 'Activity'}:
                </span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: topCategory.color }}
                  />
                  {topCategory.category} (₹{topCategory.formattedAmount})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
