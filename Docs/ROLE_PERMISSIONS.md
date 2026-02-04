# Frontend Role-Based Access Control (RBAC) Documentation

## Overview

The frontend uses a permission-based system that mirrors the backend permissions for consistent access control.

## Quick Start

### Check Permissions

```javascript
import { hasPermission, Permission } from '../utils/permissions';

if (hasPermission(Permission.DELETE_USERS)) {
  // User can delete users
}
```

### Use PermissionGuard Component

```jsx
import { PermissionGuard } from '../components/PermissionGuard';
import { Permission } from '../utils/permissions';

<PermissionGuard permission={Permission.DELETE_USERS}>
  <button onClick={handleDelete}>Delete</button>
</PermissionGuard>
```

### Check User Role

```javascript
import { isAdmin, isSuperAdmin, getUserRole } from '../utils/permissions';

const role = getUserRole(); // 'user', 'admin', or 'super_admin'
const isAdminUser = isAdmin();
const isSuperAdminUser = isSuperAdmin();
```

## Available Functions

### Permission Checking

- `hasPermission(permission, userRole?)` - Check if user has a permission
- `hasAnyPermission(permissions[], userRole?)` - Check if user has any of the permissions
- `hasAllPermissions(permissions[], userRole?)` - Check if user has all permissions

### Role Checking

- `getUserRole()` - Get current user's normalized role
- `isAdmin(userRole?)` - Check if user is admin or super admin
- `isSuperAdmin(userRole?)` - Check if user is super admin
- `isUser(userRole?)` - Check if user is regular user
- `normalizeRole(role)` - Normalize role string to standard format

### React Hooks

- `usePermission(permission)` - Hook to check permission
- `useIsAdmin()` - Hook to check if user is admin
- `useIsSuperAdmin()` - Hook to check if user is super admin

## Components

### PermissionGuard

Conditionally renders children based on permissions or roles.

```jsx
<PermissionGuard 
  permission={Permission.DELETE_USERS}
  requireAll={false}  // If true, requires all permissions
  isAdmin={false}     // If true, requires admin role
  isSuperAdmin={false} // If true, requires super admin role
  fallback={<p>Access denied</p>}
>
  <DeleteButton />
</PermissionGuard>
```

### AdminOnly

Renders children only for admin users.

```jsx
<AdminOnly fallback={<p>Admin access required</p>}>
  <AdminPanel />
</AdminOnly>
```

### SuperAdminOnly

Renders children only for super admin users.

```jsx
<SuperAdminOnly>
  <SuperAdminPanel />
</SuperAdminOnly>
```

## Navigation

Navigation is automatically filtered based on user permissions. See `src/layouts/Sidebar/navigationConfig.js` for configuration.

Menu items can specify:
- `permission` - Required permission to show the item
- `requiresSuperAdmin` - Visual indicator (for documentation)

## Examples

### Example 1: Conditional Button Rendering

```jsx
import { hasPermission, Permission } from '../utils/permissions';

function UserActions() {
  const canDelete = hasPermission(Permission.DELETE_USERS);
  
  return (
    <div>
      <button>Edit</button>
      {canDelete && <button onClick={handleDelete}>Delete</button>}
    </div>
  );
}
```

### Example 2: Using PermissionGuard

```jsx
import { PermissionGuard } from '../components/PermissionGuard';
import { Permission } from '../utils/permissions';

function FAQManagement() {
  return (
    <div>
      <h1>FAQ Management</h1>
      <FAQList />
      
      <PermissionGuard permission={Permission.DELETE_FAQS}>
        <button onClick={handleDelete}>Delete FAQ</button>
      </PermissionGuard>
    </div>
  );
}
```

### Example 3: Using Hooks

```jsx
import { usePermission, useIsSuperAdmin } from '../utils/permissions';
import { Permission } from '../utils/permissions';

function Dashboard() {
  const canManageAdmins = usePermission(Permission.MANAGE_ADMIN_USERS);
  const isSuperAdmin = useIsSuperAdmin();
  
  return (
    <div>
      <h1>Dashboard</h1>
      {canManageAdmins && <AdminUsersLink />}
      {isSuperAdmin && <SystemSettingsLink />}
    </div>
  );
}
```

## Permission Constants

All permissions are available in `Permission` object:

```javascript
import { Permission } from '../utils/permissions';

// User Management
Permission.VIEW_USERS
Permission.MANAGE_USERS
Permission.DELETE_USERS

// Admin Management
Permission.VIEW_ADMIN_USERS
Permission.MANAGE_ADMIN_USERS
Permission.DELETE_ADMIN_USERS

// Assessment Management
Permission.VIEW_ASSESSMENTS
Permission.MANAGE_ASSESSMENTS
Permission.DELETE_ASSESSMENT_QUESTIONS

// Content Management
Permission.CREATE_CONTENT
Permission.EDIT_CONTENT
Permission.DELETE_CONTENT

// And more...
```

## Role Permissions Summary

### User Role
- View and generate reports
- Upload files

### Admin Role
- Manage users (view, create, edit)
- Manage assessments
- Manage content (create, edit)
- Manage FAQs (create, edit)
- Manage feedback
- **Cannot delete** users, content, FAQs, or questions

### Super Admin Role
- **All admin permissions** plus:
- Delete users
- Manage admin users
- Delete content
- Delete FAQs
- Delete assessment questions
- Delete learning sections

## Best Practices

1. **Always check permissions on backend** - Frontend checks are for UX only
2. **Use Permission constants** - Don't use magic strings
3. **Provide fallback UI** - Show appropriate message when permission denied
4. **Test with different roles** - Ensure UI behaves correctly for each role
5. **Keep permissions in sync** - Frontend permissions should match backend

## Troubleshooting

### Permission not working?

1. Check user role: `getUserRole()`
2. Verify permission exists in `permissions.js`
3. Check if role has the permission in `ROLE_PERMISSIONS`
4. Ensure role is stored in sessionStorage

### Navigation items not showing?

1. Check navigation config has permission assigned
2. Verify user has the required permission
3. Check `getAdminNavigation()` is filtering correctly

## Security Note

⚠️ **Frontend permission checks are for UX only!**

Always validate permissions on the backend. Users can modify frontend code, so never rely solely on frontend checks for security.
