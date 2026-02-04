import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { getAdminNavigation, userNavigation } from './navigationConfig';
import { fetchCurrentUser } from '../../utils/permissions';

function Sidebar() {
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    // Fetch current user from backend on mount and when route changes
    useEffect(() => {
        const loadUser = async (forceRefresh = false) => {
            if (isAdminRoute) {
                setIsLoadingUser(true);
                try {
                    const user = await fetchCurrentUser(forceRefresh);
                    setCurrentUser(user);
                } catch (error) {
                    console.error('Error loading user for sidebar:', error);
                    setCurrentUser(null);
                } finally {
                    setIsLoadingUser(false);
                }
            } else {
                // Not admin route, no need to load user
                setIsLoadingUser(false);
            }
        };
        
        // Initial load
        loadUser();
        
        // Set up periodic refresh (every 2 minutes) to keep permissions up-to-date
        // This ensures permission changes are reflected without requiring page refresh
        if (isAdminRoute) {
            const refreshInterval = setInterval(() => {
                loadUser(true); // Force refresh to bypass cache
            }, 2 * 60 * 1000); // 2 minutes
            
            return () => clearInterval(refreshInterval);
        }
    }, [isAdminRoute]);
    
    const isActive = (paths) => {
        return paths.some(path => {
            // Handle dynamic routes by checking if current path starts with the route pattern
            if (path.includes(':')) {
                // Convert dynamic route pattern to regex-like matching
                const routePattern = path.replace(/:[^/]+/g, '[^/]+');
                const regex = new RegExp(`^${routePattern}$`);
                return regex.test(location.pathname);
            }
            // For static routes, use exact match
            return location.pathname === path;
        });
    };
    
    // Get navigation based on user permissions (including custom_permissions)
    // Only get admin navigation if user data is loaded (not loading and user exists or is null)
    // Use useMemo to prevent unnecessary recalculations
    const navigation = React.useMemo(() => {
        if (!isAdminRoute) {
            return userNavigation;
        }
        if (isLoadingUser) {
            return [];
        }
        return getAdminNavigation(currentUser);
    }, [isAdminRoute, isLoadingUser, currentUser]);

    useEffect(() => {
        const html = document.documentElement;
        html.setAttribute('data-sidenav-size', 'default');

        // Add event listener for sidebar toggle
        const handleSidebarToggle = () => {
            const html = document.documentElement;
            const contentPage = document.querySelector('.content-page');

            setIsMinimized(prev => {
                const newState = !prev;
                html.setAttribute('data-sidenav-size', newState ? 'condensed' : 'default');
                return newState;
            });

            if (contentPage) {
                contentPage.style.height = `calc(100vh - var(--ct-topbar-height) - var(--ct-footer-height))`;
            }
        };

        // Add click event listeners to toggle buttons
        const toggleButtons = document.querySelectorAll('.button-sm-hover, .button-toggle-menu');
        toggleButtons.forEach(button => {
            button.addEventListener('click', handleSidebarToggle);
        });

        // Cleanup
        return () => {
            toggleButtons.forEach(button => {
                button.removeEventListener('click', handleSidebarToggle);
            });
        };
    }, []);

    const renderNavItem = (item, index) => {
        const itemKey = item.path || item.title || `nav-item-${index}`;
        
        if (item.children) {
            const collapseId = `sidebar${item.title.replace(/\s+/g, '')}`;
            return (
                <li key={itemKey} className={`side-nav-item ${isActive(item.children.map(child => child.path)) ? "menuitem-active" : ""}`}>
                    <a
                        data-bs-toggle="collapse"
                        href={`#${collapseId}`}
                        aria-expanded="false"
                        aria-controls={collapseId}
                        className="side-nav-link"
                    >
                        <i className={item.icon} />
                        <span className="menu-arrow"></span>
                        <span> {item.title} </span>
                    </a>
                    <div className="collapse" id={collapseId}>
                        <ul className="side-nav-second-level">
                            {item.children.map((child, childIndex) => {
                                if (child.donotshow) return null;
                                const childKey = child.path || child.title || `nav-child-${index}-${childIndex}`;
                                return (
                                    <li key={childKey} className={isActive([child.path]) ? "menuitem-active" : ""}>
                                        <Link to={child.path}>{child.title}</Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </li>
            );
        }

        return (
            <li key={itemKey} className={`side-nav-item ${isActive([item.path]) ? "menuitem-active" : ""}`}>
                <Link to={item.path} className="side-nav-link">
                    <i className={item.icon} />
                    <span> {item.title} </span>
                </Link>
            </li>
        );
    };

    return (
        <div className="leftside-menu" style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 1000,
            transition: 'all 0.25s ease-in-out'
        }}>
            <Helmet>
                <link
                    href="/css/style.css"
                    rel="stylesheet"
                    type="text/css"
                    id="app-style"
                />
                <script src="/js/app.min.js" />
            </Helmet>
            <a href={isAdminRoute ? "/admin/dashboard" : "/dashboard"} className="logo logo-light p-sm-0">
                <span className="logo-lg" style={{ padding: '0px' }}>
                    <img
                        src="/assetsv2/pks-lestari-logov2.png"
                        jsaction=""
                        className="w-100 h-100"
                        alt="Is ESG Dead? | PublicRelay"
                        jsname="kn3ccd"
                    />
                </span>
                <span className="logo-sm">
                    <img
                        src="/assetsv2/pks-lestari-logov2.png"
                        jsaction=""
                        height={30}
                        
                        alt="Is ESG Dead? | PublicRelay"
                        jsname="kn3ccd"
                    />
                </span>
            </a>
            <div
                className="button-sm-hover"
                data-bs-toggle="tooltip"
                data-bs-placement="right"
                title="Show Full Sidebar"
                onClick={() => {
                    const html = document.documentElement;
                    html.setAttribute('data-sidenav-size', isMinimized ? 'default' : 'condensed');
                    setIsMinimized(!isMinimized);
                }}
            >
                <i className="ri-checkbox-blank-circle-line align-middle" />
            </div>

            <div className="button-close-fullsidebar">
                <i className="ri-close-fill align-middle" />
            </div>

            <div id="leftside-menu-container" data-simplebar>
                <ul className="side-nav">
                    <li className="side-nav-title">Navigation</li>
                    {isLoadingUser && isAdminRoute ? (
                        // Show loading state while fetching user data
                        <li key="loading" className="px-3 py-2 text-white-50">
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <small>Loading permissions...</small>
                            </div>
                        </li>
                    ) : navigation.length > 0 ? (
                        navigation.map((item, index) => renderNavItem(item, index))
                    ) : isAdminRoute ? (
                        // No navigation items - user might not have permissions
                        <li key="no-items" className="px-3 py-2 text-white-50">
                            <small>No menu items available</small>
                        </li>
                    ) : !isAdminRoute ? (
                        // User navigation (always render)
                        userNavigation.map((item, index) => renderNavItem(item, index))
                    ) : null}
                </ul>

                <div className="help-box text-white text-center">
                    <h5 className="mt-3">{isAdminRoute ? "ESG ADMIN" : "MSME USER"}</h5>
                    <p className="mb-3">
                        {isAdminRoute 
                            ? "Welcome to ESG admin dashboard!" 
                            : "Dashboard!"}
                    </p>
                </div>

                <div className="clearfix" />
            </div>
        </div>
    );
}

export default Sidebar;
