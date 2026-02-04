import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Title from '../../layouts/Title/Title';
import api from '../../utils/api';
import { validateRoleIntegrity, validateRoleFallback } from '../../utils/roleValidation';
import { fetchCurrentUser } from '../../utils/permissions';
import { FaTrashAlt, FaEye, FaEdit, FaUser, FaToggleOn, FaToggleOff, FaLock, FaShieldAlt, FaEnvelope } from 'react-icons/fa';
import AdminPermissionsManager from '../../components/AdminPermissionsManager';

function AdminUsers() {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserInfo, setCurrentUserInfo] = useState(null); // Store full current user info
    const [isValidating, setIsValidating] = useState(true);
    const [adminUsers, setAdminUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const currentAdminRole = localStorage.getItem("admin_access_level");
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedAdminForReset, setSelectedAdminForReset] = useState(null);
    const [resetEmail, setResetEmail] = useState('');
    const [resetEmailError, setResetEmailError] = useState('');
    const [isResetEmailValid, setIsResetEmailValid] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedAdminForPermissions, setSelectedAdminForPermissions] = useState(null);

    useEffect(() => {
        // Validate role from server to prevent tampering
        const validateRole = async () => {
            const validation = await validateRoleIntegrity().catch(() => 
                validateRoleFallback()
            );
            if (validation.isValid) {
                setCurrentUser(validation.role);
            } else {
                setCurrentUser(null);
            }
            setIsValidating(false);
        };
        
        // Fetch current user info for filtering dropdown options
        const fetchCurrentUserInfo = async () => {
            try {
                const userInfo = await fetchCurrentUser(true);
                setCurrentUserInfo(userInfo);
            } catch (error) {
                console.error('Failed to fetch current user info:', error);
            }
        };
        
        validateRole();
        fetchCurrentUserInfo();
        fetchAdminUsers();
    }, []);

    const fetchAdminUsers = async () => {
        setIsLoadingUsers(true);
        try {
            const response = await api.get('/management/admin/admins');
            setAdminUsers(response.data.admins || []);
        } catch (error) {
            console.error('Failed to fetch admin users:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load admin users. Please try again.',
                confirmButtonColor: '#312259'
            });
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleDeleteUser = useCallback((userId) => {
        if (currentAdminRole !== 'super_admin') {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Only Super Admins can delete admin users.',
                confirmButtonColor: '#312259'
            });
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#312259',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                api.delete(`/management/admin/delete/${userId}`)
                    .then(() => {
                        setAdminUsers(prev => prev.filter(user => user.id !== userId));
                        Swal.fire('Deleted!', 'Admin user has been removed.', 'success');
                    })
                    .catch(err => {
                        Swal.fire('Error', err.response?.data?.detail || err.message, 'error');
                    });
            }
        });
    }, [currentAdminRole, setAdminUsers]);

    // const handleStatusChange = useCallback((userId, newStatus) => {
    //     setAdminUsers(prev =>
    //         prev.map(user =>
    //             user.id === userId ? { ...user, status: newStatus } : user
    //         )
    //     );
    // }, [setAdminUsers]);



    const handleEmailNotificationToggle = useCallback(async (userId, notificationType, currentValue) => {
        if (currentAdminRole !== 'super_admin') {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Only Super Admins can change email notification settings.',
                confirmButtonColor: '#312259'
            });
            return;
        }

        const newValue = !currentValue;
        const action = newValue ? 'enable' : 'disable';
        
        // Map notification types to user-friendly names
        const notificationNames = {
            user_registration: 'User Registration',
            verification_update: 'Email Verification Update',
            assessment_submission: 'Assessment Submission',
            report_upload: 'Report Upload'
        };
        
        const notificationName = notificationNames[notificationType] || notificationType;

        try {
            const payload = {
                value: newValue,
                paramtoupdate: `receiveEmailNotifications.${notificationType}`,
                user_id: userId
            };
            await api.put('/management/admin/update/oneparam', payload);

            Swal.fire({
                title: 'Email Notification Updated!',
                text: `${notificationName} notifications have been ${action}d for this admin.`,
                icon: 'success',
                timer: 2000
            }).then(() => {
                fetchAdminUsers();
            });
        } catch (error) {
            console.error("Error updating email notification:", error);
            Swal.fire({
                title: 'Error!',
                text: error.response?.data?.detail || 'Failed to update email notification.',
                icon: 'error',
                confirmButtonColor: '#312259'
            });
        }
    }, [currentAdminRole]);

    const handleStatusChange = async (userId, newStatus) => {
        try {
            const payload = {
                value: newStatus,
                paramtoupdate: 'isActive',
                user_id: userId
            };
            await api.put('/management/admin/update/oneparam', payload);

            Swal.fire({
                title: 'Status changed successfully!',
                icon: 'success',
                timer: 1500
            }).then(() => {
                fetchAdminUsers();
            });
        } catch (error) {
            console.error("Error changing status:", error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to change status.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleAccessLevelChange = async (userId, newAccessLevel) => {
        if (currentAdminRole !== 'super_admin') {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Only Super Admins can change access levels.',
                confirmButtonColor: '#312259'
            });
            return;
        }

        Swal.fire({
            title: 'Change Access Level?',
            html: `Are you sure you want to change this admin's access level to <strong>${newAccessLevel}</strong>?<br/><br/>
                   <small className="text-muted">This will affect what features they can access.</small>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#312259',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, change it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const payload = {
                        value: newAccessLevel,
                        paramtoupdate: 'accessLevel',
                        user_id: userId
                    };
                    await api.put('/management/admin/update/oneparam', payload);

                    Swal.fire({
                        title: 'Access Level Changed!',
                        text: `Admin access level has been updated to ${newAccessLevel}.`,
                        icon: 'success',
                        timer: 2000
                    }).then(() => {
                        fetchAdminUsers();
                    });
                } catch (error) {
                    console.error("Error changing access level:", error);
                    Swal.fire({
                        title: 'Error!',
                        text: error.response?.data?.detail || 'Failed to change access level.',
                        icon: 'error',
                        confirmButtonColor: '#d33'
                    });
                }
            }
        });
    };

    // Filter users based on search term
    const filteredUsers = useMemo(() => {
        if (!adminUsers || !Array.isArray(adminUsers)) {
            return [];
        }
        return adminUsers.filter(user =>
            user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.region?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [adminUsers, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    const formatLastLogin = (value) => {
        if (!value || value === "Never") return "Never";

        const formatter = new Intl.DateTimeFormat("en-MY", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kuala_Lumpur"
        });

        return formatter.format(new Date(value));
    };

    // Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    };

    // Handle reset password modal open
    const handleOpenResetPasswordModal = (admin) => {
        setSelectedAdminForReset(admin);
        setResetEmail(admin.email || '');
        setResetEmailError('');
        setIsResetEmailValid(validateEmail(admin.email || ''));
        setShowResetPasswordModal(true);
    };

    // Handle reset password modal close
    const handleCloseResetPasswordModal = () => {
        setShowResetPasswordModal(false);
        setSelectedAdminForReset(null);
        setResetEmail('');
        setResetEmailError('');
        setIsResetEmailValid(false);
    };

    // Handle permissions modal open
    const handleOpenPermissionsModal = (admin) => {
        setSelectedAdminForPermissions(admin);
        setShowPermissionsModal(true);
    };

    // Handle permissions modal close
    const handleClosePermissionsModal = () => {
        setShowPermissionsModal(false);
        setSelectedAdminForPermissions(null);
    };

    // Handle permissions update callback
    const handlePermissionsUpdate = () => {
        fetchAdminUsers(); // Refresh the list (will show loading spinner)
    };

    // Handle email input change in reset password modal
    const handleResetEmailChange = (e) => {
        const value = e.target.value;
        setResetEmail(value);

        if (value === '') {
            setResetEmailError('');
            setIsResetEmailValid(false);
        } else if (!validateEmail(value)) {
            setResetEmailError('Please enter a valid email address');
            setIsResetEmailValid(false);
        } else {
            setResetEmailError('');
            setIsResetEmailValid(true);
        }
    };

    // Handle reset password submission
    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validate email before submission
        if (!resetEmail.trim()) {
            setResetEmailError('Email address is required');
            return;
        }

        if (!isResetEmailValid) {
            setResetEmailError('Please enter a valid email address');
            return;
        }

        setIsResettingPassword(true);

        try {
            const response = await api.post('/auth/admin/resetpassword', { email: resetEmail });
            const data = response.data;

            Swal.fire({
                title: 'Password Reset Successful!',
                text: 'An email with password reset instructions has been sent.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                handleCloseResetPasswordModal();
            });
        } catch (error) {
            Swal.fire({
                title: 'Reset Failed',
                text: error.response?.data?.detail || error.message || 'Failed to send reset password email. Please try again.',
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        } finally {
            setIsResettingPassword(false);
        }
    };

    if (isValidating) {
        return (
            <div className="container-fluid">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Validating access...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Admin Users Management" breadcrumb={[["Admin Users Management", "/admin/admin-users"], "Admin Users"]} />


            {/* Search and Filter Section */}
            <div className="row mb-4">
                <div className="col-12 text-end mb-4">
                    {currentUser === 'super_admin' && (
                        <Link to="/admin/register" className="btn btn-primary">
                            <i className="mdi mdi-plus-circle me-1"></i>
                            Register New Admin
                        </Link>
                    )}
                </div>
                <div className="col-md-6">
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <i className="mdi mdi-magnify text-muted"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search by name, email, department, position, or region..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-6 text-md-end">
                    <div className="d-flex justify-content-md-end align-items-center gap-2">
                        <label className="form-label  text-muted">Show:</label>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={itemsPerPage}
                            onChange={e => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[10, 20, 30, 40, 50].map(size => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <span className="text-muted">entries</span>
                    </div>
                </div>
            </div>


            {/* Admin Users Table */}
            <div className="">
                <div className="p-0">
                    {isLoadingUsers ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                            <div className="text-center">
                                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                                    <span className="visually-hidden">Loading admin users...</span>
                                </div>
                                <p className="text-muted">Loading admin users...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive rounded shadow-sm bg-white">
                            <table className="table table-hover table-nowrap">
                            <thead className="table-dark">
                                <tr>
                                    <th className="border-0 ps-4 py-3">No</th>
                                    <th className="border-0 py-3">Actions</th>
                                    <th className="border-0 py-3">Admin</th>
                                    <th className="border-0 py-3">Position</th>
                                    <th className="border-0 py-3">Department</th>
                                    <th className="border-0 py-3">Region</th>
                                    <th className="border-0 py-3">Access Level</th>
                                    <th className="border-0 py-3">Status</th>
                                    <th className="border-0 py-3">Email Notifications</th>
                                    <th className="border-0 pe-4 py-3">Last Login</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user, index) => (
                                    <tr key={user.id}>
                                        <td className="ps-4 py-3">
                                            <span className="fw-semibold">{startIndex + index + 1}</span>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex gap-2">
                                                <Link
                                                    to={`/admin/admin-user-profile/${user.id}`}
                                                    className="btn btn-sm"
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <div className="dropdown">
                                                    <button className="btn btn-sm" type="button" data-bs-toggle="dropdown">
                                                        <i className="mdi mdi-dots-vertical"></i>
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        <li>
                                                            <Link
                                                                className="dropdown-item"
                                                                to={`/admin/admin-user-profile/${user.id}`}
                                                            >
                                                                <FaEye className="me-1" />View Details
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <button
                                                                className="dropdown-item text-info"
                                                                type="button"
                                                                onClick={() => handleOpenResetPasswordModal(user)}
                                                            >
                                                                <FaLock className="me-1" />Reset Password
                                                            </button>
                                                        </li>
                                                        {currentUser === 'super_admin' && (
                                                            <>
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item text-primary"
                                                                        type="button"
                                                                        onClick={() => handleOpenPermissionsModal(user)}
                                                                    >
                                                                        <FaShieldAlt className="me-1" />Manage Permissions
                                                                    </button>
                                                                </li>
                                                                <li>
                                                                    <button
                                                                        className={`dropdown-item ${user.status === 'Active' ? 'text-warning' : 'text-success'}`}
                                                                        type="button"
                                                                        onClick={() => handleStatusChange(user.id, user.status !== 'Active')}
                                                                    >
                                                                        {user.status === 'Active' ? (
                                                                            <>
                                                                                <FaToggleOff className="me-1" />Deactivate
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <FaToggleOn className="me-1" />Activate
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </li>
                                                                <li><hr className="dropdown-divider m-0 p-0" /></li>
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item text-danger"
                                                                        type="button"
                                                                        onClick={() => handleDeleteUser(user.id)}
                                                                    >
                                                                        <FaTrashAlt className="me-1" />Delete
                                                                    </button>
                                                                </li>
                                                            </>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle me-3" style={{ width: '40px', height: '40px' }}>
                                                    <FaUser className="text-primary" />
                                                </div>
                                                <div>
                                                    <h6 className="fw-semibold ">
                                                        {user.fullName}
                                                    </h6>
                                                    <small className="text-muted">{user.email || 'N/A'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span>{user.position || 'N/A'}</span>
                                        </td>
                                        <td className="py-3">
                                            <span>{user.department || 'N/A'}</span>
                                        </td>
                                        <td className="py-3">
                                            <span>{user.region || 'N/A'}</span>
                                        </td>
                                        <td className="py-3">
                                            {currentUser === 'super_admin' ? (
                                                <div className="dropdown">
                                                    <button 
                                                        className={`btn btn-sm badge ${user.accessLevel === 'Super Admin' || user.accessLevel === 'super_admin' ? 'bg-danger' : 'bg-primary'}`}
                                                        type="button" 
                                                        data-bs-toggle="dropdown"
                                                        title="Click to change access level"
                                                    >
                                                        {user.accessLevel === 'Super Admin' || user.accessLevel === 'super_admin' 
                                                            ? 'Super Admin' 
                                                            : user.accessLevel === 'Administrator' || user.accessLevel === 'admin'
                                                            ? 'Administrator'
                                                            : user.accessLevel}
                                                        <i className="mdi mdi-chevron-down ms-1"></i>
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        {(() => {
                                                            // Get current logged-in user's access level with multiple fallbacks
                                                            const currentUserAccessLevel = 
                                                                currentUserInfo?.access_level || 
                                                                currentUserInfo?.accessLevel || 
                                                                currentAdminRole || 
                                                                currentUser || 
                                                                '';
                                                            
                                                            // Get user being edited's current access level
                                                            const userAccessLevel = user.accessLevel || '';
                                                            
                                                            // Normalize access level strings for comparison
                                                            const normalizeLevel = (level) => {
                                                                if (!level) return '';
                                                                const normalized = level.toLowerCase().trim();
                                                                if (normalized === 'super admin' || normalized === 'super_admin' || normalized === 'superadministrator' || normalized === 'super administrator') {
                                                                    return 'super_admin';
                                                                }
                                                                if (normalized === 'administrator' || normalized === 'admin') {
                                                                    return 'admin';
                                                                }
                                                                return normalized;
                                                            };
                                                            
                                                            const currentUserNormalized = normalizeLevel(currentUserAccessLevel);
                                                            const userNormalized = normalizeLevel(userAccessLevel);
                                                            
                                                            // Filter options: 
                                                            // - Super admins can see all options (can change any user's role)
                                                            // - Non-super admins: don't show if it matches current user's role or user's current role
                                                            const isCurrentUserSuperAdmin = currentUserNormalized === 'super_admin';
                                                            
                                                            const shouldShowAdministrator = 
                                                                isCurrentUserSuperAdmin || (currentUserNormalized !== 'admin' && userNormalized !== 'admin');
                                                            
                                                            const shouldShowSuperAdmin = 
                                                                isCurrentUserSuperAdmin || (currentUserNormalized !== 'super_admin' && userNormalized !== 'super_admin');
                                                            
                                                            return (
                                                                <>
                                                                    {shouldShowAdministrator && (
                                                                        <li>
                                                                            <button
                                                                                className={`dropdown-item ${(user.accessLevel === 'Administrator' || user.accessLevel === 'admin') ? 'active' : ''}`}
                                                                                type="button"
                                                                                onClick={() => handleAccessLevelChange(user.id, 'Administrator')}
                                                                            >
                                                                                <i className="mdi mdi-shield-account me-2"></i>Administrator
                                                                            </button>
                                                                        </li>
                                                                    )}
                                                                    {shouldShowSuperAdmin && (
                                                                        <li>
                                                                            <button
                                                                                className={`dropdown-item ${(user.accessLevel === 'Super Admin' || user.accessLevel === 'super_admin') ? 'active' : ''}`}
                                                                                type="button"
                                                                                onClick={() => handleAccessLevelChange(user.id, 'Super Admin')}
                                                                            >
                                                                                <i className="mdi mdi-shield-crown me-2"></i>Super Admin
                                                                            </button>
                                                                        </li>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <span className={`badge ${user.accessLevel === 'Super Admin' || user.accessLevel === 'super_admin' ? 'bg-danger' : 'bg-primary'}`}>
                                                    {user.accessLevel === 'Super Admin' || user.accessLevel === 'super_admin' 
                                                        ? 'Super Admin' 
                                                        : user.accessLevel === 'Administrator' || user.accessLevel === 'admin'
                                                        ? 'Administrator'
                                                        : user.accessLevel}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`fas ${user.status === 'Active' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'}`}></i>
                                                {user.status || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            {(() => {
                                                const notifications = user.receiveEmailNotifications || {
                                                    user_registration: false,
                                                    verification_update: false,
                                                    assessment_submission: false,
                                                    report_upload: false
                                                };
                                                
                                                const enabledCount = Object.values(notifications).filter(v => v === true).length;
                                                const totalCount = Object.keys(notifications).length;
                                                
                                                return currentUser === 'super_admin' ? (
                                                    <div className="dropdown">
                                                        <button 
                                                            className={`btn btn-sm ${enabledCount > 0 ? 'btn-success' : 'btn-outline-secondary'}`}
                                                            type="button" 
                                                            data-bs-toggle="dropdown"
                                                            title="Click to manage email notifications"
                                                        >
                                                            <FaEnvelope className="me-1" />
                                                            {enabledCount > 0 ? `${enabledCount}/${totalCount}` : 'None'}
                                                            <i className="mdi mdi-chevron-down ms-1"></i>
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '280px', padding: '0.5rem' }}>
                                                            <li className="dropdown-header">
                                                                <small className="fw-bold">Email Notifications</small>
                                                            </li>
                                                            <li><hr className="dropdown-divider m-0" /></li>
                                                            <li>
                                                                <div className="form-check px-3 py-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`notif-user-reg-${user.id}`}
                                                                        checked={notifications.user_registration === true}
                                                                        onChange={() => handleEmailNotificationToggle(user.id, 'user_registration', notifications.user_registration)}
                                                                    />
                                                                    <label className="form-check-label" htmlFor={`notif-user-reg-${user.id}`} style={{ cursor: 'pointer' }}>
                                                                        <small>User Registration</small>
                                                                    </label>
                                                                </div>
                                                            </li>
                                                            <li className="d-none">
                                                                <div className="form-check px-3 py-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`notif-verification-${user.id}`}
                                                                        checked={notifications.verification_update === true}
                                                                        onChange={() => handleEmailNotificationToggle(user.id, 'verification_update', notifications.verification_update)}
                                                                    />
                                                                    <label className="form-check-label" htmlFor={`notif-verification-${user.id}`} style={{ cursor: 'pointer' }}>
                                                                        <small>Email Verification Update</small>
                                                                    </label>
                                                                </div>
                                                            </li>
                                                            <li>
                                                                <div className="form-check px-3 py-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`notif-assessment-${user.id}`}
                                                                        checked={notifications.assessment_submission === true}
                                                                        onChange={() => handleEmailNotificationToggle(user.id, 'assessment_submission', notifications.assessment_submission)}
                                                                    />
                                                                    <label className="form-check-label" htmlFor={`notif-assessment-${user.id}`} style={{ cursor: 'pointer' }}>
                                                                        <small>Assessment Submission</small>
                                                                    </label>
                                                                </div>
                                                            </li>
                                                            <li>
                                                                <div className="form-check px-3 py-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`notif-report-${user.id}`}
                                                                        checked={notifications.report_upload === true}
                                                                        onChange={() => handleEmailNotificationToggle(user.id, 'report_upload', notifications.report_upload)}
                                                                    />
                                                                    <label className="form-check-label" htmlFor={`notif-report-${user.id}`} style={{ cursor: 'pointer' }}>
                                                                        <small>Report Upload</small>
                                                                    </label>
                                                                </div>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center">
                                                        <FaEnvelope className={`me-1 ${enabledCount > 0 ? 'text-success' : 'text-muted'}`} />
                                                        <small className={enabledCount > 0 ? 'text-success' : 'text-muted'}>
                                                            {enabledCount > 0 ? `${enabledCount}/${totalCount} enabled` : 'None enabled'}
                                                        </small>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="pe-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <i className="mdi mdi-clock text-muted me-1"></i>
                                                <span className="small">{formatLastLogin(user.lastLogin)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Empty State - Only show when not loading */}
            {!isLoadingUsers && filteredUsers.length === 0 && (
                <div className="">
                    <div className="">
                        <div className="text-center py-5">
                            <i className="mdi mdi-account-group display-1 text-muted"></i>
                            <h5 className="mt-3 text-muted">
                                {searchTerm ? 'No users found' : 'No admin users available'}
                            </h5>
                            <p className="text-muted">
                                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by registering a new admin user'}
                            </p>
                            {currentUser === 'super_admin' && (
                                <Link to="/admin/register" className="btn btn-primary">
                                    <i className="mdi mdi-plus-circle me-1"></i>
                                    Register New Admin
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination - Only show when not loading */}
            {!isLoadingUsers && totalPages > 1 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <nav aria-label="Admin users pagination">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="mdi mdi-chevron-left"></i>
                                    </button>
                                </li>

                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    const isActive = pageNum === currentPage;

                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <li key={pageNum} className={`page-item ${isActive ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return (
                                            <li key={pageNum} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}

                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <i className="mdi mdi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            <div
                className={`modal fade ${showResetPasswordModal ? 'show d-block' : ''}`}
                tabIndex="-1"
                style={{ backgroundColor: showResetPasswordModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}
                onClick={handleCloseResetPasswordModal}
            >
                <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Reset Password</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleCloseResetPasswordModal}
                                disabled={isResettingPassword}
                            ></button>
                        </div>
                        <form onSubmit={handleResetPassword}>
                            <div className="modal-body">
                                <p className="text-muted mb-4">
                                    Make sure the email is correct. If not please go to this admin's profile to update the email.
                                </p>
                                <div className="mb-3">
                                    <label htmlFor="resetEmail" className="form-label">
                                        Email address
                                    </label>
                                    <input
                                        className={`form-control ${resetEmailError ? 'is-invalid' : isResetEmailValid ? 'is-valid' : ''}`}
                                        type="email"
                                        id="resetEmail"
                                        name="resetEmail"
                                        required
                                        placeholder="Enter email address"
                                        value={resetEmail}
                                        onChange={handleResetEmailChange}
                                        disabled={true}
                                    />
                                    {resetEmailError && (
                                        <div className="invalid-feedback">
                                            {resetEmailError}
                                        </div>
                                    )}
                                    {isResetEmailValid && !resetEmailError && (
                                        <div className="valid-feedback">
                                            Email address looks good!
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleCloseResetPasswordModal}
                                    disabled={isResettingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!isResetEmailValid || !resetEmail.trim() || isResettingPassword}
                                >
                                    {isResettingPassword ? (
                                        <>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FaLock className="me-1" /> Send Reset Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Permissions Management Modal */}
            <div
                className={`modal fade ${showPermissionsModal ? 'show d-block' : ''}`}
                tabIndex="-1"
                style={{ backgroundColor: showPermissionsModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}
                onClick={handleClosePermissionsModal}
            >
                <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <FaShieldAlt className="me-2" />
                                Manage Permissions - {selectedAdminForPermissions?.fullName}
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleClosePermissionsModal}
                            ></button>
                        </div>
                        {selectedAdminForPermissions && (
                            <AdminPermissionsManager
                                userId={selectedAdminForPermissions.id}
                                adminName={selectedAdminForPermissions.fullName}
                                onClose={handleClosePermissionsModal}
                                onUpdate={handlePermissionsUpdate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminUsers;
