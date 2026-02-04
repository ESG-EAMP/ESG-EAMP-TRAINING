/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 */

import React from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isSuperAdmin } from '../utils/permissions';

/**
 * PermissionGuard - Renders children only if user has required permission(s)
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Permission(s) required
 * @param {boolean} props.requireAll - If true, requires all permissions; if false, requires any (default: false)
 * @param {boolean} props.isAdmin - If true, requires admin role
 * @param {boolean} props.isSuperAdmin - If true, requires super admin role
 * @param {React.ReactNode} props.children - Content to render if permission check passes
 * @param {React.ReactNode} props.fallback - Content to render if permission check fails (optional)
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  isAdmin: requireAdmin = false,
  isSuperAdmin: requireSuperAdmin = false,
  children,
  fallback = null,
}) {
  let hasAccess = true;

  // Check role requirements
  if (requireSuperAdmin) {
    hasAccess = isSuperAdmin();
  } else if (requireAdmin) {
    hasAccess = isAdmin();
  }

  // Check permission requirements
  if (hasAccess && permission) {
    if (Array.isArray(permission)) {
      hasAccess = requireAll
        ? hasAllPermissions(permission)
        : hasAnyPermission(permission);
    } else {
      hasAccess = hasPermission(permission);
    }
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * AdminOnly - Renders children only for admin users
 */
export function AdminOnly({ children, fallback = null }) {
  return (
    <PermissionGuard isAdmin={true} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * SuperAdminOnly - Renders children only for super admin users
 */
export function SuperAdminOnly({ children, fallback = null }) {
  return (
    <PermissionGuard isSuperAdmin={true} fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export default PermissionGuard;
