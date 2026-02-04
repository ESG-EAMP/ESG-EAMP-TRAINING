import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import { FiLoader } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../../utils/api';

function AdminProfile() {
    const [adminData, setAdminData] = useState({
        email: localStorage.getItem('admin_email') || '',
        fullName: '',
        accessLevel: '',
        position: '',
        phoneNumber: '',
        employeeId: '',
    });

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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            // Get admin data from localStorage (set during login)
            const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
            setAdminData({
                email: adminUser.email || localStorage.getItem('admin_email') || '',
                fullName: adminUser.fullName || '',
                accessLevel: adminUser.accessLevel || '',
                position: adminUser.position || '',
                phoneNumber: adminUser.phoneNumber || '',
                employeeId: adminUser.employeeId || '',
            });
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
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
                    confirmButtonColor: '#667eea'
                });
            } catch (error) {
                console.error('Error updating password:', error);
                Swal.fire({
                    title: 'Failed to update password!',
                    text: error.response?.data?.detail || error.message || 'An error occurred',
                    icon: 'error',
                    confirmButtonColor: '#f5576c'
                });
            } finally {
                setIsUpdatingPassword(false);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="container-fluid">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="My Profile" breadcrumb={[["Dashboard", "/admin/dashboard"], "My Profile"]} />

            <div className="row">
                <div className="col-12">
                    {/* Profile Header Card */}
                    <div className="mb-2">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-8">
                                    <h2 className="mb-1 fw-bold text-dark section-title">Admin Profile</h2>
                                    <p className="text-muted">Manage your account information</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Information Card */}
                    <div className="border rounded-4 shadow profile-card">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4 section-title">
                                <i className="fas fa-user me-1 text-primary"></i>
                                Profile Information
                            </h5>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Full Name</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.fullName || '—'}</div>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Email</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.email || '—'}</div>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Access Level</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.accessLevel || '—'}</div>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Position</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.position || '—'}</div>
                                </div>

                                {adminData.phoneNumber && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Phone Number</label>
                                        <div className="form-control-plaintext fw-medium">{adminData.phoneNumber}</div>
                                    </div>
                                )}

                                {adminData.employeeId && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Employee ID</label>
                                        <div className="form-control-plaintext fw-medium">{adminData.employeeId}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="border rounded-4 shadow mt-4 profile-card">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4 section-title">
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

export default AdminProfile;

