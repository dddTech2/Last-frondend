import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { jwtDecode } from "jwt-decode";
import { toast } from 'sonner';
import { checkUserIdentifier, loginWithPassword, firstTimeLogin } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.debug('[AuthContext] Attempting to load token from localStorage...');
    const tokenData = localStorage.getItem('authToken');
    if (tokenData) {
      try {
        const parsedToken = JSON.parse(tokenData);
        const decodedToken = jwtDecode(parsedToken.access_token);
        setUser({ ...parsedToken, decoded: decodedToken });
        console.debug('[AuthContext] Token loaded and user set.');
      } catch (error) {
        console.error("[AuthContext] Error decoding token from localStorage", error);
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } else {
      console.debug('[AuthContext] No token found in localStorage.');
    }
    setLoading(false);
  }, []);

  const handleLogin = (tokenData) => {
    try {
      const decodedToken = jwtDecode(tokenData.access_token);
      const userData = { ...tokenData, decoded: decodedToken };
      localStorage.setItem('authToken', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("[AuthContext] Error decoding token during login:", error);
    }
  };

  const logout = () => {
    console.debug('[AuthContext] User logged out, clearing token.');
    setUser(null);
    localStorage.removeItem('authToken');
  };

  // Roles y Permisos extraídos del token JWT
  const roles = useMemo(() => {
    if (!user?.decoded) return [];
    if (Array.isArray(user.decoded.roles)) return user.decoded.roles;
    if (user.decoded.role) return [user.decoded.role];
    return [];
  }, [user]);

  const permissions = useMemo(() => {
    if (!user?.decoded) return [];
    if (Array.isArray(user.decoded.permissions)) return user.decoded.permissions;
    return [];
  }, [user]);

  const isAdmin = useMemo(() => {
    return roles.includes('Admin') || roles.includes('Super Administrador');
  }, [roles]);

  const hasPermission = useCallback((perm) => {
    if (!user) return false;
    if (isAdmin) return true;
    return permissions.includes(perm);
  }, [user, isAdmin, permissions]);

  const hasAnyPermission = useCallback((perms) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (!Array.isArray(perms)) return hasPermission(perms);
    return perms.some(p => permissions.includes(p));
  }, [user, isAdmin, permissions, hasPermission]);

  const hasAllPermissions = useCallback((perms) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (!Array.isArray(perms)) return hasPermission(perms);
    return perms.every(p => permissions.includes(p));
  }, [user, isAdmin, permissions, hasPermission]);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (Array.isArray(role)) return role.some(r => roles.includes(r));
    return roles.includes(role);
  }, [user, isAdmin, roles]);

  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT_MS = Number(import.meta.env?.VITE_INACTIVITY_TIMEOUT_MS) || 60 * 60 * 1000;
    let activityTimer;

    const handleExpire = () => {
      try {
        sessionStorage.setItem('logoutReason', 'inactivity');
        toast.info('Sesión cerrada por inactividad', { description: 'Vuelve a iniciar sesión para continuar.' });
      } catch {}
      logout();
    };

    const resetTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(handleExpire, INACTIVITY_TIMEOUT_MS);
    };

    const handleActivity = () => resetTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    resetTimer();

    return () => {
      clearTimeout(activityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      logout, 
      isAuthenticated: !!user,
      loading,
      roles,
      permissions,
      isAdmin,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasRole,
      checkUserIdentifier,
      loginWithPassword: async (email, password) => {
        const tokenData = await loginWithPassword(email, password);
        handleLogin(tokenData);
      },
      firstTimeLogin: async (identifier, password) => {
        const tokenData = await firstTimeLogin(identifier, password);
        handleLogin(tokenData);
      },
      getAccessToken: useCallback(() => user?.access_token, [user?.access_token])
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
