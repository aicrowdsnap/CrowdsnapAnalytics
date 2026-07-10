'use client';

import React, { useState } from 'react';
import { Menu, LogIn, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

export default function Header() {
  const { isAuthenticated, setStep, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full glass border-b border-white/10 px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-display font-bold tracking-tight text-gradient-aurora">
        CROWDSNAP ANALYTICS
      </h1>

      <div className="flex items-center gap-4">
        {/* Light/Dark Mode Toggle Switch Button Container */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-ink-muted hover:text-neon-lime transition-all duration-200"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-ink-muted hover:text-ink hover:bg-white/5 rounded-md transition"
          >
            <Menu className="w-6 h-6" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 glass border border-white/10 rounded-lg shadow-[0_10px_40px_-10px_rgba(160,212,5,0.25)] py-1 z-40 text-sm overflow-hidden">
              <div className="h-[2px] w-full aurora-seam" />
              {!isAuthenticated ? (
                <button
                  onClick={() => {
                    setStep('LOGIN_MODAL');
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-ink hover:bg-white/5 flex items-center gap-2 transition"
                >
                  <LogIn className="w-4 h-4 text-neon-lime" /> Login
                </button>
              ) : (
                <>
                  <div className="px-4 py-2.5 border-b border-white/10 text-xs text-neon-green font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Editor Session
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}