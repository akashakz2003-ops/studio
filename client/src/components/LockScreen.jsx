import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function LockScreen({
  businessName,
  onUnlock,
  showToast,
}) {
  const [isPasswordSet, setIsPasswordSet] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Unlock mode state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Setup mode state (when setting custom password)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeField, setActiveField] = useState('password'); // 'password' | 'new' | 'confirm'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  // Check auth status from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        setCheckingStatus(true);
        const res = await api.getAuthStatus();
        if (isMounted && res.success) {
          setIsPasswordSet(res.isPasswordSet);
          if (!res.isPasswordSet) {
            setActiveField('new');
          }
        }
      } catch (err) {
        console.error('Could not check auth status:', err);
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Handle Unlock
  const handleUnlockSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('പാസ്‌വേഡ് നൽകുക (Please enter password)');
      triggerShake();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.login(password);
      if (res.success) {
        sessionStorage.setItem('studio_authenticated', 'true');
        showToast('Studio Ledger Unlocked!', 'success');
        onUnlock();
      }
    } catch (err) {
      setError(err.message || 'തെറ്റായ പാസ്‌വേഡ്. വീണ്ടും ശ്രമിക്കുക. (Incorrect password)');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Handle Initial Password Setup
  const handleSetupSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword.trim()) {
      setError('പാസ്‌വേഡ് നൽകുക (Please enter a password)');
      triggerShake();
      return;
    }
    if (newPassword.trim().length < 3) {
      setError('കുറഞ്ഞത് 3 അക്ഷരങ്ങൾ/അക്കങ്ങൾ വേണം (Minimum 3 characters)');
      triggerShake();
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('പാസ്‌വേഡുകൾ തമ്മിൽ പൊരുത്തപ്പെടുന്നില്ല (Passwords do not match)');
      triggerShake();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.setupPassword(newPassword.trim());
      if (res.success) {
        sessionStorage.setItem('studio_authenticated', 'true');
        showToast('പാസ്‌വേഡ് വിജയകരമായി സെറ്റ് ചെയ്തു! (Password configured successfully)', 'success');
        onUnlock();
      }
    } catch (err) {
      setError(err.message || 'പാസ്‌വേഡ് സെറ്റ് ചെയ്യാൻ കഴിഞ്ഞില്ല');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (val) => {
    setError('');
    const updateTarget = (setter) => {
      if (val === 'backspace') {
        setter((prev) => prev.slice(0, -1));
      } else if (val === 'clear') {
        setter('');
      } else {
        setter((prev) => prev + val);
      }
    };

    if (!isPasswordSet) {
      if (activeField === 'confirm') {
        updateTarget(setConfirmPassword);
      } else {
        updateTarget(setNewPassword);
      }
    } else {
      updateTarget(setPassword);
    }
  };

  const handleSwitchToReset = () => {
    if (window.confirm('പുതിയ പാസ്‌വേഡ് സെറ്റ് ചെയ്യണോ? (Do you want to reset and create a new studio password?)')) {
      setIsPasswordSet(false);
      setActiveField('new');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        className={`relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Studio Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <Lock className="w-8 h-8" />
          </div>

          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-300 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Studio Protected Access</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {businessName || 'Photo & Photostat Studio'}
            </h1>
            <p className="text-xs text-slate-300">
              {isPasswordSet ? (
                <>
                  തുറക്കാനായി പാസ്‌വേഡ് നൽകുക <br />
                  <span className="text-indigo-200">Enter studio password to unlock</span>
                </>
              ) : (
                <>
                  നിങ്ങളുടെ സ്വന്തം പാസ്‌വേഡ് സെറ്റ് ചെയ്യുക <br />
                  <span className="text-indigo-200">Set your studio password to secure the app</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Content based on whether password has been set */}
        {checkingStatus ? (
          <div className="py-8 text-center text-slate-300 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span>സുരക്ഷാ ക്രമീകരണങ്ങൾ പരിശോധിക്കുന്നു...</span>
          </div>
        ) : !isPasswordSet ? (
          /* SETUP PASSWORD MODE (user creates their password) */
          <form onSubmit={handleSetupSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-indigo-200 mb-1">
                  പുതിയ പാസ്‌വേഡ് (New Password / PIN)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password..."
                    value={newPassword}
                    onFocus={() => setActiveField('new')}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    autoFocus
                    className={`w-full pl-10 pr-10 py-3 bg-black/30 border rounded-2xl text-center text-base tracking-wider font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${
                      activeField === 'new' ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-white/20'
                    }`}
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1 text-slate-400 hover:text-white absolute right-3 top-2.5 rounded-lg transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-indigo-200 mb-1">
                  പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക (Confirm Password)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Re-enter password..."
                    value={confirmPassword}
                    onFocus={() => setActiveField('confirm')}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    className={`w-full pl-10 pr-10 py-3 bg-black/30 border rounded-2xl text-center text-base tracking-wider font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${
                      activeField === 'confirm' ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-white/20'
                    }`}
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs text-center font-medium animate-fade-in">
                {error}
              </div>
            )}

            {/* Quick Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(String(num))}
                  className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-base font-bold text-white transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-xs font-semibold text-rose-300 transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-base font-bold text-white transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-xs font-semibold text-amber-300 transition-all"
              >
                ⌫
              </button>
            </div>

            {/* Set Password Submit Button */}
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>സേവ് ചെയ്യുന്നു...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Set Password & Unlock Studio</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* STANDARD UNLOCK MODE (only asks for the set password, NO hint shown) */
          <form onSubmit={handleUnlockSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Studio Password..."
                value={password}
                onFocus={() => setActiveField('password')}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoFocus
                className="w-full pl-11 pr-11 py-3.5 bg-black/30 border border-white/20 rounded-2xl text-center text-lg tracking-wider font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-white absolute right-3.5 top-3.5 rounded-lg transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs text-center font-medium animate-fade-in">
                {error}
              </div>
            )}

            {/* Quick Touch Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(String(num))}
                  className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-base font-bold text-white transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-xs font-semibold text-rose-300 transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-base font-bold text-white transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                className="py-2.5 bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 rounded-xl text-xs font-semibold text-amber-300 transition-all"
              >
                ⌫
              </button>
            </div>

            {/* Unlock Submit Button */}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>പരിശോധിക്കുന്നു...</span>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Studio (തുറക്കുക)</span>
                </>
              )}
            </button>

            {/* Safe Reset Link (No password revealed) */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleSwitchToReset}
                className="text-[11px] text-slate-400 hover:text-indigo-300 underline underline-offset-4 transition-colors"
              >
                പാസ്‌വേഡ് മാറ്റണോ? (Reset / Change Password)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
