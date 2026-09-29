import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on application startup
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        setUser(response.data.user);
        setOrganization(response.data.organization);
        setToken(storedToken);
      } catch (err) {
        console.warn('Stored session invalid or expired. Logging out.');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for unauthorized 401 events dispatched by Axios interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setOrganization(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const { token: receivedToken, user: receivedUser, organization: receivedOrg } = response.data;

    localStorage.setItem('token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    setOrganization(receivedOrg);

    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const value = {
    user,
    organization,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
