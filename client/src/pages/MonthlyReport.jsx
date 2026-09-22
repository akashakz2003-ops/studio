import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Zap,
  Camera,
  Copy,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import {
  formatINR,
  formatDate,
  getCurrentMonthString,
} from '../utils/formatters';
import { api } from '../services/api';

export default function MonthlyReport({
  settings,
  showToast,
  onNavigateDate,
}) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async (month) => {
    try {
      setLoading(true);
      const res = await api.getMonthlyReport(month);
      if (res.success) {
        setReport(res);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedMonth);
  }, [selectedMonth]);

  // Month Navigation
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  // Formatted Month Header
  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthDateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const formattedMonthName = monthDateObj.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const [y, m] = selectedMonth.split('-');
    const startDate = `${selectedMonth}-01`;
    const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
    const endDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
    window.open(`/api/export?startDate=${startDate}&endDate=${endDate}`, '_blank');
  };

  const income = report?.income;
  const expenses = report?.expenses;
  const result = report?.result;
  const isProfitable = (result?.netProfit || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Top Bar: Month Selector & Export Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-sm text-slate-900 focus:outline-none"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header (Visible in print or screen) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs print-card space-y-6">
        {/* Studio Statement Header */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-600">
              Monthly Financial Statement
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">
              {settings?.business_name || 'Photo & Photostat Studio'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Statement of Income, Operating Expenses & Net Profit for <strong>{formattedMonthName}</strong>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Report Generated:</span>
            <span className="text-xs font-semibold text-slate-700">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* 3 Columns Statement Grid: Income, Expenses, Final Result */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Income Column */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wider border-b border-emerald-200/60 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Income</span>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Passport Photo:</span>
                <span className="font-bold text-slate-900">{formatINR(income?.passport || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Photostat:</span>
                <span className="font-bold text-slate-900">{formatINR(income?.photostat || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Income:</span>
                <span className="font-bold text-slate-900">{formatINR(income?.other || 0)}</span>
              </div>

              <div className="pt-2.5 border-t border-emerald-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Total Income:</span>
                <span className="text-base text-emerald-700">{formatINR(income?.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Expenses Column */}
          <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm uppercase tracking-wider border-b border-rose-200/60 pb-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>Expenses</span>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Staff Salary:</span>
                <span className="font-bold text-slate-900">{formatINR(expenses?.staffSalary || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rent ({expenses?.rentDays || 0} days):</span>
                <span className="font-bold text-slate-900">{formatINR(expenses?.rent || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Electricity:</span>
                <span className="font-bold text-slate-900">{formatINR(expenses?.electricity || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Expenses:</span>
                <span className="font-bold text-slate-900">{formatINR(expenses?.otherExpenses || 0)}</span>
              </div>

              <div className="pt-2.5 border-t border-rose-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Total Expenses:</span>
                <span className="text-base text-rose-700">{formatINR(expenses?.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Final Result Column */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm uppercase tracking-wider border-b border-indigo-200/60 pb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Final Result</span>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Gross Revenue:</span>
                <span className="font-bold text-slate-900">{formatINR(result?.grossRevenue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expenses:</span>
                <span className="font-bold text-slate-900">{formatINR(result?.totalExpenses || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Profit Margin:</span>
                <span className="font-bold text-indigo-700">{result?.profitMargin || 0}%</span>
              </div>

              <div className="pt-2.5 border-t border-indigo-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                <span>Net Profit:</span>
                <span className={`text-base font-black ${isProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatINR(result?.netProfit || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily History Table */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Daily Financial Breakdown</h3>
            <span className="text-xs text-slate-500 font-medium no-print">Click any day to jump to its sales details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3 text-right">Passport</th>
                  <th className="py-2.5 px-3 text-right">Photostat</th>
                  <th className="py-2.5 px-3 text-right">Other</th>
                  <th className="py-2.5 px-3 text-right font-black text-emerald-800">Revenue</th>
                  <th className="py-2.5 px-3 text-center">Rent</th>
                  <th className="py-2.5 px-3 text-right font-black text-rose-800">Expenses</th>
                  <th className="py-2.5 px-3 text-right font-black">Net Profit</th>
                  <th className="py-2.5 px-3 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.dailyHistory?.map((day) => {
                  const isDayProfitable = day.profit >= 0;
                  const hasActivity = day.revenue > 0 || day.expenses > 0;
                  return (
                    <tr
                      key={day.date}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasActivity ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold whitespace-nowrap text-slate-800">
                        {day.date.substring(8, 10)} {formattedMonthName.substring(0, 3)}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {day.dayName}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatINR(day.passport)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatINR(day.photostat)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {formatINR(day.other)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {formatINR(day.revenue)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            day.rentApplicable
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {day.rentApplicable ? '₹600' : '—'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700 whitespace-nowrap">
                        {formatINR(day.expenses)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-black whitespace-nowrap ${
                          isDayProfitable ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatINR(day.profit)}
                      </td>
                      <td className="py-2 px-3 text-center no-print">
                        <button
                          onClick={() => onNavigateDate?.(day.date)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5"
                          title="View day sales"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Signature footer */}
        <div className="pt-8 border-t border-slate-200 print-only">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <div>
              <p>Generated by Studio Financial Ledger</p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-400 mb-1" />
              <p>Authorized Signature / Studio Owner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
