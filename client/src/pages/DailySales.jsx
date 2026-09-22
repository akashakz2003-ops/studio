import React, { useState, useEffect } from 'react';
import {
  Camera,
  Copy,
  Sparkles,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Trash2,
  Edit2,
  CheckCircle2,
  IndianRupee,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';
import { api } from '../services/api';

export default function DailySales({
  settings,
  onRefreshStats,
  showToast,
  onEditTransaction,
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Passport Photo Form State
  const [passportQty, setPassportQty] = useState('');
  const [passportType, setPassportType] = useState('new'); // 'new' | 'reprint'
  const [isSubmittingPassport, setIsSubmittingPassport] = useState(false);

  // Photostat Form State
  const [photostatCopies, setPhotostatCopies] = useState('');
  const [isSubmittingPhotostat, setIsSubmittingPhotostat] = useState(false);

  // Other Income Form State
  const [otherDesc, setOtherDesc] = useState('');
  const [otherAmount, setOtherAmount] = useState('');
  const [isSubmittingOther, setIsSubmittingOther] = useState(false);

  // Load Daily Sales Data
  const loadDailySales = async (date) => {
    try {
      setLoading(true);
      const res = await api.getDailySales(date);
      if (res.success) {
        setDailyData(res);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailySales(selectedDate);
  }, [selectedDate]);

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayDateString());
  };

  // Pricing calculations
  const baseQty = settings?.passport_base_qty || 4;
  const basePrice = settings?.passport_base_price || 200;
  const reprintPrice = settings?.passport_reprint_price || 100;
  const photostatRate = settings?.photostat_price_per_copy || 4;

  const pQtyNum = Math.max(0, parseInt(passportQty, 10) || 0);
  const passportRate =
    passportType === 'reprint' ? reprintPrice : basePrice / baseQty;
  const passportCalculatedTotal =
    passportType === 'reprint'
      ? pQtyNum * reprintPrice
      : Math.round((pQtyNum / baseQty) * basePrice);

  const copiesNum = Math.max(0, parseInt(photostatCopies, 10) || 0);
  const photostatCalculatedTotal = copiesNum * photostatRate;

  // 1. Add Passport Photo Sale
  const handleAddPassportSale = async (e) => {
    e.preventDefault();
    if (pQtyNum <= 0) {
      showToast('Please enter a valid quantity of photos.', 'error');
      return;
    }

    try {
      setIsSubmittingPassport(true);
      const desc =
        passportType === 'reprint'
          ? `Passport photos (from digital / reprint) - ${pQtyNum} photos`
          : `Passport photos (new) - ${pQtyNum} photos`;

      await api.createTransaction({
        date: selectedDate,
        type: 'income',
        category: 'passport',
        description: desc,
        quantity: pQtyNum,
        rate: passportRate,
        amount: passportCalculatedTotal,
      });

      showToast(`Added ${pQtyNum} passport photos: ${formatINR(passportCalculatedTotal)}`, 'success');
      setPassportQty('');
      loadDailySales(selectedDate);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingPassport(false);
    }
  };

  // 2. Add Photostat Sale
  const handleAddPhotostatSale = async (e) => {
    e.preventDefault();
    if (copiesNum <= 0) {
      showToast('Please enter number of copies.', 'error');
      return;
    }

    try {
      setIsSubmittingPhotostat(true);
      await api.createTransaction({
        date: selectedDate,
        type: 'income',
        category: 'photostat',
        description: `Photostat copies - ${copiesNum} copies`,
        quantity: copiesNum,
        rate: photostatRate,
        amount: photostatCalculatedTotal,
      });

      showToast(`Added ${copiesNum} photostat copies: ${formatINR(photostatCalculatedTotal)}`, 'success');
      setPhotostatCopies('');
      loadDailySales(selectedDate);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingPhotostat(false);
    }
  };

  // 3. Add Other Income
  const handleAddOtherIncome = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(otherAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid positive amount.', 'error');
      return;
    }

    try {
      setIsSubmittingOther(true);
      const desc = otherDesc.trim() || 'Other studio income';
      await api.createTransaction({
        date: selectedDate,
        type: 'income',
        category: 'other_income',
        description: desc,
        quantity: 1,
        rate: amountNum,
        amount: amountNum,
      });

      showToast(`Added other income: ${formatINR(amountNum)}`, 'success');
      setOtherDesc('');
      setOtherAmount('');
      loadDailySales(selectedDate);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingOther(false);
    }
  };

  // Toggle Rent for this day
  const handleToggleRent = async () => {
    const newApplicable = dailyData?.rentApplicable ? 0 : 1;
    try {
      await api.toggleRentDay(selectedDate, newApplicable, '');
      showToast(
        newApplicable === 1
          ? `Rent marked applicable for ${formatDate(selectedDate)} (₹${settings?.rent_daily_rate})`
          : `Rent marked waived for ${formatDate(selectedDate)} (₹0)`,
        'info'
      );
      loadDailySales(selectedDate);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.deleteTransaction(id);
      showToast('Transaction deleted', 'success');
      loadDailySales(selectedDate);
      onRefreshStats?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Date Selector & Today's Total Revenue */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-sm text-slate-900 focus:outline-none"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {selectedDate !== getTodayDateString() && (
            <button
              onClick={handleSetToday}
              className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Selected Date Revenue & Profit Stats */}
        <div className="flex items-center gap-3 sm:gap-6 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Day's Revenue
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {formatINR(dailyData?.totalRevenue || 0)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Day's Net Profit
            </span>
            <div
              className={`text-xl sm:text-2xl font-black ${
                (dailyData?.dailyProfit || 0) >= 0 ? 'text-indigo-700' : 'text-rose-700'
              }`}
            >
              {formatINR(dailyData?.dailyProfit || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Income Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Passport Photos */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Passport Photo</h4>
                  <p className="text-xs text-slate-500">Auto calculated rates</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                {baseQty} for ₹{basePrice}
              </span>
            </div>

            {/* Mode: New vs Digital Reprint */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPassportType('new')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  passportType === 'new'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Newly Taken
              </button>
              <button
                type="button"
                onClick={() => setPassportType('reprint')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                  passportType === 'reprint'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Reprint (₹{reprintPrice})
              </button>
            </div>

            <form onSubmit={handleAddPassportSale} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Number of Photos / Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 4, 8, 12, 16..."
                  value={passportQty}
                  onChange={(e) => setPassportQty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick increment buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[4, 8, 12, 16, 24].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setPassportQty(String(q))}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-slate-700 transition-colors"
                  >
                    {q} photos
                  </button>
                ))}
              </div>

              {/* Live Rate and Subtotal Preview Box */}
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Quantity:</span>
                  <span className="font-bold text-slate-900">{pQtyNum || 0} photos</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rate:</span>
                  <span className="font-medium text-slate-800">
                    {passportType === 'reprint'
                      ? `₹${reprintPrice}/reprint`
                      : `₹${passportRate}/photo (₹${basePrice} per ${baseQty})`}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-indigo-200 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total:</span>
                  <span className="text-base text-indigo-700 font-extrabold">
                    {formatINR(passportCalculatedTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassport || pQtyNum <= 0}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Sale</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Photostat */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Photostat</h4>
                  <p className="text-xs text-slate-500">Fast copy calculation</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                ₹{photostatRate} / copy
              </span>
            </div>

            <div className="mb-4 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Standard rate: <strong>₹{photostatRate} per copy</strong>. Enter count below.
            </div>

            <form onSubmit={handleAddPhotostatSale} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Number of Copies
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 10, 25, 50, 100..."
                  value={photostatCopies}
                  onChange={(e) => setPhotostatCopies(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick increment buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[10, 25, 50, 100, 200].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPhotostatCopies(String(c))}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-700 transition-colors"
                  >
                    {c} copies
                  </button>
                ))}
              </div>

              {/* Live Rate and Subtotal Preview Box */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Number of Copies:</span>
                  <span className="font-bold text-slate-900">{copiesNum || 0} copies</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rate per copy:</span>
                  <span className="font-medium text-slate-800">₹{photostatRate}</span>
                </div>
                <div className="pt-1.5 border-t border-emerald-200 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total:</span>
                  <span className="text-base text-emerald-700 font-extrabold">
                    {formatINR(photostatCalculatedTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPhotostat || copiesNum <= 0}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Sale</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card 3: Other Income */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Other Income</h4>
                  <p className="text-xs text-slate-500">Lamination, framing, etc.</p>
                </div>
              </div>
            </div>

            <div className="mb-4 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Optional section for manual or miscellaneous studio revenue.
            </div>

            <form onSubmit={handleAddOtherIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. A4 Lamination, Frame 8x10, Scanning"
                  value={otherDesc}
                  onChange={(e) => setOtherDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 50, 150, 500"
                    value={otherAmount}
                    onChange={(e) => setOtherAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Recorded as:</span>
                  <span className="font-medium text-slate-800">{otherDesc.trim() || 'Other Income'}</span>
                </div>
                <div className="pt-1.5 border-t border-cyan-200 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Amount:</span>
                  <span className="text-base text-cyan-700 font-extrabold">
                    {formatINR(parseFloat(otherAmount) || 0)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOther || !otherAmount || parseFloat(otherAmount) <= 0}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Income</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Daily Summary & Daily Transactions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clean Daily Summary Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-base text-slate-900">Day's Summary</h4>
            <span className="text-xs font-semibold text-slate-500">{formatDate(selectedDate)}</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between items-center">
              <span>Passport Photo Revenue:</span>
              <strong className="text-slate-900 font-bold text-sm">
                {formatINR(dailyData?.passportRevenue || 0)}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Photostat Revenue:</span>
              <strong className="text-slate-900 font-bold text-sm">
                {formatINR(dailyData?.photostatRevenue || 0)}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Other Income:</span>
              <strong className="text-slate-900 font-bold text-sm">
                {formatINR(dailyData?.otherRevenue || 0)}
              </strong>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Total Revenue:</span>
              <span className="text-lg text-emerald-700">{formatINR(dailyData?.totalRevenue || 0)}</span>
            </div>
          </div>

          {/* Daily Rent Status and Control */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Rent for this day:</span>
              </div>
              <button
                onClick={handleToggleRent}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  dailyData?.rentApplicable
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {dailyData?.rentApplicable ? 'Yes (₹600)' : 'No (Waived)'}
              </button>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>Daily Expenses Total:</span>
              <span className="font-semibold text-slate-800">
                {formatINR(dailyData?.totalDailyExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-100">
              <span className="font-bold text-slate-700">Daily Profit:</span>
              <span
                className={`font-black text-sm ${
                  (dailyData?.dailyProfit || 0) >= 0 ? 'text-indigo-700' : 'text-rose-700'
                }`}
              >
                {formatINR(dailyData?.dailyProfit || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Recorded on this Date */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-base text-slate-900">
                Transactions on {formatDate(selectedDate)}
              </h4>
              <p className="text-xs text-slate-500">
                {dailyData?.transactions?.length || 0} sales recorded for this date
              </p>
            </div>
          </div>

          {dailyData?.transactions && dailyData.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Qty</th>
                    <th className="pb-2 text-right">Rate</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dailyData.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                        {tx.category === 'passport' && (
                          <span className="inline-flex items-center gap-1 text-indigo-700">
                            <Camera className="w-3.5 h-3.5" /> Passport
                          </span>
                        )}
                        {tx.category === 'photostat' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <Copy className="w-3.5 h-3.5" /> Photostat
                          </span>
                        )}
                        {tx.category === 'other_income' && (
                          <span className="inline-flex items-center gap-1 text-cyan-700">
                            <Sparkles className="w-3.5 h-3.5" /> Other
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-700 max-w-[220px] truncate">
                        {tx.description}
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-600">
                        {tx.quantity || 1}
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-600">
                        ₹{tx.rate || 0}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                        +{formatINR(tx.amount)}
                      </td>
                      <td className="py-2.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
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
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs">No sales recorded yet for this date.</p>
              <p className="text-[11px] text-slate-400">
                Use the cards above or the Quick Entry modal to record sales.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
