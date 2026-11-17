"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, api } from "@/services/api";

interface AuthContextType {
  user: User | null;
  role: "admin" | "user" | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  favouriteIds: number[];
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; age?: number; password: string; confirm_password: string }) => Promise<void>;
  logout: () => Promise<void>;
  toggleFavourite: (destinationId: number) => Promise<boolean>;
  refreshFavourites: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState<number[]>([]);

  useEffect(() => {
    // Check if token exists in localStorage
    const savedUser = localStorage.getItem("yatraai_user");
    const token = localStorage.getItem("yatraai_token");

    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (_) {}
    }

    // Verify session with backend
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem("yatraai_user", JSON.stringify(userData));
          loadFavourites();
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("yatraai_token");
          localStorage.removeItem("yatraai_user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loadFavourites = async () => {
    try {
      const ids = await api.getFavouriteIds();
      setFavouriteIds(ids);
    } catch (_) {}
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem("yatraai_token", res.access_token);
    localStorage.setItem("yatraai_user", JSON.stringify(res.user));
    setUser(res.user);
    loadFavourites();
    return res.user;
  };

  const register = async (data: { name: string; email: string; age?: number; password: string; confirm_password: string }) => {
    const res = await api.register(data);
    localStorage.setItem("yatraai_token", res.access_token);
    localStorage.setItem("yatraai_user", JSON.stringify(res.user));
    setUser(res.user);
    loadFavourites();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setFavouriteIds([]);
  };

  const toggleFavourite = async (destId: number) => {
    if (!user) return false;
    const res = await api.toggleFavourite(destId);
    if (res.favourited) {
      setFavouriteIds((prev) => [...prev, destId]);
    } else {
      setFavouriteIds((prev) => prev.filter((id) => id !== destId));
    }
    return res.favourited;
  };

  const refreshFavourites = async () => {
    if (user) {
      await loadFavourites();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        loading,
        favouriteIds,
        login,
        register,
        logout,
        toggleFavourite,
        refreshFavourites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

