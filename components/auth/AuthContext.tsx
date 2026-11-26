'use client';

import React, { createContext, useContext, useState } from 'react';

type AuthStep = 'IDLE' | 'LOGIN_MODAL' | 'OTP_MODAL';

interface AuthContextType {
  isAuthenticated: boolean;
  currentStep: AuthStep;
  pendingUserId: string | null;
  setStep: (step: AuthStep) => void;
  loginSuccess: () => void;
  setPendingUser: (id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>('IDLE');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const loginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentStep('IDLE');
    setPendingUserId(null);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentStep('IDLE');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      currentStep, 
      pendingUserId, 
      setStep: setCurrentStep, 
      loginSuccess, 
      setPendingUser: setPendingUserId, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};