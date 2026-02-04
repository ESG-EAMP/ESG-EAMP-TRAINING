# PLATFORM PKSLestari  
<div align="center">
  <img src="https://www.chas.co.uk/wp-content/uploads/2022/10/image7.jpg" alt="The Basket">
</div>

# React + Vite Project Setup and Documentation

## Table of Contents
1. [Project Initialization](#project-initialization)
2. [Project Structure](#project-structure)
3. [Routing Setup](#routing-setup)
4. [Creating Pages](#creating-pages)
5. [State Management](#state-management)
6. [Styling](#styling)
7. [Adding Plugins](#adding-plugins)
8. [Deployment](#deployment)
9. [Performance Optimization](#performance-optimization)
10. [Advanced Routing & Sidebar Configuration](#advanced-routing-sidebar-configuration)

## Project Initialization

### Prerequisites
- Node.js (v18.0.0 or later)
- npm or yarn

### Initial Setup
```bash
npm install
npm run dev
```

## Project Structure
```
my-react-app/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── Layout.jsx
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   └── Contact.jsx
│   ├── routes/
│   │   └── index.jsx
│   ├── App.jsx
│   └── main.jsx
├── .eslintrc.cjs
├── index.html
├── package.json
└── vite.config.js
```

## Routing Setup

### Install React Router
```bash
npm install react-router-dom
```

### Configure Routes (`src/routes/index.jsx`)
```jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import About from '../pages/About';
import Contact from '../pages/Contact';
import ErrorPage from '../pages/ErrorPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'about',
        element: <About />
      },
      {
        path: 'contact',
        element: <Contact />
      }
    ]
  }
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
```

### Layout Component (`src/components/Layout.jsx`)
```jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### Navbar Component (`src/components/Navbar.jsx`)
```jsx
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  );
}
```

### Update Main Entry (`src/main.jsx`)
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import Routes from './routes'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Routes />
  </React.StrictMode>,
)
```

## Creating Pages

### Example Page: Home (`src/pages/Home.jsx`)
```jsx
export default function Home() {
  return (
    <div>
      <h1>Welcome to My React App</h1>
      <p>This is the homepage of our Vite React application.</p>
    </div>
  );
}
```

### Example Page: About (`src/pages/About.jsx`)
```jsx
export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Learn more about our project and team.</p>
    </div>
  );
}
```

### Error Handling Page (`src/pages/ErrorPage.jsx`)
```jsx
import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  
  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}
```

## State Management

### Using React Context (Simple Solution)
```jsx
// src/context/AppContext.jsx
import { createContext, useState } from 'react';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    theme: 'light'
  });

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}
```

### Alternative: Zustand (Recommended for Complex State)
```bash
npm install zustand
```

```jsx
// src/stores/useUserStore.js
import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null })
}));

export default useUserStore;
```

## Styling Options

### CSS Modules
```jsx
import styles from './Home.module.css';

export default function Home() {
  return <div className={styles.container}>...</div>;
}
```

### Tailwind CSS Integration
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

<!-- ## Adding Plugins

### ESLint Configuration
```bash
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
```

### Create `.eslintrc.cjs`
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
``` -->

<!-- ## Deployment

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`

### Netlify Deployment
1. Install Netlify CLI: `npm install netlify-cli -g`
2. Run: `netlify deploy`

## Performance Optimization

### Code Splitting
```jsx
import { lazy, Suspense } from 'react';

const About = lazy(() => import('./pages/About'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes />
    </Suspense>
  );
}
```

### Vite Performance Tips in `vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
``` -->

## Advanced Routing & Sidebar Configuration

This guide explains how to add new routes to your React application and display them in the sidebar, depending on the user's role (admin or user).

---

### 1. **Creating a New Route**

Routes are defined in `src/App.jsx` using React Router.  
Each route points to a component (page) and can be wrapped in a layout.

#### **Steps:**
1. **Create your new page component**  
   Example: `src/pages/MyNewPage/MyNewPage.jsx`
   ```jsx
   import React from 'react';
   function MyNewPage() {
     return <div>My New Page Content</div>;
   }
   export default MyNewPage;
   ```

2. **Import your new page in `App.jsx`**
   ```jsx
   import MyNewPage from './pages/MyNewPage/MyNewPage';
   ```

3. **Add a route in `App.jsx`**
   ```jsx
   <Route path="/my-new-page" element={<MainLayout><MyNewPage /></MainLayout>} />
   ```

   - For admin routes, add them inside the `/admin/*` nested routes.

---

### 2. **Adding the Route to Sidebar Navigation**

Sidebar items are configured in `src/layouts/Sidebar/navigationConfig.js`  
There are two arrays:
- `adminNavigation` for admin users
- `userNavigation` for regular users

#### **Steps:**
1. **Open `navigationConfig.js`**

2. **Add a new item to the appropriate array:**

   **For Admin:**
   ```js
   {
     title: 'My New Page',
     path: '/admin/my-new-page',
     icon: 'fa-regular fa-star' // Use a FontAwesome icon class
   }
   ```

   **For User:**
   ```js
   {
     title: 'My New Page',
     path: '/my-new-page',
     icon: 'fa-regular fa-star'
   }
   ```

   - If your item has subpages, use the `children` array:
     ```js
     {
       title: 'Parent Menu',
       icon: 'fa-regular fa-folder',
       children: [
         {
           title: 'Child Page',
           path: '/child-page'
         }
       ]
     }
     ```

---

### 3. **Role-Based Sidebar Rendering**

- The sidebar component should use either `adminNavigation` or `userNavigation` based on the logged-in user's role.
- This is typically handled in your sidebar logic (not shown here).

---

### 4. **Example**

**Add a new "Reports" page for admins:**

1. Create `src/pages/AdminReports/AdminReports.jsx`
2. Import and add the route in `App.jsx`:
   ```jsx
   import AdminReports from './pages/AdminReports/AdminReports';
   // ...
   <Route path="/admin/reports" element={<MainLayout><AdminReports /></MainLayout>} />
   ```
3. Add to `adminNavigation` in `navigationConfig.js`:
   ```js
   {
     title: 'Reports',
     path: '/admin/reports',
     icon: 'fa-regular fa-chart-bar'
   }
   ```

---

### 5. **Tips**

- **Icons:** Use FontAwesome icon classes for the `icon` property.
- **Order:** The order in the array determines the order in the sidebar.
- **Nested Menus:** Use the `children` property for dropdowns/submenus.

---

### 6. **References**

- [React Router Documentation](https://reactrouter.com/)
- [FontAwesome Icons](https://fontawesome.com/icons)

---

**That's it!**  
You can now add new routes and sidebar items for different user roles in your application. If you need more advanced role-based logic, consider using a context or state management solution to control which navigation config is used.

## Recommended Extensions
- ESLint
- Prettier
- React Developer Tools
- Vite