import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Trash2 } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) {
  if (!isOpen || !transaction) return null;

  const [date, setDate] = useState(transaction.date || '');
  const [type, setType] = useState(transaction.type || 'income');
  const [category, setCategory] = useState(transaction.category || 'other_income');
  const [description, setDescription] = useState(transaction.description || '');
  const [quantity, setQuantity] = useState(transaction.quantity || 1);
  const [rate, setRate] = useState(transaction.rate || 0);
  const [amount, setAmount] = useState(transaction.amount || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When quantity or rate changes, update amount if appropriate
  const handleQtyChange = (val) => {
    const q = parseInt(val, 10) || 0;
    setQuantity(val);
    if (category === 'passport' || category === 'photostat') {
      const r = parseFloat(rate) || 0;
      if (r > 0) setAmount(q * r);
    }
  };

  const handleRateChange = (val) => {
    const r = parseFloat(val) || 0;
    setRate(val);
    if (category === 'passport' || category === 'photostat') {
      const q = parseInt(quantity, 10) || 0;
      if (q > 0) setAmount(q * r);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      alert('Please enter a valid non-negative amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(transaction.id, {
        date,
        type,
        category,
        description: description.trim(),
        quantity: parseInt(quantity, 10) || 1,
        rate: parseFloat(rate) || 0,
        amount: numAmount,
      });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async () => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        setIsDeleting(true);
        await onDelete(transaction.id);
        onClose();
      } catch (err) {
        alert(err.message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const categories =
    type === 'income'
      ? [
          { id: 'passport', label: 'Passport Photos' },
          { id: 'photostat', label: 'Photostat Copies' },
          { id: 'other_income', label: 'Other Income' },
        ]
      : [
          { id: 'staff_salary', label: 'Staff Salary' },
          { id: 'rent', label: 'Studio Rent' },
          { id: 'electricity', label: 'Electricity' },
          { id: 'supplies', label: 'Studio Supplies' },
          { id: 'maintenance', label: 'Maintenance' },
          { id: 'other', label: 'Other Expense' },
        ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Edit Transaction</h3>
            <p className="text-xs text-slate-300">Update transaction details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Date & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setType(newType);
                  setCategory(newType === 'income' ? 'other_income' : 'supplies');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 8 passport photos, photostat copies..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quantity and Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => handleQtyChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rate (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={rate}
                onChange={(e) => handleRateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Final Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="py-2 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors ml-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
