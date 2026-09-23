import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Clock,
  Camera,
  Copy,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  formatINR,
  formatDate,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '../utils/formatters';

const REVENUE_COLORS = ['#6366f1', '#10b981', '#06b6d4'];
const EXPENSE_COLORS = ['#f59e0b', '#f43f5e', '#eab308', '#a855f7', '#f97316', '#64748b'];

export default function Dashboard({
  stats,
  settings,
  onOpenQuickSale,
  onEditTransaction,
  onNavigate,
  onSeedSample,
  onRefresh,
}) {
  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs my-8 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Loading Studio Financials...</h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Retrieving sales data, rent tracking records, and operating calculations.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Refresh Data
          </button>
        )}
      </div>
    );
  }

  const { today, thisMonth, revenueBreakdown, expenseBreakdown, insights, recentTransactions } = stats;

  // Prepare Revenue chart data
  const revenueChartData = [
    { name: 'Passport Photos', value: revenueBreakdown?.passport || 0, percentage: revenueBreakdown?.passportPercentage || 0 },
    { name: 'Photostat', value: revenueBreakdown?.photostat || 0, percentage: revenueBreakdown?.photostatPercentage || 0 },
    { name: 'Other Income', value: revenueBreakdown?.other || 0, percentage: revenueBreakdown?.otherPercentage || 0 },
  ].filter(item => item.value > 0);

  // Prepare Expense chart data
  const expenseChartData = [
    { name: 'Staff Salary', value: expenseBreakdown?.staffSalary || 0 },
    { name: `Rent (${expenseBreakdown?.rentDays || 0}d)`, value: expenseBreakdown?.rent || 0 },
    { name: 'Electricity', value: expenseBreakdown?.electricity || 0 },
    { name: 'Supplies', value: expenseBreakdown?.supplies || 0 },
    { name: 'Maintenance', value: expenseBreakdown?.maintenance || 0 },
    { name: 'Other', value: expenseBreakdown?.other || 0 },
  ].filter(item => item.value > 0);

  const isTodayProfitable = today?.netProfit >= 0;
  const isMonthProfitable = thisMonth?.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Studio Financial Summary</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {settings?.business_name || 'Photo & Photostat Studio'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Track daily sales, monitor operating expenses, and calculate net profits automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Add Today's Sales</span>
          </button>
        </div>
      </div>

      {/* KPI Section 1: Today's Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Today's Overview ({formatDate(today?.date)})</span>
          </h3>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Open Daily Sales →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today's Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Revenue</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {formatINR(today?.revenue || 0)}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span>Passport: <strong className="text-slate-700">{formatINR(today?.passport || 0)}</strong></span>
              <span>•</span>
              <span>Photostat: <strong className="text-slate-700">{formatINR(today?.photostat || 0)}</strong></span>
            </div>
          </div>

          {/* Today's Expenses */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Expenses</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {formatINR(today?.expenses || 0)}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {today?.rentApplicable ? (
                <span className="text-slate-600">Rent Applicable: <strong>₹{today?.dailyRent}</strong></span>
              ) : (
                <span className="text-emerald-600 font-semibold">Rent Waived Today (₹0)</span>
              )}
            </div>
          </div>

          {/* Today's Net Profit */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Net Profit</span>
              <div className={`p-2 rounded-xl ${isTodayProfitable ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {isTodayProfitable ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold ${isTodayProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatINR(today?.netProfit || 0)}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Daily Revenue − Daily Expenses
            </div>
          </div>
        </div>
      </div>

      {/* KPI Section 2: This Month's Performance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>This Month ({thisMonth?.month})</span>
          </h3>
          <button
            onClick={() => onNavigate('reports')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            View Full Report →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Total Revenue
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatINR(thisMonth?.revenue || 0)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Gross studio sales</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Total Expenses
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatINR(thisMonth?.expenses || 0)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Salary, rent & bills</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Net Profit
            </span>
            <div className={`text-xl sm:text-2xl font-black ${isMonthProfitable ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatINR(thisMonth?.netProfit || 0)}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Revenue − Expenses</span>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Profit Margin
            </span>
            <div className={`text-xl sm:text-2xl font-black ${isMonthProfitable ? 'text-indigo-600' : 'text-slate-600'}`}>
              {thisMonth?.profitMargin || 0}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">(Profit ÷ Revenue)</span>
          </div>
        </div>
      </div>

      {/* Smart Financial Insights Box */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 rounded-3xl p-5 border border-indigo-100 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-indigo-600 text-white rounded-xl">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Smart Financial Insights</h4>
          <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-full ml-auto">
            Live Analysis
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
          {insights && insights.length > 0 ? (
            insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-indigo-50 shadow-2xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <span className="font-medium">{insight}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 col-span-2">Enter your daily sales to see real-time insights.</p>
          )}
        </div>
      </div>

      {/* Visual Charts: Revenue Breakdown & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-base text-slate-900">Revenue Breakdown</h4>
              <p className="text-xs text-slate-500">Contribution of each studio income stream</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
              Total: {formatINR(revenueBreakdown?.total || 0)}
            </span>
          </div>

          {revenueChartData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <div className="w-full sm:w-1/2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {revenueChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatINR(val)}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full sm:w-1/2 space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="font-medium text-slate-700">Passport Photos</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatINR(revenueBreakdown?.passport || 0)}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({revenueBreakdown?.passportPercentage}%)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-medium text-slate-700">Photostat Copies</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatINR(revenueBreakdown?.photostat || 0)}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({revenueBreakdown?.photostatPercentage}%)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="font-medium text-slate-700">Other Income</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatINR(revenueBreakdown?.other || 0)}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({revenueBreakdown?.otherPercentage}%)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <Camera className="w-10 h-10 mb-2 text-slate-300 stroke-1" />
              <p className="text-xs">No income recorded for this month yet.</p>
              <button
                onClick={onOpenQuickSale}
                className="mt-3 text-xs text-indigo-600 hover:underline font-semibold"
              >
                + Record today's first sale
              </button>
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-base text-slate-900">Expense Breakdown</h4>
              <p className="text-xs text-slate-500">Staff, rent, electricity, and studio overheads</p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
              Total: {formatINR(expenseBreakdown?.total || 0)}
            </span>
          </div>

          {expenseChartData.length > 0 ? (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(val) => formatINR(val)}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]}>
                      {expenseChartData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Salary</span>
                  <strong className="text-slate-800">{formatINR(expenseBreakdown?.staffSalary)}</strong>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Rent ({expenseBreakdown?.rentDays}d)</span>
                  <strong className="text-slate-800">{formatINR(expenseBreakdown?.rent)}</strong>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">Electricity</span>
                  <strong className="text-slate-800">{formatINR(expenseBreakdown?.electricity)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <Receipt className="w-10 h-10 mb-2 text-slate-300 stroke-1" />
              <p className="text-xs">No expenses recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-base text-slate-900">Recent Transactions</h4>
            <p className="text-xs text-slate-500">Latest income and expense entries</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            View All ({recentTransactions?.length || 0}) →
          </button>
        </div>

        {recentTransactions && recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Description</th>
                  <th className="pb-2.5 text-right">Amount</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${CATEGORY_COLORS[tx.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {CATEGORY_LABELS[tx.category] || tx.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-700 truncate max-w-[200px]">
                        {tx.description || '—'}
                      </td>
                      <td className={`py-2.5 text-right font-bold whitespace-nowrap ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isIncome ? `+${formatINR(tx.amount)}` : `-${formatINR(tx.amount)}`}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs mb-3">No transactions recorded yet.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={onOpenQuickSale}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                + Add Today's Sales
              </button>
              {onSeedSample && (
                <button
                  onClick={onSeedSample}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Load Sample Month Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
