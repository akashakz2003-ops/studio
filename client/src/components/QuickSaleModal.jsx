import React, { useState, useEffect } from 'react';
import { X, Camera, Copy, PlusCircle, CheckCircle, IndianRupee, Sparkles } from 'lucide-react';
import { formatINR, getTodayDateString } from '../utils/formatters';

export default function QuickSaleModal({
  isOpen,
  onClose,
  settings,
  onSuccess,
  showToast,
}) {
  if (!isOpen) return null;

  const [date, setDate] = useState(getTodayDateString());
  const [passportQty, setPassportQty] = useState('');
  const [passportType, setPassportType] = useState('new'); // 'new' | 'reprint'
  const [photostatCopies, setPhotostatCopies] = useState('');
  const [otherAmount, setOtherAmount] = useState('');
  const [otherDesc, setOtherDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic pricing calculation from settings
  const baseQty = settings?.passport_base_qty || 4;
  const basePrice = settings?.passport_base_price || 200;
  const reprintPrice = settings?.passport_reprint_price || 100;
  const photostatRate = settings?.photostat_price_per_copy || 4;

  const pQtyNum = Math.max(0, parseInt(passportQty, 10) || 0);
  const copiesNum = Math.max(0, parseInt(photostatCopies, 10) || 0);
  const otherNum = Math.max(0, parseFloat(otherAmount) || 0);

  // Auto calculate passport total
  const passportSubtotal =
    passportType === 'reprint'
      ? pQtyNum * reprintPrice
      : Math.round((pQtyNum / baseQty) * basePrice);

  // Auto calculate photostat total
  const photostatSubtotal = copiesNum * photostatRate;

  // Grand total
  const grandTotal = passportSubtotal + photostatSubtotal + otherNum;

  // Quick preset button handlers
  const addPassport = (qty) => {
    setPassportQty((prev) => String((parseInt(prev, 10) || 0) + qty));
  };

  const addCopies = (copies) => {
    setPhotostatCopies((prev) => String((parseInt(prev, 10) || 0) + copies));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (grandTotal <= 0) {
      showToast('Please enter at least one photo quantity, copy count, or other income.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/daily-sales/quick-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          passportQty: pQtyNum,
          passportType,
          photostatCopies: copiesNum,
          otherAmount: otherNum,
          otherDescription: otherDesc.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save daily entry');
      }

      showToast(`Sale recorded successfully! Total: ${formatINR(grandTotal)}`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <PlusCircle className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Quick Sales Entry</h3>
              <p className="text-xs text-indigo-100/90">Instantly calculate and record daily income</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>

          {/* Section 1: Passport Photos */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-800">Passport-Size Photos</span>
              </div>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                {passportType === 'reprint' ? `₹${reprintPrice}/reprint` : `${baseQty} photos = ₹${basePrice}`}
              </span>
            </div>

            {/* Type selector: new vs reprint */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPassportType('new')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                  passportType === 'new'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Newly Taken ({baseQty} = ₹{basePrice})
              </button>
              <button
                type="button"
                onClick={() => setPassportType('reprint')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                  passportType === 'reprint'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Digital / Reprint (₹{reprintPrice})
              </button>
            </div>

            {/* Quantity input */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                <span>Number of Photos</span>
                {pQtyNum > 0 && (
                  <span className="font-semibold text-indigo-700">
                    Subtotal: {formatINR(passportSubtotal)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 4, 8, 12, 16..."
                value={passportQty}
                onChange={(e) => setPassportQty(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Increment buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[4, 8, 12, 16, 24].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => addPassport(n)}
                  className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-slate-700 rounded-lg transition-colors active:scale-95"
                >
                  +{n}
                </button>
              ))}
              {pQtyNum > 0 && (
                <button
                  type="button"
                  onClick={() => setPassportQty('')}
                  className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Photostat */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-800">Photostat Copies</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                ₹{photostatRate} / copy
              </span>
            </div>

            {/* Copies input */}
            <div>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                <span>Number of Copies</span>
                {copiesNum > 0 && (
                  <span className="font-semibold text-emerald-700">
                    Subtotal: {formatINR(photostatSubtotal)}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 10, 25, 50, 100..."
                value={photostatCopies}
                onChange={(e) => setPhotostatCopies(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Increment buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[10, 25, 50, 100, 200].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => addCopies(n)}
                  className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-slate-700 rounded-lg transition-colors active:scale-95"
                >
                  +{n}
                </button>
              ))}
              {copiesNum > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotostatCopies('')}
                  className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Other Income */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-bold text-slate-800">Other Studio Income (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Description (e.g. Lamination, Frame)"
                value={otherDesc}
                onChange={(e) => setOtherDesc(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount"
                  value={otherAmount}
                  onChange={(e) => setOtherAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Real-time Calculation Summary Card */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-2xl border border-indigo-100/80">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Calculation Breakdown
            </div>
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Passport Photos ({pQtyNum} photos):</span>
                <span className="font-semibold text-slate-900">{formatINR(passportSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Photostat ({copiesNum} copies @ ₹{photostatRate}):</span>
                <span className="font-semibold text-slate-900">{formatINR(photostatSubtotal)}</span>
              </div>
              {otherNum > 0 && (
                <div className="flex justify-between">
                  <span>{otherDesc.trim() || 'Other Income'}:</span>
                  <span className="font-semibold text-slate-900">{formatINR(otherNum)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-indigo-200/60 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Total Entry Amount:</span>
                <span className="text-base text-indigo-700 font-extrabold">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || grandTotal <= 0}
              className="flex-[2] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Daily Entry ({formatINR(grandTotal)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
