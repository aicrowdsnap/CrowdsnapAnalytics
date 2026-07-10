'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { verifyOtp } from '../services/api';

export default function OtpModal() {
  const { currentStep, setStep, pendingUserId, loginSuccess } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (currentStep !== 'OTP_MODAL') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId) return;
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(otp, pendingUserId);
      
      // Strict guard against verification failures or literal false conditions
      if (res === false || res?.success === false || res?.data === false) {
        throw new Error('Access denied. Security clearance token invalid.');
      }
      
      loginSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification token failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      {/* Container Box using semantic variable paths to adapt with theme context states */}
      <div className="relative bg-[var(--color-void-2)] border border-[var(--color-border)] p-8 rounded-2xl w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-center overflow-hidden transition-all duration-200">
        
        {/* Signature top accent line header */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--color-neon-lime)] to-[var(--color-neon-green)]" />

        <h3 className="text-xl font-display font-bold text-[var(--color-ink)] mb-1">
          Two-Factor Security
        </h3>
        <p className="text-xs text-[var(--color-ink-muted)] mb-5">
          Enter the confirmation code sent to your unit.
        </p>

        {error && (
          <div className="bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-medium p-3 rounded-lg mb-4 border border-red-500/20 text-center transition-colors">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            maxLength={4}
            required
            placeholder="0000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
            className="w-40 mx-auto block text-center text-3xl tracking-[0.4em] pl-4 py-2.5 bg-[var(--color-void)] border-2 border-[var(--color-border)] rounded-xl outline-none focus:border-[var(--color-neon-lime)] focus:ring-4 focus:ring-[var(--color-neon-lime)]/20 font-mono font-bold text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]/30 shadow-inner transition-all duration-200"
          />

          <div className="flex justify-center items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('LOGIN_MODAL')}
              className="w-1/2 px-4 py-2.5 border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-xl text-sm font-semibold text-[var(--color-ink)] shadow-sm active:scale-98 transition-all duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-1/2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[var(--color-neon-lime)] to-[var(--color-neon-green)] text-[var(--color-on-accent)] hover:brightness-105 active:scale-98 disabled:opacity-40 disabled:pointer-events-none shadow-[0_4px_20px_-4px_rgba(160,212,5,0.4)] transition-all duration-200"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}