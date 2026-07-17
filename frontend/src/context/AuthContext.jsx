import { createContext, useContext, useState } from "react";
import { getToken, login as apiLogin, register as apiRegister, setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  async function login(username, password) {
    const t = await apiLogin(username, password);
    setTokenState(t);
  }

  async function register(username, password, email) {
    const t = await apiRegister(username, password, email);
    setTokenState(t);
  }

  function logout() {
    setToken(null);
    setTokenState(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
