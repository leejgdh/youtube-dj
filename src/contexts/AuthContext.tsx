'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  loginForm: { username: string; password: string };
  loginError: string;
  isLoggingIn: boolean;
  setLoginForm: (form: { username: string; password: string }) => void;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    const authStatus = localStorage.getItem('youtube-dj-admin-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('youtube-dj-admin-auth', 'true');
        setLoginForm({ username: '', password: '' });
      } else {
        setLoginError(data.message || '로그인에 실패했습니다.');
      }
    } catch {
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('youtube-dj-admin-auth');
    setLoginForm({ username: '', password: '' });
    setLoginError('');
  };

  const value = {
    isAuthenticated,
    loginForm,
    loginError,
    isLoggingIn,
    setLoginForm,
    handleLogin,
    handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}