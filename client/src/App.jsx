import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import QuickSaleModal from './components/QuickSaleModal';
import EditTransactionModal from './components/EditTransactionModal';
import Toast from './components/Toast';

import Dashboard from './pages/Dashboard';
import DailySales from './pages/DailySales';
import Transactions from './pages/Transactions';
import Expenses from './pages/Expenses';
import MonthlyReport from './pages/MonthlyReport';
import Settings from './pages/Settings';

import { api } from './services/api';
import { getTodayDateString, getCurrentMonthString } from './utils/formatters';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals & Toast State
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const today = getTodayDateString();
      const month = getCurrentMonthString();

      const [settingsRes, statsRes] = await Promise.all([
        api.getSettings(),
        api.getDashboardStats(today, month),
      ]);

      if (settingsRes.success) {
        setSettings(settingsRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to load initial studio data:', err);
      showToast('Could not connect to server database: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRefreshStats = async () => {
    try {
      const today = getTodayDateString();
      const month = getCurrentMonthString();
      const statsRes = await api.getDashboardStats(today, month);
      if (statsRes.success) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  const handleSaveTransactionEdit = async (id, updatedData) => {
    try {
      await api.updateTransaction(id, updatedData);
      showToast('Transaction updated successfully', 'success');
      handleRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await api.deleteTransaction(id);
      showToast('Transaction deleted', 'success');
      handleRefreshStats();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleSeedSample = async () => {
    try {
      setLoading(true);
      const res = await api.seedSampleData();
      if (res.success) {
        showToast('Loaded sample studio transactions for demonstration!', 'success');
        await loadInitialData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onOpenQuickSale={() => setIsQuickSaleOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-10">
        {/* Top Navbar */}
        <Navbar
          settings={settings}
          todayRevenue={stats?.today?.revenue || 0}
          onOpenQuickSale={() => setIsQuickSaleOpen(true)}
          onRefresh={loadInitialData}
          loading={loading}
        />

        {/* Tab Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              settings={settings}
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              onNavigate={(tab) => setActiveTab(tab)}
              onSeedSample={handleSeedSample}
            />
          )}

          {activeTab === 'sales' && (
            <DailySales
              settings={settings}
              onRefreshStats={handleRefreshStats}
              showToast={showToast}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              showToast={showToast}
              onRefreshStats={handleRefreshStats}
            />
          )}

          {activeTab === 'expenses' && (
            <Expenses
              settings={settings}
              onRefreshStats={handleRefreshStats}
              showToast={showToast}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
            />
          )}

          {activeTab === 'reports' && (
            <MonthlyReport
              settings={settings}
              showToast={showToast}
              onNavigateDate={(date) => {
                setActiveTab('sales');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              settings={settings}
              onSettingsUpdated={(newSettings) => {
                setSettings(newSettings);
                handleRefreshStats();
              }}
              showToast={showToast}
              onSeedSample={handleSeedSample}
            />
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        settings={settings}
        showToast={showToast}
        onSuccess={() => {
          handleRefreshStats();
        }}
      />

      <EditTransactionModal
        isOpen={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSaveTransactionEdit}
        onDelete={handleDeleteTransaction}
      />

      {/* Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
