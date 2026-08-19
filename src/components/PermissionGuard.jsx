import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente que protege elementos o rutas verificando permisos atómicos del usuario.
 */
export const PermissionGuard = ({
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback = <Navigate to="/" replace />,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback;
  }

  if (requiredPermissions && Array.isArray(requiredPermissions)) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return fallback;
    }
  }

  return children;
};

export default PermissionGuard;
