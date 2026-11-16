import { createContext, useCallback, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [notice, setNotice] = useState('');
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (!savedUser || !token) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }
  });
  const loading = false;

  const login = async (email, password, allowedRoles = null, endpoint = '/auth/login/') => {
    const response = await api.post(endpoint, { email, password });
    const { access, refresh, user: userData } = response.data;

    if (allowedRoles && !allowedRoles.includes(userData.role)) {
      throw new Error(
        allowedRoles.includes('STUDENT')
          ? 'This portal is for student accounts only. Use the admin login for administrator accounts.'
          : 'This portal is for administrator accounts only. Use the student login for student accounts.'
      );
    }

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setNotice(
      userData.role === 'STUDENT'
        ? 'Welcome back! You have successfully signed in to your CertVerify account.'
        : 'You have successfully signed in to the CertVerify administration portal.'
    );
    return userData;
  };

  const logout = () => {
    setLogoutConfirmationOpen(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setNotice('Logout successful. You have been securely signed out of CertVerify.');
  };

  const requestLogout = useCallback(() => setLogoutConfirmationOpen(true), []);
  const cancelLogout = useCallback(() => setLogoutConfirmationOpen(false), []);

  const updateUser = useCallback((data) => {
    setUser((currentUser) => {
      const updated = { ...currentUser, ...data };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearNotice = useCallback(() => setNotice(''), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, requestLogout, cancelLogout, logoutConfirmationOpen, updateUser, loading, isAuthenticated: !!user, notice, clearNotice }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- The hook shares its context with AuthProvider.
export const useAuth = () => useContext(AuthContext);
