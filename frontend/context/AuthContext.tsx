"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: string | null;
  email: string | null;
  token: string | null;
  login: (token: string, username: string, email: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");
    const savedEmail = localStorage.getItem("email");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const login = (newToken: string, username: string, userEmail: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", username);
    localStorage.setItem("email", userEmail);
    setToken(newToken);
    setUser(username);
    setEmail(userEmail);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    setToken(null);
    setUser(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, email, token, login, logout, isLoggedIn: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};