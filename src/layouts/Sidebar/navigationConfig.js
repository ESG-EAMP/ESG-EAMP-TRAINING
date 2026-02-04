import { Permission, hasPermission } from '../../utils/permissions';

/**
 * Navigation configuration with permission-based access control
 * Each menu item can specify required permissions
 */

// Base navigation items with permission requirements
const baseAdminNavigation = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'fa-regular fa-chart-mixed',
    // No permission required - all admins can access
  },
  {
    title: 'Firms',
    path: '/admin/firm-comparison',
    icon: 'fa-regular fa-table',
    // No permission required - all admins can access
  },
  {
    title: 'Assessment',
    icon: 'fa-regular fa-clipboard',
    permission: Permission.VIEW_ASSESSMENTS,
    children: [
      {
        title: 'View Forms',
        path: '/admin/assessment/view-forms',
        permission: Permission.VIEW_ASSESSMENT_FORMS,
      },
      {
        title: 'All Responses',
        path: '/admin/assessment/all-responses',
        permission: Permission.VIEW_ALL_RESPONSES,
      },
    ]
  },
  {
    title: 'Manage Users',
    path: '/admin/manage-users',
    icon: 'fa-regular fa-users',
    permission: Permission.MANAGE_USERS,
  },
  {
    title: 'Admin Users',
    path: '/admin/admin-users',
    icon: 'fa-regular fa-user-shield',
    permission: Permission.VIEW_ADMIN_USERS, // Super admin only
    requiresSuperAdmin: true, // Visual indicator
  },
  {
    title: 'User Sustainability Reports',
    path: '/admin/manage-report',
    icon: 'fa-regular fa-file-export',
    permission: Permission.VIEW_ALL_USER_REPORTS,
  },
  {
    title: 'Content Management',
    icon: 'fa-regular fa-file-lines',
    permission: Permission.VIEW_CONTENT,
    children: [
      {
        title: 'Learning Centre',
        path: '/admin/learning-materials',
        permission: Permission.MANAGE_LEARNING_MATERIALS,
      },
      {
        title: 'Events',
        path: '/admin/events',
        permission: Permission.MANAGE_EVENTS,
      },
      {
        title: 'About',
        path: '/admin/pages/about',
        permission: Permission.MANAGE_STATIC_PAGES,
      },
      {
        title: 'PKSlestari',
        path: '/admin/pages/pkslestari',
        permission: Permission.MANAGE_STATIC_PAGES,
      },
      {
        title: 'Footer',
        path: '/admin/pages/footer',
        permission: Permission.MANAGE_STATIC_PAGES,
      },
      {
        title: 'Registration T&C',
        path: '/admin/pages/registration-tc',
        permission: Permission.MANAGE_STATIC_PAGES,
      },
      {
        title: 'ESG Reporting Resources',
        path: '/admin/pages/esg-reporting-resources',
        permission: Permission.MANAGE_STATIC_PAGES,
      }
    ]
  },
  {
    title: 'Admin Support',
    icon: 'fa-regular fa-life-ring',
    children: [
      {
        title: 'FAQ Management',
        path: '/admin/faq-management',
        permission: Permission.MANAGE_FAQS,
      },
      {
        title: 'Feedback',
        path: '/admin/feedback',
        permission: Permission.MANAGE_FEEDBACK,
      },
      {
        title: 'Info Setup',
        path: '/admin/info-setup',
        permission: Permission.MANAGE_INFO_SETTINGS,
      },
    ]
  },
  {
    title: 'My Profile',
    path: '/admin/my-profile',
    icon: 'fa-regular fa-user',
    // No permission required - all admins can access their own profile
    // Note: Route is /my-profile inside AdminRoutes (which is mounted at /admin/*)
  }
];

/**
 * Get filtered navigation based on user permissions
 * @param {Object|null} user - User object with role and custom_permissions (from backend API)
 * @returns {Array} Filtered navigation items
 */
export function getAdminNavigation(user) {
  // If no user provided, return empty array (no navigation items)
  if (!user || !user.role) {
    return [];
  }
  
  return baseAdminNavigation
    .map(item => {
      // Check if parent item has permission requirement
      if (item.permission && !hasPermission(item.permission, user)) {
        return null;
      }
      
      // Filter children based on permissions
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          if (child.permission && !hasPermission(child.permission, user)) {
            return false;
          }
          return true;
        });
        
        // If no children remain, hide parent
        if (filteredChildren.length === 0) {
          return null;
        }
        
        return {
          ...item,
          children: filteredChildren
        };
      }
      
      return item;
    })
    .filter(item => item !== null);
}

/**
 * Legacy export for backward compatibility
 * Note: This will return empty array until fetchCurrentUser() is called
 * Use getAdminNavigation(user) directly with a fetched user object instead
 */
export const adminNavigation = [];

export const userNavigation = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'fa-regular fa-chart-mixed'
  },
  {
    title: 'Take Assessment',
    icon: 'fa-regular fa-clipboard',
    path: '/assessment-v2',
  },
  {
    title: 'Assessment History',
    icon: 'fa-regular fa-clock-rotate-left',
    path: '/assessment-history',
  },
  {
    title: 'Sustainability Reports',
    path: '/reports',
    icon: 'fa-regular fa-file-export',
  },
  {
    title: 'Learning Centre',
    path: '/learning-centre',
    icon: 'fa-regular fa-graduation-cap',
  },
  {
    title: 'Events',
    path: '/user/events',
    icon: 'fa-regular fa-calendar',
  },
  {
    title: 'Support',
    icon: 'fa-regular fa-headset',
    path: '/support',
  },
  {
    title: 'Profile',
    icon: 'fa-regular fa-address-card',
    children: [
      {
        title: 'User Profile',
        path: '/profile'
      },
      {
        title: 'Business Verification',
        path: '/profile/verification'
      },
    ]
  },
];
