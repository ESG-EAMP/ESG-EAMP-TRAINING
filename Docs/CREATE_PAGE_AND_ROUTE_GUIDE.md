# Step-by-Step Guide: Creating a Page and Adding Route to Sidebar

This guide walks you through creating a new page and adding it to the sidebar navigation in the ESG-EAMP-TRAINING project.

## Table of Contents
1. [Create a New Page Component](#step-1-create-a-new-page-component)
2. [Add Route in App.jsx](#step-2-add-route-in-appjsx)
3. [Add to Sidebar Navigation](#step-3-add-to-sidebar-navigation)
   - [For Admin Routes](#for-admin-routes)
   - [For User Routes](#for-user-routes)
4. [Understanding Permissions (Admin Routes)](#step-4-understanding-permissions-admin-routes)
5. [Complete Example](#complete-example)

---

## Step 1: Create a New Page Component

### 1.1 Determine the Page Type
- **Admin Page**: Place in `src/pages/Admin[FeatureName]/`
- **User Page**: Place in `src/pages/User[FeatureName]/`
- **Public/Landing Page**: Place in `src/pages/Landing/`

### 1.2 Create the Page File Structure

**Example: Creating an Admin page called "MyNewFeature"**

1. Create the directory:
   ```
   src/pages/AdminMyNewFeature/
   ```

2. Create the component file:
   ```
   src/pages/AdminMyNewFeature/MyNewFeature.jsx
   ```

### 1.3 Write the Page Component

**Template for Admin Page:**

```jsx
import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import api from '../../utils/api';
import Swal from 'sweetalert2';

function MyNewFeature() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/your-api-endpoint');
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load data.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <Title 
                title="My New Feature" 
                breadcrumb={['Home', 'My New Feature']} 
            />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {/* Your page content here */}
                                    <h5>My New Feature Content</h5>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyNewFeature;
```

**Template for User Page:**

```jsx
import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import api from '../../utils/api';

function MyNewFeature() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/your-api-endpoint');
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <Title 
                title="My New Feature" 
                breadcrumb={['Dashboard', 'My New Feature']} 
            />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            {/* Your page content here */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyNewFeature;
```

---

## Step 2: Add Route in App.jsx

### 2.1 Import the Component

Open `src/App.jsx` and add your import at the top with other imports:

```jsx
import MyNewFeature from './pages/AdminMyNewFeature/MyNewFeature';
```

### 2.2 Add the Route

**For Admin Routes:**

Add inside the `AdminRoutes()` function, around line 258-301:

```jsx
function AdminRoutes() {
  return (
    <Routes>
      {/* ... existing routes ... */}
      
      {/* Add your new route */}
      <Route path="/my-new-feature" element={<MainLayout><MyNewFeature /></MainLayout>} />
      
      {/* ... rest of routes ... */}
    </Routes>
  );
}
```

**For User Routes:**

Add inside the `<Route element={<PrivateRoute />}>` section, around line 229-250:

```jsx
<Route element={<PrivateRoute />}>
  {/* ... existing routes ... */}
  
  {/* Add your new route */}
  <Route path="/my-new-feature" element={<MainLayout><MyNewFeature /></MainLayout>} />
  
  {/* ... rest of routes ... */}
</Route>
```

**For Public Routes:**

Add in the public routes section, around line 210-227:

```jsx
{/* Public Routes */}
<Route path="/" element={<Landing />} />
{/* ... existing routes ... */}

{/* Add your new public route */}
<Route path="/my-new-feature" element={<LandingLayout><MyNewFeature /></LandingLayout>} />
```

---

## Step 3: Add to Sidebar Navigation

### For Admin Routes

#### 3.1 Open Navigation Config File

Open `src/layouts/Sidebar/navigationConfig.js`

#### 3.2 Add to Admin Navigation Array

Add your menu item to the `baseAdminNavigation` array (around line 9-128).

**Option A: Simple Menu Item (No Children)**

```jsx
const baseAdminNavigation = [
  // ... existing items ...
  
  {
    title: 'My New Feature',
    path: '/admin/my-new-feature',
    icon: 'fa-regular fa-star', // Choose an icon from Font Awesome
    permission: Permission.MANAGE_MY_FEATURE, // Optional: if permission is required
  },
  
  // ... rest of items ...
];
```

**Option B: Menu Item with Children (Dropdown)**

```jsx
const baseAdminNavigation = [
  // ... existing items ...
  
  {
    title: 'My Feature Group',
    icon: 'fa-regular fa-folder',
    permission: Permission.VIEW_MY_FEATURE_GROUP,
    children: [
      {
        title: 'My New Feature',
        path: '/admin/my-new-feature',
        permission: Permission.MANAGE_MY_FEATURE,
      },
      {
        title: 'Another Feature',
        path: '/admin/another-feature',
        permission: Permission.MANAGE_ANOTHER_FEATURE,
      },
    ]
  },
  
  // ... rest of items ...
];
```

#### 3.3 Understanding Icons

Use Font Awesome icons. Format: `fa-regular fa-[icon-name]` or `fa-solid fa-[icon-name]`

Common icons:
- `fa-chart-mixed` - Dashboard/Charts
- `fa-clipboard` - Assessment/Forms
- `fa-users` - Users
- `fa-file-lines` - Content/Documents
- `fa-life-ring` - Support
- `fa-user` - Profile
- `fa-calendar` - Events
- `fa-graduation-cap` - Learning
- `fa-star` - Featured/New

Browse icons at: https://fontawesome.com/icons

#### 3.4 Understanding Permissions

If your menu item requires a permission:

1. **Check if permission exists** in `src/utils/permissions.js`:
   ```jsx
   export const Permission = {
     // ... existing permissions ...
     MANAGE_MY_FEATURE: 'manage_my_feature',
   };
   ```

2. **Add permission to your menu item**:
   ```jsx
   {
     title: 'My New Feature',
     path: '/admin/my-new-feature',
     icon: 'fa-regular fa-star',
     permission: Permission.MANAGE_MY_FEATURE,
   }
   ```

3. **If no permission needed** (all admins can access), omit the `permission` property:
   ```jsx
   {
     title: 'My New Feature',
     path: '/admin/my-new-feature',
     icon: 'fa-regular fa-star',
     // No permission property = all admins can access
   }
   ```

### For User Routes

#### 3.1 Open Navigation Config File

Open `src/layouts/Sidebar/navigationConfig.js`

#### 3.2 Add to User Navigation Array

Add your menu item to the `userNavigation` array (around line 180-230):

**Option A: Simple Menu Item**

```jsx
export const userNavigation = [
  // ... existing items ...
  
  {
    title: 'My New Feature',
    path: '/my-new-feature',
    icon: 'fa-regular fa-star'
  },
  
  // ... rest of items ...
];
```

**Option B: Menu Item with Children**

```jsx
export const userNavigation = [
  // ... existing items ...
  
  {
    title: 'My Feature Group',
    icon: 'fa-regular fa-folder',
    children: [
      {
        title: 'My New Feature',
        path: '/my-new-feature'
      },
      {
        title: 'Another Feature',
        path: '/another-feature'
      },
    ]
  },
  
  // ... rest of items ...
];
```

**Note:** User navigation does NOT use permissions - all logged-in users can see all user menu items.

---

## Step 4: Understanding Permissions (Admin Routes)

### 4.1 Permission System Overview

The admin sidebar uses a permission-based system:
- Each menu item can specify a `permission` requirement
- Only users with that permission will see the menu item
- Permissions are fetched from the backend API

### 4.2 How Permissions Work

1. **Backend provides permissions**: The backend API returns user permissions in the user object
2. **Frontend filters navigation**: The `getAdminNavigation()` function filters menu items based on user permissions
3. **Dynamic sidebar**: The sidebar updates based on the logged-in user's permissions

### 4.3 Adding a New Permission

If you need a new permission:

1. **Backend**: Ensure your backend API includes the permission in the user object
2. **Frontend**: Add to `src/utils/permissions.js`:
   ```jsx
   export const Permission = {
     // ... existing permissions ...
     MANAGE_MY_FEATURE: 'manage_my_feature',
   };
   ```
3. **Use in navigation**: Reference it in your menu item as shown in Step 3.2

### 4.4 Permission-Free Menu Items

If you want ALL admins to see a menu item (regardless of permissions), simply omit the `permission` property:

```jsx
{
  title: 'Dashboard',
  path: '/admin/dashboard',
  icon: 'fa-regular fa-chart-mixed',
  // No permission property = all admins can access
}
```

---

## Complete Example

Let's create a complete example: **"Announcements" page for Admin**

### Step 1: Create the Page Component

**File:** `src/pages/AdminAnnouncements/Announcements.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import api from '../../utils/api';
import Swal from 'sweetalert2';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

function Announcements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/announcements');
            setAnnouncements(response.data);
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load announcements.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <Title 
                title="Announcements" 
                breadcrumb={['Home', 'Announcements']} 
            />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="card-title mb-0">Announcements</h5>
                                <button className="btn btn-primary">
                                    <FaPlus className="me-1" /> Add New
                                </button>
                            </div>
                            
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {announcements.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="text-center">
                                                        No announcements found
                                                    </td>
                                                </tr>
                                            ) : (
                                                announcements.map((announcement) => (
                                                    <tr key={announcement.id}>
                                                        <td>{announcement.title}</td>
                                                        <td>{announcement.date}</td>
                                                        <td>
                                                            <span className={`badge ${announcement.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                                {announcement.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-sm btn-primary me-1">
                                                                <FaEdit />
                                                            </button>
                                                            <button className="btn btn-sm btn-danger">
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Announcements;
```

### Step 2: Add Route in App.jsx

**File:** `src/App.jsx`

Add import at the top:
```jsx
import Announcements from './pages/AdminAnnouncements/Announcements';
```

Add route in `AdminRoutes()` function:
```jsx
function AdminRoutes() {
  return (
    <Routes>
      {/* ... existing routes ... */}
      <Route path="/announcements" element={<MainLayout><Announcements /></MainLayout>} />
      {/* ... rest of routes ... */}
    </Routes>
  );
}
```

### Step 3: Add to Sidebar Navigation

**File:** `src/layouts/Sidebar/navigationConfig.js`

Add to `baseAdminNavigation` array:
```jsx
const baseAdminNavigation = [
  // ... existing items ...
  
  {
    title: 'Announcements',
    path: '/admin/announcements',
    icon: 'fa-regular fa-bullhorn',
    permission: Permission.MANAGE_ANNOUNCEMENTS, // Optional: if permission is required
  },
  
  // ... rest of items ...
];
```

**If you want it under a group:**
```jsx
{
  title: 'Content Management',
  icon: 'fa-regular fa-file-lines',
  permission: Permission.VIEW_CONTENT,
  children: [
    // ... existing children ...
    {
      title: 'Announcements',
      path: '/admin/announcements',
      permission: Permission.MANAGE_ANNOUNCEMENTS,
    },
  ]
}
```

---

## Quick Checklist

- [ ] Created page component file in appropriate directory
- [ ] Imported necessary dependencies (React, Title, api, etc.)
- [ ] Added route import in `App.jsx`
- [ ] Added route definition in appropriate section (AdminRoutes/PrivateRoute/Public)
- [ ] Added menu item to navigation config file
- [ ] Chose appropriate icon from Font Awesome
- [ ] Added permission (if required for admin routes)
- [ ] Tested the route by navigating to the URL
- [ ] Verified menu item appears in sidebar
- [ ] Verified page loads correctly

---

## Troubleshooting

### Menu item doesn't appear in sidebar

**For Admin Routes:**
- Check if user has the required permission
- Verify permission name matches backend permission
- Check browser console for errors
- Ensure `permission` property is correct or omitted if not needed

**For User Routes:**
- Verify you're logged in as a user (not admin)
- Check that route path matches exactly
- Verify the component is exported correctly

### Route doesn't work / 404 error

- Verify route path in `App.jsx` matches the path in navigation config
- Check that component is imported correctly
- Ensure route is inside the correct wrapper (`<PrivateRoute />`, `<AdminRoute />`, or public)
- Verify MainLayout or LandingLayout wrapper is correct

### Permission denied

- Check backend API returns the permission in user object
- Verify permission name matches exactly (case-sensitive)
- Check `src/utils/permissions.js` has the permission defined
- Ensure `hasPermission()` function works correctly

---

## Additional Resources

- **React Router Docs**: https://reactrouter.com/
- **Font Awesome Icons**: https://fontawesome.com/icons
- **Project Structure**: See `src/pages/` for more examples
- **Permission System**: See `src/utils/permissions.js` for permission definitions

---

## Notes

- Always wrap admin/user pages with `<MainLayout>` component
- Always wrap public/landing pages with `<LandingLayout>` component
- Use the `Title` component for consistent page titles
- Follow existing code patterns for consistency
- Test thoroughly before deploying
