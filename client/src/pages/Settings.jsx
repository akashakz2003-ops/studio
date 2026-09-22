import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Camera,
  Copy,
  Building2,
  Users,
  Zap,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Info,
  Database,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';
import { api } from '../services/api';

export default function Settings({
  settings,
  onSettingsUpdated,
  showToast,
  onSeedSample,
}) {
  const [formData, setFormData] = useState({
    business_name: '',
    passport_base_qty: 4,
    passport_base_price: 200,
    passport_reprint_price: 100,
    photostat_price_per_copy: 4,
    staff_salary_monthly: 15600,
    rent_daily_rate: 600,
    electricity_monthly: 1500,
    currency_symbol: '₹',
    currency_code: 'INR',
    rent_default_applicable: 1,
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        business_name: settings.business_name || 'Modern Photo & Photostat Studio',
        passport_base_qty: settings.passport_base_qty || 4,
        passport_base_price: settings.passport_base_price || 200,
        passport_reprint_price: settings.passport_reprint_price || 100,
        photostat_price_per_copy: settings.photostat_price_per_copy || 4,
        staff_salary_monthly: settings.staff_salary_monthly || 15600,
        rent_daily_rate: settings.rent_daily_rate || 600,
        electricity_monthly: settings.electricity_monthly || 1500,
        currency_symbol: settings.currency_symbol || '₹',
        currency_code: settings.currency_code || 'INR',
        rent_default_applicable: settings.rent_default_applicable ?? 1,
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.business_name.trim()) {
      showToast('Business name cannot be empty', 'error');
      return;
    }
    if (Number(formData.passport_base_qty) <= 0 || Number(formData.passport_base_price) <= 0) {
      showToast('Passport pricing values must be greater than zero', 'error');
      return;
    }
    if (Number(formData.photostat_price_per_copy) <= 0) {
      showToast('Photostat price per copy must be greater than zero', 'error');
      return;
    }

    if (newPassword.trim()) {
      if (newPassword.trim().length < 3) {
        showToast('New password must be at least 3 characters', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = { ...formData };
      if (newPassword.trim()) {
        payload.app_password = newPassword.trim();
      }

      const res = await api.updateSettings(payload);
      if (res.success) {
        showToast('Settings saved successfully! Calculations updated.', 'success');
        if (newPassword.trim()) {
          showToast('New password set successfully! (പാസ്‌വേഡ് മാറ്റി)', 'success');
          setNewPassword('');
          setConfirmPassword('');
        }
        onSettingsUpdated?.(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFormData({
      business_name: 'Modern Photo & Photostat Studio',
      passport_base_qty: 4,
      passport_base_price: 200,
      passport_reprint_price: 100,
      photostat_price_per_copy: 4,
      staff_salary_monthly: 15600,
      rent_daily_rate: 600,
      electricity_monthly: 1500,
      currency_symbol: '₹',
      currency_code: 'INR',
      rent_default_applicable: 1,
    });
    showToast('Reset form to initial studio defaults. Click "Save Settings" to apply.', 'info');
  };

  // Preview calculations
  const samplePassport4 = (4 / formData.passport_base_qty) * formData.passport_base_price;
  const samplePassport8 = (8 / formData.passport_base_qty) * formData.passport_base_price;
  const samplePassport16 = (16 / formData.passport_base_qty) * formData.passport_base_price;

  const samplePhotostat10 = 10 * formData.photostat_price_per_copy;
  const samplePhotostat50 = 50 * formData.photostat_price_per_copy;
  const samplePhotostat100 = 100 * formData.photostat_price_per_copy;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
            <span>Business Settings & Dynamic Rates</span>
          </h3>
          <p className="text-xs text-slate-500">
            Configure studio pricing and recurring monthly expenses dynamically without code changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Business Identity */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Business Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Studio / Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="e.g. Modern Photo & Photostat Studio"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                name="currency_symbol"
                value={formData.currency_symbol}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: ₹ (Indian Rupee)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Passport Photo Pricing Rules */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Camera className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              2. Passport-Size Photo Pricing
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Quantity (Photos)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                name="passport_base_qty"
                value={formData.passport_base_qty}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Standard pack: 4 photos</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Price for {formData.passport_base_qty} Photos (₹)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                name="passport_base_price"
                value={formData.passport_base_price}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Initial default: ₹200</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Digital Reprint / Existing Price (₹)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                name="passport_reprint_price"
                value={formData.passport_reprint_price}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Per reprint: ₹100</span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 text-xs">
            <span className="font-bold text-indigo-900 block mb-1">Automatic Calculation Preview:</span>
            <div className="grid grid-cols-3 gap-2 text-slate-700">
              <div>4 photos → <strong className="text-slate-900">{formatINR(samplePassport4)}</strong></div>
              <div>8 photos → <strong className="text-slate-900">{formatINR(samplePassport8)}</strong></div>
              <div>16 photos → <strong className="text-slate-900">{formatINR(samplePassport16)}</strong></div>
            </div>
          </div>
        </div>

        {/* Section 3: Photostat Pricing */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Copy className="w-4 h-4 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              3. Photostat Pricing
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rate Per Copy (₹)
              </label>
              <input
                type="number"
                min="0.5"
                step="any"
                name="photostat_price_per_copy"
                value={formData.photostat_price_per_copy}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Initial default: ₹4 per copy</span>
            </div>

            {/* Live Photostat preview */}
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/80 text-xs flex flex-col justify-center">
              <span className="font-bold text-emerald-900 block mb-1">Photostat Calculation Preview:</span>
              <div className="grid grid-cols-3 gap-2 text-slate-700">
                <div>10 copies → <strong>{formatINR(samplePhotostat10)}</strong></div>
                <div>50 copies → <strong>{formatINR(samplePhotostat50)}</strong></div>
                <div>100 copies → <strong>{formatINR(samplePhotostat100)}</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Studio Operating Expenses & Rent */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 text-rose-600" />
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              4. Studio Fixed Overheads & Rent Rates
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Monthly Staff Salary (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="staff_salary_monthly"
                value={formData.staff_salary_monthly}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Initial default: ₹15,600</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Daily Rent Rate (₹/day)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="rent_daily_rate"
                value={formData.rent_daily_rate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Initial default: ₹600 / day</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-600" />
                <span>Monthly Electricity (₹)</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                name="electricity_monthly"
                value={formData.electricity_monthly}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Initial default: ₹1,500</span>
            </div>
          </div>
        </div>

        {/* Section 5: Security & Password Protection */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              5. Studio Password & Security (പാസ്‌വേഡ് സുരക്ഷ)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>New Unlock Password / PIN (പുതിയ പാസ്‌വേഡ്)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password to change..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-2 rounded-lg transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password (സ്ഥിരീകരിക്കുക)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <span className="text-[11px] text-slate-400 block">
                പാസ്‌വേഡ് മാറ്റേണ്ടതില്ലെങ്കിൽ ഈ കോളങ്ങൾ ശൂന്യമായി വിടുക (Leave blank to keep existing password).
              </span>
            </div>

            <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-xs text-indigo-950 flex flex-col justify-center space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security Protection Active</span>
              </div>
              <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                ആപ്പിലെ ദിവസേനയുള്ള വരുമാനവും ലാഭക്കണക്കുകളും സുരക്ഷിതമായി സൂക്ഷിക്കാൻ നിങ്ങൾ സെറ്റ് ചെയ്യുന്ന ഈ പാസ്‌വേഡ് അത്യന്താപേക്ഷിതമാണ്.
              </p>
              <p className="text-[10px] text-slate-500">
                The password you set here will be required whenever anyone opens the app.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: Save & Demo Data Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            {onSeedSample && (
              <button
                type="button"
                onClick={onSeedSample}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
              >
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Load Sample Month Data</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
