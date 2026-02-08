import React, { useState, ReactNode } from "react";
import { AuthContext, User } from "./AuthContext";
import api from "../api/axios";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as User;
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
      }
    }
    return null;
  });

  const login = async (email: string, password: string): Promise<void> => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      console.warn("Server logout failed");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};