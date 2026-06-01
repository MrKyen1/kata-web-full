import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axiosConfig";

import { setTokens, logout as logoutStorage } from "../utils/authStorage";
import { authService } from "../services/auth.service";

// ✅ IMPORT TYPE TỪ types/auth.ts
import type { User, AuthContextType } from "../types/auth";

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType>(null as any);

/* ================= PROVIDER ================= */

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  /* ================= LOGIN ================= */

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.login(
        { identifier, password },
        { showErrorMessage: false }
      );

      const { user, accessToken, refreshToken } = res;

      setTokens(accessToken, refreshToken);

      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= REFRESH USER ================= */

  const refreshAccessToken = async () => {
    const res = await api.get("/auth/me");
    const user = res.data.data;

    setUser(user);
  };

  /* ================= LOGOUT ================= */

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    } catch (e) {}

    logoutStorage();
    setUser(null);
  };

  /* ================= INIT ================= */

  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        error,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useAuth = () => useContext(AuthContext);
