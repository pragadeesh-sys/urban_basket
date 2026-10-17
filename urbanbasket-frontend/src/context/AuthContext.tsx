import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { authApi } from '../api/endpoints';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateSession: (userData: User, newToken?: string) => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isAccountant: () => boolean;
  isCustomer: () => boolean;
  isSupplier: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const newToken = res.data.token as string;
    const userData = res.data.user as User;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const updateSession = (userData: User, newToken?: string) => {
    const nextToken = newToken || token;
    if (nextToken) {
      localStorage.setItem('token', nextToken);
      setToken(nextToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isStaff = () => user?.role === 'STAFF';
  const isAccountant = () => user?.role === 'ACCOUNTANT';
  const isCustomer = () => user?.role === 'CUSTOMER';
  const isSupplier = () => user?.role === 'SUPPLIER';

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateSession, isAdmin, isStaff, isAccountant, isCustomer, isSupplier }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
