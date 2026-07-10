'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { authenticateUser } from '../services/api';

export default function LoginModal() {
  const { currentStep, setStep, setPendingUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (currentStep !== 'LOGIN_MODAL') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authenticateUser(email, password);
      const userId = res.data?.userid2 || res.userid2;
      if (userId) {
        setPendingUser(userId);
        setStep('OTP_MODAL');
      } else {
        throw new Error('User ID not received from server');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative bg-void-2/90 glass border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-[0_25px_100px_-20px_rgba(163,91,255,0.45)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] aurora-seam" />

        <h3 className="text-lg font-display font-bold text-ink mb-1">Account Authentication</h3>
        <p className="text-xs text-ink-muted mb-4">Please enter your supervisor credentials.</p>

        {error && (
          <div className="bg-red-500/10 text-red-400 text-xs p-2.5 rounded-md mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/30 text-ink placeholder:text-ink-muted transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/30 text-ink placeholder:text-ink-muted transition"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep('IDLE')}
              className="px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-ink-muted hover:bg-white/5 hover:text-ink transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-void bg-gradient-to-r from-neon-cyan to-neon-violet hover:brightness-110 disabled:opacity-50 shadow-[0_0_25px_-8px_rgba(45,217,255,0.7)] transition"
            >
              {loading ? 'Validating...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}