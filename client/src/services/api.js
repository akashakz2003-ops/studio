// API service layer for Studio Financial Management

const API_BASE = '/api';

async function fetchJson(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMsg = `Server error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData && errData.error) errorMsg = errData.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth & Security
  getAuthStatus: () => fetchJson('/auth/status'),
  setupPassword: (password) => fetchJson('/auth/setup-password', { method: 'POST', body: JSON.stringify({ password }) }),
  login: (password) => fetchJson('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  changePassword: (currentPassword, newPassword) =>
    fetchJson('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // Settings
  getSettings: () => fetchJson('/settings'),
  updateSettings: (data) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard stats
  getDashboardStats: (date, month) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (month) params.append('month', month);
    return fetchJson(`/dashboard/stats?${params.toString()}`);
  },

  // Daily Sales
  getDailySales: (date) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    return fetchJson(`/daily-sales?${params.toString()}`);
  },
  quickSaleEntry: (data) => fetchJson('/daily-sales/quick-entry', { method: 'POST', body: JSON.stringify(data) }),

  // Transactions CRUD
  getTransactions: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, v);
      }
    });
    return fetchJson(`/transactions?${params.toString()}`);
  },
  createTransaction: (data) => fetchJson('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => fetchJson(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => fetchJson(`/transactions/${id}`, { method: 'DELETE' }),

  // Expenses & Rent
  getExpenses: (month) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    return fetchJson(`/expenses?${params.toString()}`);
  },
  getRentDays: (month) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    return fetchJson(`/rent-days?${params.toString()}`);
  },
  toggleRentDay: (date, applicable, notes) =>
    fetchJson('/rent-days/toggle', { method: 'POST', body: JSON.stringify({ date, applicable, notes }) }),
  bulkUpdateRentDays: (month, action) =>
    fetchJson('/rent-days/bulk', { method: 'POST', body: JSON.stringify({ month, action }) }),

  // Reports
  getMonthlyReport: (month) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    return fetchJson(`/reports/monthly?${params.toString()}`);
  },

  // Seed / Reset sample data
  seedSampleData: () => fetchJson('/seed-sample-data', { method: 'POST' }),
};
