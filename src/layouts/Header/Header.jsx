import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSearch, FaBell, FaThLarge, FaCog, FaMoon, FaExpand } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import Swal from 'sweetalert2';
import api, { API_BASE, getToken, removeToken } from "../../utils/api";
function Header() {
    let msme_user = null;
    let admin_user = null;
    try {
        const msmeUserStr = localStorage.getItem('user');
        msme_user = msmeUserStr && msmeUserStr !== "undefined" ? JSON.parse(msmeUserStr) : null;
        const adminUserStr = localStorage.getItem('admin_user');
        admin_user = adminUserStr && adminUserStr !== "undefined" ? JSON.parse(adminUserStr) : null;
    } catch (e) {
        msme_user = null;
        admin_user = null;
    }
    const userRole = sessionStorage.getItem('user_role');
    const user = userRole === 'user' ? msme_user : admin_user;
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = localStorage.getItem('user_id');
                const token = getToken(); // Use centralized token management

                if (!userId || !token) {
                    // Fallback to localStorage data
                    const user = JSON.parse(localStorage.getItem('user'));
                    if (user) {
                        const formattedUserData = {
                            _id: user._id || '',
                            first_name: user.first_name || '',
                            last_name: user.last_name || '',
                            email: user.email || '',
                            firm_name: user.firm_name || '',
                            contact_no: user.contact_no || '',
                            industry: user.industry || '',
                            business_size: user.business_size || '',
                            location: user.location || '',
                            logo: user.logo || null,
                            verification: user.verification || null,
                            status: user.status || null,
                            created_at: user.created_at || '',
                            updated_at: user.updated_at || ''
                        };
                        setUserData(formattedUserData);
                        setFormData(formattedUserData);
                    }
                    return;
                }

                const response = await api.get(`/auth/user/user/${userId}`);
                const apiData = response.data;

                // Extract user data from nested response
                const userData = apiData.user || apiData;

                // Format the API response data
                const formattedUserData = {
                    _id: userData._id || '',
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    email: userData.email || '',
                    firm_name: userData.firm_name || '',
                    contact_no: userData.contact_no || '',
                    industry: userData.industry || '',
                    business_size: userData.business_size || '',
                    location: userData.location || '',
                    logo: userData.logo || null,
                    verification: userData.verification || null,
                    status: userData.status || null,
                    created_at: userData.created_at || '',
                    updated_at: userData.updated_at || ''
                };

                setUserData(formattedUserData);
                setFormData(formattedUserData);
                
                // Set logo URL if it exists
                if (formattedUserData.logo) {
                    setLogoUrl(formattedUserData.logo);
                }

                // Update localStorage with fresh data
                localStorage.setItem('user', JSON.stringify(formattedUserData));

            } catch (error) {
                console.error('Error fetching user data:', error);

                // Fallback to localStorage data on error
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) {
                    const formattedUserData = {
                        _id: user._id || '',
                        first_name: user.first_name || '',
                        last_name: user.last_name || '',
                        email: user.email || '',
                        firm_name: user.firm_name || '',
                        contact_no: user.contact_no || '',
                        industry: user.industry || '',
                        business_size: user.business_size || '',
                        location: user.location || '',
                        logo: user.logo || null,
                        verification: user.verification || null,
                        status: user.status || null,
                        created_at: user.created_at || '',
                        updated_at: user.updated_at || ''
                    };
                    setUserData(formattedUserData);
                    setFormData(formattedUserData);
                    
                    // Set logo URL if it exists
                    if (formattedUserData.logo) {
                        setLogoUrl(formattedUserData.logo);
                    }
                }

                // Show error message
                Swal.fire({
                    title: 'Warning',
                    text: 'Could not fetch latest user data. Showing cached information.',
                    icon: 'warning',
                    confirmButtonColor: '#667eea'
                });
            } finally {
            }
        };

        fetchUserData();
    }, []);

    const handleSignOut = async () => {
        try {
            Swal.fire({
                title: 'Logging out...',
                text: 'Please wait while we log you out.',
                icon: 'info',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const token = getToken(); // Use centralized token management
            const userRole = sessionStorage.getItem('user_role');
            console.log('Logging out with token:', token);
            if (token && token !== "undefined" && userRole) {
                const logoutUrl = userRole === 'admin' || userRole === 'super_admin'
                    ? '/auth/admin/logout'
                    : '/auth/user/logout';
                try {
                    await api.post(logoutUrl, { token });
                } catch (error) {
                    // Logout endpoint may fail, but we still want to clear local storage
                    console.log('Logout API call failed:', error);
                }
            }
            removeToken(); // Use centralized token removal
            localStorage.clear();
            // Note: No need to clear user permissions cache here since we're redirecting
            // which will destroy the JavaScript context and clear all in-memory caches
            setTimeout(() => {
                Swal.close();
                if (userRole === 'admin' || userRole === 'super_admin') {
                    navigate('/admin/login');
                }
                if (userRole === 'user') {
                    navigate('/login');
                }
            }, 6000); // 6 seconds
        } catch (error) {
            console.log(error);
            localStorage.clear();
            setTimeout(() => {
                Swal.close();
                navigate('/login');
            }, 6000);
        }
    }

    function enterFullscreen() {
        const element = document.documentElement; // or any specific element
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { // Safari
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) { // Firefox
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) { // IE/Edge
            element.msRequestFullscreen();
        }
    }


    return (
        <div className="navbar-custom">            
            <div className="topbar container-fluid">
                <div className="d-flex align-items-center gap-lg-2 gap-1">        
                    <button className="button-toggle-menu">
                        <i className="mdi mdi-menu"></i>
                    </button>
                    Hi!👋 {user ? user?.first_name ?? user?.fullName ?? user?.email : ''}                    

                    <button
                        className="navbar-toggle"
                        data-bs-toggle="collapse"
                        data-bs-target="#topnav-menu-content"
                    >
                        <div className="lines">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                </div>

                {/* Left: Toggle + Search */}
                <div className="d-flex align-items-center gap-3 d-none">
                    <div className="search-box d-none d-md-flex align-items-center bg-light rounded ps-2">
                        <FaSearch className="text-muted me-1" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="form-control border-0 bg-light"
                            style={{ width: '200px' }}
                        />
                        <button className="btn btn-primary ms-2">Search</button>
                    </div>
                </div>



                <ul className="topbar-menu d-flex align-items-center gap-3">
                    <li className="dropdown notification-list d-none">
                        <div className="dropdown btn-group">
                            <a
                                className="nav-link dropdown-toggle arrow-none fs-4"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <i className="fa-sharp fa-solid fa-bell"></i>
                                <span className="noti-icon-badge"></span>
                            </a>
                            <div
                                className="dropdown-menu dropdown-menu-animated"
                                style={{ width: "300px" }}
                            >
                                <div
                                    className="px-2"
                                    style={{ maxHeight: "300px" }}
                                    data-simplebar="init"
                                >
                                    <div
                                        className="simplebar-wrapper"
                                        style={{ margin: "0px -12px" }}
                                    >
                                        <div className="simplebar-height-auto-observer-wrapper">
                                            <div className="simplebar-height-auto-observer"></div>
                                        </div>
                                        <div className="simplebar-mask">
                                            <div
                                                className="simplebar-offset"
                                                style={{ right: "0px", bottom: "0px" }}
                                            >
                                                <div
                                                    className="simplebar-content-wrapper"
                                                    tabIndex="0"
                                                    role="region"
                                                    aria-label="scrollable content"
                                                    style={{ height: "auto", overflow: "hidden scroll" }}
                                                >
                                                    <div
                                                        className="simplebar-content"
                                                        style={{ padding: "0px 12px" }}
                                                    >
                                                        <h5 className="text-muted font-13 fw-normal mt-2">
                                                            Today
                                                        </h5>

                                                        <a
                                                            href="#"
                                                            className="dropdown-item p-0 notify-item card unread-noti shadow-none mb-2"
                                                        >
                                                            <div className="card-body">
                                                                <span className="float-end noti-close-btn text-muted">
                                                                    <i className="mdi mdi-close"></i>
                                                                </span>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="notify-icon bg-primary">
                                                                            <i className="mdi mdi-comment-account-outline"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 text-truncate ms-2">
                                                                        <h5 className="noti-item-title fw-semibold font-14">
                                                                            Datacorp
                                                                            <small className="fw-normal text-muted ms-1">
                                                                                1 min ago
                                                                            </small>
                                                                        </h5>
                                                                        <small className="noti-item-subtitle text-muted">
                                                                            Caleb Flakelar commented on Admin
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>

                                                        <a
                                                            href="#"
                                                            className="dropdown-item p-0 notify-item card read-noti shadow-none mb-2"
                                                        >
                                                            <div className="card-body">
                                                                <span className="float-end noti-close-btn text-muted">
                                                                    <i className="mdi mdi-close"></i>
                                                                </span>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="notify-icon bg-info">
                                                                            <i className="mdi mdi-account-plus"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 text-truncate ms-2">
                                                                        <h5 className="noti-item-title fw-semibold font-14">
                                                                            Admin
                                                                            <small className="fw-normal text-muted ms-1">
                                                                                1 hours ago
                                                                            </small>
                                                                        </h5>
                                                                        <small className="noti-item-subtitle text-muted">
                                                                            New user registered
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>

                                                        <h5 className="text-muted font-13 fw-normal mt-0">
                                                            Yesterday
                                                        </h5>

                                                        <a
                                                            href="#"
                                                            className="dropdown-item p-0 notify-item card read-noti shadow-none mb-2"
                                                        >
                                                            <div className="card-body">
                                                                <span className="float-end noti-close-btn text-muted">
                                                                    <i className="mdi mdi-close"></i>
                                                                </span>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="notify-icon">
                                                                            <img
                                                                                src="assets/images/users/avatar-2.jpg"
                                                                                className="img-fluid rounded-circle"
                                                                                alt=""
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 text-truncate ms-2">
                                                                        <h5 className="noti-item-title fw-semibold font-14">
                                                                            Cristina Pride
                                                                            <small className="fw-normal text-muted ms-1">
                                                                                1 day ago
                                                                            </small>
                                                                        </h5>
                                                                        <small className="noti-item-subtitle text-muted">
                                                                            Hi, How are you? What about our next
                                                                            meeting
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>

                                                        <h5 className="text-muted font-13 fw-normal mt-0">
                                                            30 Dec 2021
                                                        </h5>

                                                        <a
                                                            href="#"
                                                            className="dropdown-item p-0 notify-item card read-noti shadow-none mb-2"
                                                        >
                                                            <div className="card-body">
                                                                <span className="float-end noti-close-btn text-muted">
                                                                    <i className="mdi mdi-close"></i>
                                                                </span>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="notify-icon bg-primary">
                                                                            <i className="mdi mdi-comment-account-outline"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 text-truncate ms-2">
                                                                        <h5 className="noti-item-title fw-semibold font-14">
                                                                            Datacorp
                                                                        </h5>
                                                                        <small className="noti-item-subtitle text-muted">
                                                                            Caleb Flakelar commented on Admin
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>

                                                        <a
                                                            href="#"
                                                            className="dropdown-item p-0 notify-item card read-noti shadow-none mb-2"
                                                        >
                                                            <div className="card-body">
                                                                <span className="float-end noti-close-btn text-muted">
                                                                    <i className="mdi mdi-close"></i>
                                                                </span>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="notify-icon">
                                                                            <img
                                                                                src="assets/images/users/avatar-4.jpg"
                                                                                className="img-fluid rounded-circle"
                                                                                alt=""
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 text-truncate ms-2">
                                                                        <h5 className="noti-item-title fw-semibold font-14">
                                                                            Karen Robinson
                                                                        </h5>
                                                                        <small className="noti-item-subtitle text-muted">
                                                                            Wow ! this admin looks good and awesome
                                                                            design
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </a>

                                                        <div className="text-center">
                                                            <i className="mdi mdi-dots-circle mdi-spin text-muted h3 mt-0"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="simplebar-placeholder"
                                            style={{ width: "auto", height: "523px" }}
                                        ></div>
                                    </div>
                                    <div
                                        className="simplebar-track simplebar-horizontal"
                                        style={{ visibility: "hidden" }}
                                    >
                                        <div
                                            className="simplebar-scrollbar"
                                            style={{ width: "0px", display: "none" }}
                                        ></div>
                                    </div>
                                    <div
                                        className="simplebar-track simplebar-vertical"
                                        style={{ visibility: "visible" }}
                                    >
                                        <div
                                            className="simplebar-scrollbar"
                                            style={{
                                                height: "172px",
                                                transform: "translate3d(0px, 0px, 0px)",
                                                display: "block",
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>


                    <li className="d-md-inline-block">
                        <span className="nav-link" href="" onClick={() => enterFullscreen()}>
                            <i className="fa-solid fa-expand fs-4"></i>
                        </span>
                    </li>

                    <li className="dropdown">
                        <a
                            className="nav-link dropdown-toggle arrow-none nav-user px-2"
                            data-bs-toggle="dropdown"
                            href="#"
                            role="button"
                            aria-haspopup="false"
                            aria-expanded="false"
                        >
                            <span className="account-user-avatar d-inline-block overflow-hidden rounded-circle" style={{ width: 32, height: 32 }}>
                                <img
                                    src={logoUrl ? `${import.meta.env.VITE_APP_API}${logoUrl}` : "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740"}
                                    alt="user-image"
                                    width="32"
                                    height="32"
                                    className="rounded-circle w-100 h-100"
                                    style={{ objectFit: 'cover' }}
                                />
                            </span>
                            <span className="d-lg-flex flex-column gap-1 d-none">
                                <h5 className="my-0">{user ? user?.first_name ?? user?.email : 'Dominic Keller'}</h5>
                                <h6 className="my-0 fw-normal">{userRole?.toUpperCase().replace(/_/g, " ")}</h6>
                            </span>
                        </a>
                        <div className="dropdown-menu dropdown-menu-end dropdown-menu-animated profile-dropdown">
                            <div className="dropdown-header noti-title">
                                <h6 className="text-overflow m-0">Welcome !</h6>
                            </div>

                            <a href="#" className="dropdown-item d-none">
                                <i className="mdi mdi-account-circle me-1"></i>
                                <span>My Account</span>
                            </a>

                            <div type="button" onClick={handleSignOut} className="dropdown-item">
                                <i className="mdi mdi-logout me-1"></i>
                                <span>Logout</span>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Header;
