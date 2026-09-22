import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Zap,
  Package,
  Wrench,
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Filter,
} from 'lucide-react';
import {
  formatINR,
  formatDate,
  getCurrentMonthString,
  getTodayDateString,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '../utils/formatters';
import { api } from '../services/api';

export default function Expenses({
  settings,
  onRefreshStats,
  showToast,
  onEditTransaction,
}) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [expensesData, setExpensesData] = useState(null);
  const [rentData, setRentData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manual expense form
  const [expDate, setExpDate] = useState(getTodayDateString());
  const [expCategory, setExpCategory] = useState('supplies');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category filter for expense history
  const [filterCategory, setFilterCategory] = useState('all');

  const loadAllExpenseData = async (month) => {
    try {
      setLoading(true);
      const [expRes, rentRes] = await Promise.all([
        api.getExpenses(month),
        api.getRentDays(month),
      ]);
      if (expRes.success) setExpensesData(expRes);
      if (rentRes.success) setRentData(rentRes);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllExpenseData(selectedMonth);
  }, [selectedMonth]);

  // Month navigation
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

  // Add Manual Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(expAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid expense amount.', 'error');
      return;
    }
    if (!expDesc.trim()) {
      showToast('Please enter an expense description.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createTransaction({
        date: expDate,
        type: 'expense',
        category: expCategory,
        description: expDesc.trim(),
        quantity: 1,
        rate: amountNum,
        amount: amountNum,
      });

      showToast(`Expense added: ${formatINR(amountNum)} (${CATEGORY_LABELS[expCategory]})`, 'success');
      setExpDesc('');
      setExpAmount('');
      loadAllExpenseData(selectedMonth);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Rent Day (Yes / No)
  const handleToggleRentDay = async (dayItem) => {
    const newApplicable = dayItem.applicable === 1 ? 0 : 1;
    try {
      await api.toggleRentDay(dayItem.date, newApplicable, '');
      loadAllExpenseData(selectedMonth);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Rent Actions
  const handleBulkRent = async (action) => {
    try {
      await api.bulkUpdateRentDays(selectedMonth, action);
      showToast('Rent days updated', 'success');
      loadAllExpenseData(selectedMonth);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.deleteTransaction(id);
      showToast('Expense deleted', 'success');
      loadAllExpenseData(selectedMonth);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const manualExpenses = expensesData?.manualExpenses || [];
  const filteredManualExpenses =
    filterCategory === 'all'
      ? manualExpenses
      : manualExpenses.filter((e) => e.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Month Navigation & Overview Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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

        {/* Total Monthly Expenses Banner */}
        <div className="flex items-center gap-4 bg-rose-50 border border-rose-100 px-5 py-2.5 rounded-2xl">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
              Total Monthly Expenses
            </span>
            <div className="text-2xl font-black text-rose-800">
              {formatINR(expensesData?.totalMonthlyExpenses || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main Recurring Expenses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Staff Salary */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Staff Salary</h4>
                <p className="text-xs text-slate-500">1 Staff Member</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Recurring Monthly
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-500 block mb-1">Monthly Salary:</span>
            <div className="text-2xl font-black text-slate-900">
              {formatINR(settings?.staff_salary_monthly || 15600)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Automatically included in financial calculations for each month.
            </p>
          </div>
        </div>

        {/* 2. Rent Calculation System */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Studio Rent</h4>
                <p className="text-xs text-slate-500">Day-based tracking</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
              ₹{settings?.rent_daily_rate || 600} / day
            </span>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-slate-500">Calculated Rent Total:</span>
              <span className="text-xs font-semibold text-rose-700">
                {rentData?.totalRentDays || 0} active days
              </span>
            </div>
            <div className="text-2xl font-black text-rose-700">
              {formatINR(rentData?.totalRentAmount || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Formula: {rentData?.totalRentDays || 0} days × ₹{settings?.rent_daily_rate || 600}
            </p>
          </div>
        </div>

        {/* 3. Electricity */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Electricity</h4>
                <p className="text-xs text-slate-500">Current & Power</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              Recurring Monthly
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs text-slate-500 block mb-1">Monthly Bill:</span>
            <div className="text-2xl font-black text-slate-900">
              {formatINR(settings?.electricity_monthly || 1500)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Monthly electricity expense included in total financial overhead.
            </p>
          </div>
        </div>
      </div>

      {/* Rent Day Tracking Calendar / Grid */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Rent-Day Tracking System</span>
            </h4>
            <p className="text-xs text-slate-500">
              Mark which days the ₹{settings?.rent_daily_rate || 600} daily rent applies. Click any day to toggle Yes/No.
            </p>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkRent('all_yes')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              All Days (Yes)
            </button>
            <button
              onClick={() => handleBulkRent('exclude_sundays')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Exclude Sundays
            </button>
            <button
              onClick={() => handleBulkRent('all_no')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold transition-colors"
            >
              Clear All (No)
            </button>
          </div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-2">
          {rentData?.days?.map((d) => {
            const isApplicable = d.applicable === 1;
            const dateObj = new Date(d.date);
            const dayOfWeekName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => handleToggleRentDay(d)}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isApplicable
                    ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100 text-rose-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-medium opacity-80 mb-1">
                  <span>Day {d.day}</span>
                  <span>{dayOfWeekName}</span>
                </div>
                <div className="font-bold text-xs">
                  {isApplicable ? 'Yes' : 'No'}
                </div>
                <div className="text-[10px] mt-0.5 font-semibold">
                  {isApplicable ? `₹${d.dailyRate}` : '₹0'}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Active Rent Days: <strong className="text-slate-800">{rentData?.totalRentDays} of {rentData?.totalDaysInMonth} days</strong></span>
          <span>Accrued Rent: <strong className="text-rose-700 font-bold">{formatINR(rentData?.totalRentAmount)}</strong></span>
        </div>
      </div>

      {/* Manual Expense Entry Form & Expense History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-base text-slate-900">Add Manual Expense</h4>
          </div>

          <form onSubmit={handleAddExpense} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="supplies">Studio Supplies (Photo paper, toner, ink)</option>
                <option value="maintenance">Maintenance & Repairs</option>
                <option value="staff_salary">Staff Salary (Additional)</option>
                <option value="electricity">Electricity (Additional)</option>
                <option value="rent">Rent (Additional)</option>
                <option value="other">Other Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. 500 sheets 4x6 glossy paper"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 450, 1200"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </form>
        </div>

        {/* Expense History Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-base text-slate-900">Manual Expenses History</h4>
              <p className="text-xs text-slate-500">
                {filteredManualExpenses.length} manual expenses in {selectedMonth}
              </p>
            </div>

            {/* Filter by Category */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="supplies">Supplies</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {filteredManualExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredManualExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${CATEGORY_COLORS[exp.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {CATEGORY_LABELS[exp.category] || exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-700 max-w-[200px] truncate">
                        {exp.description}
                      </td>
                      <td className="py-2.5 text-right font-bold text-rose-700 whitespace-nowrap">
                        -{formatINR(exp.amount)}
                      </td>
                      <td className="py-2.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => onEditTransaction(exp)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <Receipt className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No manual expenses logged for this month yet.</p>
              <p className="text-[11px] text-slate-400">
                Staff salary and rent are automatically tracked above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
