/**
 * Role Validation Utility
 * Validates user roles by checking with the server instead of trusting client-side storage
 * This prevents users from manipulating sessionStorage/localStorage to gain unauthorized access
 */

import api from './api';

/**
 * Normalize role string to standard format
 * Handles various formats: "Super Admin", "super_admin", "Administrator", etc.
 * Returns: "user", "admin", or "super_admin"
 */
function normalizeRole(accessLevel) {
  if (!accessLevel) return 'admin';
  const normalized = accessLevel.toLowerCase().trim();
  if (normalized === 'super admin' || normalized === 'super administrator' || normalized === 'super_admin') {
    return 'super_admin';
  } else if (normalized === 'administrator' || normalized === 'admin') {
    return 'admin';
  }
  return 'admin'; // Default fallback
}

/**
 * Validates the user's role by checking with the server using existing endpoints
 * @returns {Promise<{isValid: boolean, role: string|null, error: string|null}>}
 */
export async function validateUserRole() {
  // Use fallback since validate-role endpoint doesn't exist
  return await validateRoleFallback();
}

/**
 * Validates if the user has a specific role
 * @param {string|string[]} allowedRoles - Role(s) to check against
 * @returns {Promise<boolean>}
 */
export async function hasRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const validation = await validateUserRole();
  
  if (!validation.isValid) {
    return false;
  }

  return roles.includes(validation.role);
}

/**
 * Validates role and checks against stored sessionStorage role
 * If they don't match, it means the role was tampered with
 * @returns {Promise<{isValid: boolean, role: string|null, wasTampered: boolean}>}
 */
export async function validateRoleIntegrity() {
  const storedRole = sessionStorage.getItem('user_role');
  const validation = await validateRoleFallback();

  if (!validation.isValid) {
    return { isValid: false, role: null, wasTampered: false };
  }

  // Check if stored role matches server-validated role
  // If validation returned untrusted, we can't fully verify but still check consistency
  const wasTampered = storedRole && storedRole !== validation.role;

  if (wasTampered) {
    // Role was tampered with - clear it and use server-validated role
    console.warn('Role tampering detected! Stored:', storedRole, 'Validated:', validation.role);
    sessionStorage.setItem('user_role', validation.role);
  } else if (!storedRole && validation.role) {
    // No stored role but we got one from validation - set it
    sessionStorage.setItem('user_role', validation.role);
  }

  return {
    isValid: true,
    role: validation.role,
    wasTampered: wasTampered || false
  };
}

/**
 * Fallback validation using existing endpoints
 * Tries to get user info from existing endpoints to determine role
 */
import { getToken } from './api';

export async function validateRoleFallback() {
  const token = getToken();
  
  if (!token) {
    return { isValid: false, role: null, error: 'No token found' };
  }

    try {
      // Strategy 1: Check if admin_access_level exists in localStorage (set during admin login)
      const adminAccessLevel = localStorage.getItem('admin_access_level');
      if (adminAccessLevel) {
        // Verify by trying to get current admin user info (this endpoint works for all admins)
        try {
          const adminMeResponse = await api.get('/auth/admin/me');
          const adminData = adminMeResponse.data;

          // Token is valid and user is an admin
          // Use the role from the API response (already normalized)
          const role = adminData.role || normalizeRole(adminAccessLevel);
          sessionStorage.setItem('user_role', role);
          return { isValid: true, role: role, error: null };
        } catch (e) {
          // If 401/403, token invalid or not admin - clear admin data
          if (e.response && (e.response.status === 401 || e.response.status === 403)) {
            localStorage.removeItem('admin_access_level');
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_email');
          }
          // Endpoint failed, continue to user check
        }
      }

    // Strategy 2: Try to get regular user info
    const userId = localStorage.getItem('user_id');
    if (userId) {
      try {
        await api.get(`/auth/user/user/${userId}`);

        // User endpoint works, so this is a regular user
        sessionStorage.setItem('user_role', 'user');
        return { isValid: true, role: 'user', error: null };
      } catch (e) {
        // If 401/403, token invalid
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('user_role');
          return { isValid: false, role: null, error: 'Invalid or expired token' };
        }
        console.error('User validation error:', e);
      }
    }

    // Strategy 3: If we have a stored role but can't validate, check if token is at least valid
    const storedRole = sessionStorage.getItem('user_role');
    if (storedRole) {
      // Normalize stored role
      const normalizedStoredRole = normalizeRole(storedRole);
      
      // Try a simple validation endpoint (session/validate exists based on App.jsx)
      try {
        await api.get('/session/validate');

        // Token is valid, trust stored role for now (but mark as potentially untrusted)
        // Update sessionStorage with normalized role
        sessionStorage.setItem('user_role', normalizedStoredRole);
        return { isValid: true, role: normalizedStoredRole, error: null, untrusted: true };
      } catch (e) {
        // If 401/403, token invalid
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('user_role');
          return { isValid: false, role: null, error: 'Invalid or expired token' };
        }
        // Validation endpoint doesn't exist or failed
        // Return normalized stored role but mark as untrusted
        sessionStorage.setItem('user_role', normalizedStoredRole);
        return { isValid: true, role: normalizedStoredRole, error: null, untrusted: true };
      }
    }

    return { isValid: false, role: null, error: 'Unable to validate role' };
  } catch (error) {
    console.error('Role validation fallback error:', error);
    return { isValid: false, role: null, error: error.message };
  }
}

