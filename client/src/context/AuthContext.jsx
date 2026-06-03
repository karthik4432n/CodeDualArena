import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default auth headers for axios
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }

  // Load user profile on startup if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user session", err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Check details and try again.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Register handler
  const register = async (username, email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Try again.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setError(null);
  };

  const val = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={val}>{children}</AuthContext.Provider>;
};
