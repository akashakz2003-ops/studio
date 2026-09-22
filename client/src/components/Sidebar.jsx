import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Building2,
  FileText,
  Settings,
  Camera,
  Copy,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, settings, onOpenQuickSale }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'Daily Sales', icon: Camera },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'expenses', label: 'Expenses & Rent', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen p-4 select-none no-print">
        {/* Studio Branding */}
        <div className="flex items-center gap-3 px-3 py-3 mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">
              {settings?.business_name || 'Studio Ledger'}
            </h1>
            <p className="text-xs text-indigo-700 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 inline" /> Photo & Photostat
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenQuickSale}
          className="mb-6 flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ Add Today's Sales</span>
        </button>

        {/* Navigation links */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom studio rates summary pill */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>Quick Rates</span>
              <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded">Active</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>4 Photos:</span>
              <span className="font-semibold text-slate-900">₹{settings?.passport_base_price || 200}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Photostat:</span>
              <span className="font-semibold text-slate-900">₹{settings?.photostat_price_per_copy || 4}/copy</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Daily Rent:</span>
              <span className="font-semibold text-slate-900">₹{settings?.rent_daily_rate || 600}/day</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-lg no-print">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-xs transition-colors ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-[10px] leading-tight truncate max-w-[56px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
