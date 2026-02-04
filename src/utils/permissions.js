/**
 * Frontend Permission Utilities
 * Provides functions to check user permissions based on role and custom permissions
 * Always fetches permissions from backend API to ensure they are up-to-date
 */

import api from './api';

// Cache for current user data (with timestamp for expiration)
let userCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 60 * 1000, // 60 seconds cache (reduced from 5 minutes for security)
};

/**
 * Fetch current admin user from backend API
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<Object|null>} User object with role and custom_permissions
 */
export const fetchCurrentUser = async (forceRefresh = false) => {
  try {
    // Check if we have a valid cached user
    const now = Date.now();
    if (!forceRefresh && userCache.data && userCache.timestamp && (now - userCache.timestamp) < userCache.CACHE_DURATION) {
      return userCache.data;
    }

    // Check if user is logged in (has token)
    const token = localStorage.getItem('token');
    if (!token) {
      userCache.data = null;
      userCache.timestamp = null;
      return null;
    }

    // Fetch from backend API
    const response = await api.get('/auth/admin/me');
    const userData = response.data;

    // Normalize role
    const normalizedRole = userData.role || 'admin';

    const user = {
      user_id: userData.user_id,
      role: normalizedRole,
      email: userData.email,
      full_name: userData.full_name,
      access_level: userData.access_level,
      approval_status: userData.approval_status,
      is_active: userData.is_active,
      custom_permissions: userData.custom_permissions || {},
    };

    // Update cache
    userCache.data = user;
    userCache.timestamp = now;

    return user;
  } catch (error) {
    console.error('Error fetching current user from backend:', error);
    // Clear cache so next call will try API again
    userCache.data = null;
    userCache.timestamp = null;
    
    // Security: Don't fallback to localStorage for permissions
    // If API fails, return null and require re-authentication
    // This prevents localStorage manipulation attacks
    if (error.response && error.response.status === 401) {
      // Token expired or invalid - clear everything
      localStorage.removeItem('token');
      sessionStorage.removeItem('user_role');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_access_level');
      localStorage.removeItem('admin_email');
    }
    
    return null;
  }
};

/**
 * Get current user data (synchronous, uses cache)
 * For immediate access, use cached data. For fresh data, use fetchCurrentUser()
 * @returns {Object|null} User object with role and custom_permissions
 */
export const getCurrentUser = () => {
  // Return cached data if available
  if (userCache.data) {
    return userCache.data;
  }

  // Fallback to localStorage if cache is empty (for initial load before API call)
  try {
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || 'null');
    const userRole = sessionStorage.getItem('user_role') || localStorage.getItem('user_role');
    
    if (userRole === 'admin' || userRole === 'super_admin') {
      return {
        role: userRole,
        custom_permissions: adminUser?.custom_permissions || {},
        ...adminUser
      };
    }
  } catch (error) {
    console.error('Error getting current user from localStorage:', error);
  }
  
  return null;
};

/**
 * Clear user cache (useful after logout or permission changes)
 */
export const clearUserCache = () => {
  userCache.data = null;
  userCache.timestamp = null;
};

/**
 * Get current user role
 * @returns {string|null} User role ('admin', 'super_admin', or null)
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

/**
 * Check if current user is super admin
 * @returns {boolean} True if user is super_admin
 */
export const isSuperAdmin = () => {
  const role = getUserRole();
  return role === 'super_admin';
};

/**
 * Permission constants matching backend
 */
export const Permission = {
  // User Management
  VIEW_USERS: "view_users",
  MANAGE_USERS: "manage_users",
  DELETE_USERS: "delete_users",
  VIEW_USER_PROFILES: "view_user_profiles",
  UPDATE_USER_STATUS: "update_user_status",
  
  // Admin Management
  VIEW_ADMIN_USERS: "view_admin_users",
  MANAGE_ADMIN_USERS: "manage_admin_users",
  DELETE_ADMIN_USERS: "delete_admin_users",
  APPROVE_ADMIN_USERS: "approve_admin_users",
  UPDATE_ADMIN_ACCESS_LEVEL: "update_admin_access_level",
  
  // Assessment Management
  VIEW_ASSESSMENTS: "view_assessments",
  MANAGE_ASSESSMENTS: "manage_assessments",
  DELETE_ASSESSMENTS: "delete_assessments",
  VIEW_ASSESSMENT_FORMS: "view_assessment_forms",
  CREATE_ASSESSMENT_FORMS: "create_assessment_forms",
  EDIT_ASSESSMENT_FORMS: "edit_assessment_forms",
  DELETE_ASSESSMENT_QUESTIONS: "delete_assessment_questions",
  VIEW_ALL_RESPONSES: "view_all_responses",
  
  // Content Management
  VIEW_CONTENT: "view_content",
  CREATE_CONTENT: "create_content",
  EDIT_CONTENT: "edit_content",
  DELETE_CONTENT: "delete_content",
  MANAGE_LEARNING_MATERIALS: "manage_learning_materials",
  MANAGE_LEARNING_SECTIONS: "manage_learning_sections",
  DELETE_LEARNING_SECTIONS: "delete_learning_sections",
  MANAGE_EVENTS: "manage_events",
  MANAGE_STATIC_PAGES: "manage_static_pages",
  
  // FAQ Management
  VIEW_FAQS: "view_faqs",
  MANAGE_FAQS: "manage_faqs",
  DELETE_FAQS: "delete_faqs",
  
  // Feedback Management
  VIEW_FEEDBACK: "view_feedback",
  MANAGE_FEEDBACK: "manage_feedback",
  
  // Reports
  VIEW_REPORTS: "view_reports",
  GENERATE_REPORTS: "generate_reports",
  VIEW_ALL_USER_REPORTS: "view_all_user_reports",
  
  // System Settings
  MANAGE_INFO_SETTINGS: "manage_info_settings",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
  
  // Storage
  UPLOAD_FILES: "upload_files",
  DELETE_FILES: "delete_files",
  MANAGE_STORAGE: "manage_storage",
};

/**
 * Role-based permissions mapping
 */
const ROLE_PERMISSIONS = {
  admin: [
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_USER_PROFILES,
    Permission.UPDATE_USER_STATUS,
    Permission.VIEW_ASSESSMENTS,
    Permission.MANAGE_ASSESSMENTS,
    Permission.VIEW_ASSESSMENT_FORMS,
    Permission.CREATE_ASSESSMENT_FORMS,
    Permission.EDIT_ASSESSMENT_FORMS,
    Permission.VIEW_ALL_RESPONSES,
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.MANAGE_LEARNING_MATERIALS,
    Permission.MANAGE_LEARNING_SECTIONS,
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_STATIC_PAGES,
    Permission.VIEW_FAQS,
    Permission.MANAGE_FAQS,
    Permission.VIEW_FEEDBACK,
    Permission.MANAGE_FEEDBACK,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_ALL_USER_REPORTS,
    Permission.MANAGE_INFO_SETTINGS,
    Permission.UPLOAD_FILES,
    Permission.MANAGE_STORAGE,
  ],
  super_admin: [
    // All admin permissions:
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.DELETE_USERS,
    Permission.VIEW_USER_PROFILES,
    Permission.UPDATE_USER_STATUS,
    Permission.VIEW_ADMIN_USERS,
    Permission.MANAGE_ADMIN_USERS,
    Permission.DELETE_ADMIN_USERS,
    Permission.APPROVE_ADMIN_USERS,
    Permission.UPDATE_ADMIN_ACCESS_LEVEL,
    Permission.VIEW_ASSESSMENTS,
    Permission.MANAGE_ASSESSMENTS,
    Permission.DELETE_ASSESSMENTS,
    Permission.VIEW_ASSESSMENT_FORMS,
    Permission.CREATE_ASSESSMENT_FORMS,
    Permission.EDIT_ASSESSMENT_FORMS,
    Permission.DELETE_ASSESSMENT_QUESTIONS,
    Permission.VIEW_ALL_RESPONSES,
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.MANAGE_LEARNING_MATERIALS,
    Permission.MANAGE_LEARNING_SECTIONS,
    Permission.DELETE_LEARNING_SECTIONS,
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_STATIC_PAGES,
    Permission.VIEW_FAQS,
    Permission.MANAGE_FAQS,
    Permission.DELETE_FAQS,
    Permission.VIEW_FEEDBACK,
    Permission.MANAGE_FEEDBACK,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_ALL_USER_REPORTS,
    Permission.MANAGE_INFO_SETTINGS,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.UPLOAD_FILES,
    Permission.DELETE_FILES,
    Permission.MANAGE_STORAGE,
  ],
};

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission constant to check
 * @param {Object} user - Optional user object (if not provided, gets from cache/storage)
 * @returns {boolean} True if user has the permission
 */
export const hasPermission = (permission, user = null) => {
  if (!user) {
    user = getCurrentUser();
  }
  
  if (!user || !user.role) {
    return false;
  }
  
  const userRole = user.role.toLowerCase();
  
  // Super admin has all permissions by default (unless custom permission denies it)
  if (userRole === 'super_admin') {
    const customPerms = user.custom_permissions || {};
    if (permission in customPerms) {
      return customPerms[permission]; // Custom permission overrides
    }
    return true; // Default: super admin has all permissions
  }
  
  // Check custom permissions first (override role-based)
  const customPerms = user.custom_permissions || {};
  if (permission in customPerms) {
    return customPerms[permission];
  }
  
  // Fall back to role-based permissions
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  return rolePerms.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {string[]} permissions - Array of permission constants
 * @param {Object} user - Optional user object
 * @returns {boolean} True if user has at least one permission
 */
export const hasAnyPermission = (permissions, user = null) => {
  return permissions.some(perm => hasPermission(perm, user));
};

/**
 * Check if user has all of the specified permissions
 * @param {string[]} permissions - Array of permission constants
 * @param {Object} user - Optional user object
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (permissions, user = null) => {
  return permissions.every(perm => hasPermission(perm, user));
};

/**
 * Get all permissions for current user
 * @param {Object} user - Optional user object
 * @returns {string[]} Array of permission strings
 */
export const getUserPermissions = (user = null) => {
  if (!user) {
    user = getCurrentUser();
  }
  
  if (!user || !user.role) {
    return [];
  }
  
  const userRole = user.role.toLowerCase();
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  const customPerms = user.custom_permissions || {};
  
  // Start with role-based permissions
  const permissions = new Set(rolePerms);
  
  // Super admin gets all permissions by default
  if (userRole === 'super_admin') {
    // Add all permissions from admin role
    ROLE_PERMISSIONS.admin.forEach(perm => permissions.add(perm));
    // Custom permissions can only deny (not grant new ones for super_admin)
    Object.keys(customPerms).forEach(perm => {
      if (customPerms[perm] === false) {
        permissions.delete(perm);
      }
    });
  } else {
    // For regular admins, custom permissions can grant or deny
    Object.keys(customPerms).forEach(perm => {
      if (customPerms[perm] === true) {
        permissions.add(perm);
      } else {
        permissions.delete(perm);
      }
    });
  }
  
  return Array.from(permissions);
};
