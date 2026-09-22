// Indian Rupee & Financial Formatters

export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // en-IN locale formats according to Indian numbering system: 1,00,000
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absNum);

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;

  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;

  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const CATEGORY_LABELS = {
  passport: 'Passport Photos',
  photostat: 'Photostat Copies',
  other_income: 'Other Income',
  staff_salary: 'Staff Salary',
  rent: 'Studio Rent',
  electricity: 'Electricity',
  supplies: 'Studio Supplies',
  maintenance: 'Maintenance',
  other: 'Other Expense',
};

export const CATEGORY_COLORS = {
  passport: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  photostat: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  other_income: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  staff_salary: 'bg-amber-100 text-amber-800 border-amber-200',
  rent: 'bg-rose-100 text-rose-800 border-rose-200',
  electricity: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  supplies: 'bg-purple-100 text-purple-800 border-purple-200',
  maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
  other: 'bg-slate-100 text-slate-800 border-slate-200',
};
