import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as authService from '../services/authService';
import { message } from 'antd';

// User type matching backend response
interface User {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  roleId: string;
  role: {
    id: string;
    code: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');

    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    }
  }, []);

  /**
   * Login with identifier and password
   * Handles: username, email, or phone
   */
  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!identifier.trim()) {
        throw new Error('Vui lòng nhập tên đăng nhập, email hoặc số điện thoại');
      }

      if (!password || password.length < 8) {
        throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
      }

      // Call API
      const response = await authService.login(identifier, password);

      // Save tokens
      localStorage.setItem('authToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Save user data
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);

      message.success('Đăng nhập thành công!');
    } catch (err) {
      const errorMessage = (err as any)?.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      console.error('[AuthContext] Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout - clear tokens and user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      // Call logout API to notify backend
      await authService.logout();
    } catch (err) {
      console.error('[AuthContext] Logout API error:', err);
      // Continue with local logout even if API fails
    } finally {
      // Clear local auth state
      setUser(null);
      setError(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh access token using refresh token
   * Called by axios interceptor when 401 error occurs
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem('authToken', response.accessToken);

      // If we need new refresh token (usually same one is returned)
      // This is handled by the backend response
    } catch (err) {
      console.error('[AuthContext] Token refresh failed:', err);
      // If refresh fails, logout user
      await logout();
      throw err;
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user && !!localStorage.getItem('authToken'),
    isLoading,
    login,
    logout,
    refreshAccessToken,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
