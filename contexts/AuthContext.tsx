import React, { createContext, useContext, useEffect, useState } from 'react';
import { supplierApi } from '../api';

interface AuthContextType {
  user: any;
  supplier: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('supplierToken');
    if (token) {
      supplierApi.getMe().then(res => {
        setSupplier(res.data);
        setUser(res.data);
      }).catch(() => {
        localStorage.removeItem('supplierToken');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await supplierApi.login(email, password);
    localStorage.setItem('supplierToken', res.data.token);
    setSupplier(res.data.supplier);
    setUser(res.data.supplier);
  };

  const logout = () => {
    localStorage.removeItem('supplierToken');
    setSupplier(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supplier, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
