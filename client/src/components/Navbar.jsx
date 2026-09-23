import React from 'react';
import { Calendar, Plus, RefreshCw, IndianRupee } from 'lucide-react';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';

export default function Navbar({
  settings,
  todayRevenue,
  onOpenQuickSale,
  onRefresh,
  loading,
}) {
  const todayStr = getTodayDateString();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3.5 flex items-center justify-between no-print">
      {/* Title / Date info */}
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="hidden sm:inline">{settings?.business_name || 'Studio Ledger'}</span>
            <span className="sm:hidden text-indigo-700 font-bold">Studio Finance</span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Today: <strong className="text-slate-700 font-semibold">{formatDate(todayStr)}</strong></span>
          </div>
        </div>
      </div>

      {/* Right Actions: Live Today Badge, Refresh, Quick Sale */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Today's revenue live counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs md:text-sm font-semibold shadow-xs">
          <span className="text-emerald-600 hidden sm:inline">Today's Revenue:</span>
          <span className="text-emerald-600 sm:hidden">Today:</span>
          <span className="font-bold text-emerald-700">
            {formatINR(todayRevenue || 0)}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>

        {/* Quick Sale Button */}
        <button
          onClick={onOpenQuickSale}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Today's Sales</span>
          <span className="sm:hidden">Add Sale</span>
        </button>
      </div>
    </header>
  );
}
