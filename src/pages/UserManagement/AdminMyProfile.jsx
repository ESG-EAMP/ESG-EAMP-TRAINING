import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import api from '../../utils/api';
import Swal from 'sweetalert2';
import { FaShieldAlt, FaUser, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaIdCard, FaClock } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';
import { fetchCurrentUser, hasPermission, Permission } from '../../utils/permissions';

function AdminMyProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [adminData, setAdminData] = useState(null);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    
    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // First get current user data from /auth/admin/me (doesn't require VIEW_ADMIN_USERS)
            const currentUser = await fetchCurrentUser(true);
            
            if (!currentUser || !currentUser.user_id) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Unable to load your profile. Please try logging in again.',
                    confirmButtonColor: '#312259'
                }).then(() => {
                    navigate('/admin/dashboard');
                });
                setLoading(false);
                return;
            }

            // Build base admin data from /auth/admin/me (always available)
            const baseAdminData = {
                id: currentUser.user_id,
                user_id: currentUser.user_id,
                email: currentUser.email,
                fullName: currentUser.full_name || currentUser.email,
                accessLevel: currentUser.access_level,
                status: currentUser.is_active ? 'Active' : 'Inactive',
                position: null,
                department: null,
                region: null,
                phoneNumber: null,
                employeeId: null,
                lastLogin: null
            };

            // Try to fetch additional details from /management/admin/admins if user has VIEW_ADMIN_USERS permission
            // This endpoint has more detailed information like position, department, region, etc.
            if (hasPermission(Permission.VIEW_ADMIN_USERS, currentUser)) {
                try {
                    const response = await api.get('/management/admin/admins');
                    const admins = response.data.admins || [];
                    
                    // Find current user's admin record
                    const admin = admins.find(a => {
                        const adminId = String(a.id || '').trim();
                        const adminUserId = String(a.user_id || '').trim();
                        const adminMongoId = String(a._id || '').trim();
                        const userId = String(currentUser.user_id || '').trim();
                        
                        if (adminId && adminId === userId) return true;
                        if (adminUserId && adminUserId === userId) return true;
                        if (adminMongoId && adminMongoId === userId) return true;
                        
                        if (userId.length === 24) {
                            if (adminId && adminId.length === 24 && adminId.toLowerCase() === userId.toLowerCase()) return true;
                            if (adminUserId && adminUserId.length === 24 && adminUserId.toLowerCase() === userId.toLowerCase()) return true;
                            if (adminMongoId && adminMongoId.length === 24 && adminMongoId.toLowerCase() === userId.toLowerCase()) return true;
                        }
                        
                        return false;
                    });
                    
                    // Merge additional details if found
                    if (admin) {
                        baseAdminData.position = admin.position || null;
                        baseAdminData.department = admin.department || null;
                        baseAdminData.region = admin.region || null;
                        baseAdminData.phoneNumber = admin.phoneNumber || null;
                        baseAdminData.employeeId = admin.employeeId || null;
                        baseAdminData.lastLogin = admin.lastLogin || null;
                        // Keep status from currentUser as it's more reliable
                        if (admin.status) {
                            baseAdminData.status = admin.status;
                        }
                    }
                } catch (adminListError) {
                    // If fetching admin list fails, continue with base data
                    // This allows users without VIEW_ADMIN_USERS to still view their profile
                    console.warn('Could not fetch additional admin details:', adminListError);
                }
            }
            
            setAdminData(baseAdminData);
            setFormData({
                fullName: baseAdminData.fullName || '',
                position: baseAdminData.position || '',
                department: baseAdminData.department || '',
                region: baseAdminData.region || '',
                phoneNumber: baseAdminData.phoneNumber || '',
                employeeId: baseAdminData.employeeId || ''
            });
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to load your profile';
            setError(errorMessage);
            setLoading(false);
            
            Swal.fire({
                icon: 'error',
                title: 'Error Loading Profile',
                text: errorMessage,
                confirmButtonColor: '#312259'
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.fullName || formData.fullName.trim() === '') {
            errors.fullName = 'Full name is required';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);
        try {
            const currentUser = await fetchCurrentUser(true);
            if (!currentUser || !currentUser.user_id) {
                throw new Error('Unable to identify user');
            }

            // Update each field that has changed using self-update endpoint
            const updates = [];
            const fieldsToUpdate = ['fullName', 'position', 'department', 'region', 'phoneNumber', 'employeeId'];
            
            for (const field of fieldsToUpdate) {
                if (formData[field] !== adminData[field]) {
                    updates.push(
                        api.put('/auth/admin/update-profile', {
                            value: formData[field] || '',
                            paramtoupdate: field === 'fullName' ? 'fullName' : field,
                            user_id: currentUser.user_id
                        })
                    );
                }
            }

            if (updates.length > 0) {
                await Promise.all(updates);
            }

            // Update local state
            const updatedAdminData = {
                ...adminData,
                ...formData
            };
            setAdminData(updatedAdminData);
            setEditMode(false);
            setFieldErrors({});

            Swal.fire({
                title: 'Profile updated successfully!',
                icon: 'success',
                confirmButtonColor: '#312259'
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            Swal.fire({
                title: 'Failed to update profile',
                text: error.response?.data?.detail || error.message || 'An error occurred',
                icon: 'error',
                confirmButtonColor: '#312259'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            fullName: adminData.fullName || '',
            position: adminData.position || '',
            department: adminData.department || '',
            region: adminData.region || '',
            phoneNumber: adminData.phoneNumber || '',
            employeeId: adminData.employeeId || ''
        });
        setFieldErrors({});
        setEditMode(false);
    };

    const validatePassword = () => {
        const errors = {};
        
        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
        
        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters long';
        }
        
        if (!passwordData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        if (passwordData.currentPassword === passwordData.newPassword) {
            errors.newPassword = 'New password must be different from current password';
        }
        
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (validatePassword()) {
            setIsUpdatingPassword(true);
            try {
                const res = await api.put('/auth/admin/changepassword', {
                    email: adminData.email,
                    newpassword: passwordData.newPassword,
                    oldpassword: passwordData.currentPassword
                });

                const data = res.data;
                console.log(data);

                if (!data.success) {
                    throw new Error(data.message || 'Password update failed');
                }

                // Clear password form
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowPasswords({
                    currentPassword: false,
                    newPassword: false,
                    confirmPassword: false
                });

                Swal.fire({
                    title: 'Password updated successfully!',
                    icon: 'success',
                    confirmButtonColor: '#312259'
                });
            } catch (error) {
                console.error('Error updating password:', error);
                Swal.fire({
                    title: 'Failed to update password!',
                    text: error.response?.data?.detail || error.message || 'An error occurred',
                    icon: 'error',
                    confirmButtonColor: '#312259'
                });
            } finally {
                setIsUpdatingPassword(false);
            }
        }
    };

    const formatLastLogin = (value) => {
        if (!value || value === "Never") return "Never";
        const formatter = new Intl.DateTimeFormat("en-MY", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kuala_Lumpur"
        });
        return formatter.format(new Date(value));
    };

    const formatAccessLevel = (level) => {
        if (!level) return 'N/A';
        // If already formatted (contains spaces), return as is
        if (level.includes(' ')) {
            return level;
        }
        // Format snake_case or camelCase
        return level
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title 
                    title="My Profile" 
                    breadcrumb={[["Dashboard", "/admin/dashboard"], "My Profile"]} 
                />
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!adminData) {
        return (
            <div className="container-fluid">
                <Title 
                    title="My Profile" 
                    breadcrumb={[["Dashboard", "/admin/dashboard"], "My Profile"]} 
                />
                <div className="card border rounded-4 shadow-sm mt-4">
                    <div className="card-body p-4 text-center">
                        <i className="fas fa-exclamation-triangle text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                        <h5 className="mb-3">{error ? 'Error Loading Profile' : 'Profile Not Found'}</h5>
                        <p className="text-muted mb-4">
                            {error ? error : 'Your profile could not be loaded. Please try again later.'}
                        </p>
                        {error && (
                            <div className="alert alert-danger mb-4 text-start">
                                <strong>Error Details:</strong>
                                <pre className="mb-0 mt-2" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{error}</pre>
                            </div>
                        )}
                        <div className="d-flex gap-2 justify-content-center">
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setError(null);
                                    setLoading(true);
                                    fetchAdminData();
                                }}
                            >
                                <i className="fas fa-sync me-2"></i>
                                Retry
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => navigate('/admin/dashboard')}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title 
                title="My Profile" 
                breadcrumb={[["Dashboard", "/admin/dashboard"], "My Profile"]} 
            />

            {/* Profile Header */}
            <div className="mb-2">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col text-end">
                            {!editMode ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setEditMode(true)}
                                >
                                    <i className="fas fa-edit me-1"></i>
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="d-flex gap-2 justify-content-end">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <>
                                                <FiLoader className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-1"></i>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Left Column - Profile Card */}
                <div className="col-lg-4">
                    <div className="card border rounded-4 shadow-sm h-100">
                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3" style={{ width: '100px', height: '100px' }}>
                                    <FaUser className="text-primary" style={{ fontSize: '3rem' }} />
                                </div>
                                <h4 className="fw-bold mb-1">{adminData.fullName || 'N/A'}</h4>
                                <p className="text-muted mb-3">{adminData.email || 'N/A'}</p>
                                <span className={`badge ${adminData.accessLevel === 'Super Admin' || adminData.accessLevel === 'super_admin' ? 'bg-danger' : 'bg-primary'} fs-6`}>
                                    {formatAccessLevel(adminData.accessLevel)}
                                </span>
                            </div>

                            <div className="border-top pt-3">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                        <FaEnvelope className="text-primary" />
                                    </div>
                                    <div className="flex-grow-1">
                                        <small className="text-muted d-block">Email</small>
                                        <span className="fw-medium">{adminData.email || 'N/A'}</span>
                                    </div>
                                </div>

                                {(adminData.position || editMode) && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaIdCard className="text-info" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Position</small>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldErrors.position ? 'is-invalid' : ''}`}
                                                    name="position"
                                                    value={formData.position || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter position"
                                                />
                                            ) : (
                                                <span className="fw-medium">{adminData.position || '—'}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(adminData.department || editMode) && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaBuilding className="text-success" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Department</small>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldErrors.department ? 'is-invalid' : ''}`}
                                                    name="department"
                                                    value={formData.department || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter department"
                                                />
                                            ) : (
                                                <span className="fw-medium">{adminData.department || '—'}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(adminData.region || editMode) && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaMapMarkerAlt className="text-warning" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Region</small>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldErrors.region ? 'is-invalid' : ''}`}
                                                    name="region"
                                                    value={formData.region || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter region"
                                                />
                                            ) : (
                                                <span className="fw-medium">{adminData.region || '—'}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(adminData.phoneNumber || editMode) && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaPhone className="text-primary" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Phone Number</small>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldErrors.phoneNumber ? 'is-invalid' : ''}`}
                                                    name="phoneNumber"
                                                    value={formData.phoneNumber || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter phone number"
                                                />
                                            ) : (
                                                <span className="fw-medium">{adminData.phoneNumber || '—'}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(adminData.employeeId || editMode) && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaIdCard className="text-info" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Employee ID</small>
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldErrors.employeeId ? 'is-invalid' : ''}`}
                                                    name="employeeId"
                                                    value={formData.employeeId || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter employee ID"
                                                />
                                            ) : (
                                                <span className="fw-medium">{adminData.employeeId || '—'}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-secondary bg-opacity-10 rounded-circle p-2 me-3">
                                        <FaClock className="text-secondary" />
                                    </div>
                                    <div className="flex-grow-1">
                                        <small className="text-muted d-block">Last Login</small>
                                        <span className="fw-medium">{formatLastLogin(adminData.lastLogin)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Details */}
                <div className="col-lg-8">
                    {/* Status Card */}
                    <div className="card border rounded-4 shadow-sm mb-4">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-3">
                                <FaShieldAlt className="me-2 text-primary" />
                                Account Status
                            </h5>
                            <div className="d-flex align-items-center gap-2">
                                <i className={`fas ${adminData.status === 'Active' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'}`} style={{ fontSize: '1.5rem' }}></i>
                                <span className={`badge ${adminData.status === 'Active' ? 'bg-success' : 'bg-danger'} fs-6`}>
                                    {adminData.status || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Admin Details Card */}
                    <div className="card border rounded-4 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4">
                                <FaUser className="me-2 text-primary" />
                                My Details
                            </h5>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Full Name</label>
                                    {editMode ? (
                                        <>
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.fullName ? 'is-invalid' : ''}`}
                                                name="fullName"
                                                value={formData.fullName || ''}
                                                onChange={handleInputChange}
                                                placeholder="Enter full name"
                                                required
                                            />
                                            {fieldErrors.fullName && (
                                                <div className="invalid-feedback">{fieldErrors.fullName}</div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="form-control-plaintext fw-medium">{adminData.fullName || 'N/A'}</div>
                                    )}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Email</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.email || 'N/A'}</div>
                                    <small className="text-muted">Email cannot be changed</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Position</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            className={`form-control ${fieldErrors.position ? 'is-invalid' : ''}`}
                                            name="position"
                                            value={formData.position || ''}
                                            onChange={handleInputChange}
                                            placeholder="Enter position"
                                        />
                                    ) : (
                                        <div className="form-control-plaintext fw-medium">{adminData.position || 'N/A'}</div>
                                    )}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Department</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            className={`form-control ${fieldErrors.department ? 'is-invalid' : ''}`}
                                            name="department"
                                            value={formData.department || ''}
                                            onChange={handleInputChange}
                                            placeholder="Enter department"
                                        />
                                    ) : (
                                        <div className="form-control-plaintext fw-medium">{adminData.department || 'N/A'}</div>
                                    )}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Region</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            className={`form-control ${fieldErrors.region ? 'is-invalid' : ''}`}
                                            name="region"
                                            value={formData.region || ''}
                                            onChange={handleInputChange}
                                            placeholder="Enter region"
                                        />
                                    ) : (
                                        <div className="form-control-plaintext fw-medium">{adminData.region || 'N/A'}</div>
                                    )}
                                </div>
                                {(adminData.phoneNumber || editMode) && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Phone Number</label>
                                        {editMode ? (
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.phoneNumber ? 'is-invalid' : ''}`}
                                                name="phoneNumber"
                                                value={formData.phoneNumber || ''}
                                                onChange={handleInputChange}
                                                placeholder="Enter phone number"
                                            />
                                        ) : (
                                            <div className="form-control-plaintext fw-medium">{adminData.phoneNumber || 'N/A'}</div>
                                        )}
                                    </div>
                                )}
                                {(adminData.employeeId || editMode) && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Employee ID</label>
                                        {editMode ? (
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.employeeId ? 'is-invalid' : ''}`}
                                                name="employeeId"
                                                value={formData.employeeId || ''}
                                                onChange={handleInputChange}
                                                placeholder="Enter employee ID"
                                            />
                                        ) : (
                                            <div className="form-control-plaintext fw-medium">{adminData.employeeId || 'N/A'}</div>
                                        )}
                                    </div>
                                )}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Access Level</label>
                                    <div>
                                        <span className={`badge ${adminData.accessLevel === 'Super Admin' || adminData.accessLevel === 'super_admin' ? 'bg-danger' : 'bg-primary'} fs-6`}>
                                            {formatAccessLevel(adminData.accessLevel)}
                                        </span>
                                    </div>
                                    <small className="text-muted">Access level cannot be changed</small>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Status</label>
                                    <div>
                                        <span className={`badge ${adminData.status === 'Active' ? 'bg-success' : 'bg-danger'} fs-6`}>
                                            <i className={`fas ${adminData.status === 'Active' ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                                            {adminData.status || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Last Login</label>
                                    <div className="form-control-plaintext fw-medium">
                                        <FaClock className="me-1 text-muted" />
                                        {formatLastLogin(adminData.lastLogin)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="card border rounded-4 shadow-sm mt-4">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4">
                                <i className="fas fa-lock me-1 text-warning"></i>
                                Change Password
                            </h5>
                            <p className="text-muted mb-4">Update your account password to keep your account secure</p>

                            <form onSubmit={handleUpdatePassword}>
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-medium text-muted">Current Password</label>
                                        <div className="position-relative">
                                            <input
                                                type={showPasswords.currentPassword ? "text" : "password"}
                                                className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''} pe-5`}
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-2"
                                                style={{ border: 'none', background: 'none', zIndex: 10 }}
                                                onClick={() => setShowPasswords(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
                                            >
                                                <i className={`fas ${showPasswords.currentPassword ? 'fa-eye-slash' : 'fa-eye'} text-muted`}></i>
                                            </button>
                                        </div>
                                        {passwordErrors.currentPassword && (
                                            <div className="invalid-feedback">{passwordErrors.currentPassword}</div>
                                        )}
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-medium text-muted">New Password</label>
                                        <div className="position-relative">
                                            <input
                                                type={showPasswords.newPassword ? "text" : "password"}
                                                className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''} pe-5`}
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-2"
                                                style={{ border: 'none', background: 'none', zIndex: 10 }}
                                                onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                                            >
                                                <i className={`fas ${showPasswords.newPassword ? 'fa-eye-slash' : 'fa-eye'} text-muted`}></i>
                                            </button>
                                        </div>
                                        {passwordErrors.newPassword && (
                                            <div className="invalid-feedback">{passwordErrors.newPassword}</div>
                                        )}
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label fw-medium text-muted">Confirm Password</label>
                                        <div className="position-relative">
                                            <input
                                                type={showPasswords.confirmPassword ? "text" : "password"}
                                                className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''} pe-5`}
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y pe-2"
                                                style={{ border: 'none', background: 'none', zIndex: 10 }}
                                                onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                                            >
                                                <i className={`fas ${showPasswords.confirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-muted`}></i>
                                            </button>
                                        </div>
                                        {passwordErrors.confirmPassword && (
                                            <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end">
                                    <button
                                        type="submit"
                                        className="btn btn-warning"
                                        disabled={isUpdatingPassword}
                                    >
                                        {isUpdatingPassword ? (
                                            <>
                                                <FiLoader className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-key me-1"></i>
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminMyProfile;
