import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import api from '../../utils/api';
import Swal from 'sweetalert2';
import { FaShieldAlt, FaUser, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaIdCard, FaClock, FaToggleOn, FaToggleOff, FaLock } from 'react-icons/fa';
import AdminPermissionsManager from '../../components/AdminPermissionsManager';
import { isSuperAdmin, getUserRole } from '../../utils/permissions';

function AdminUserProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [adminData, setAdminData] = useState(null);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchAdminData();
            // Get current user role
            const role = getUserRole();
            setCurrentUserRole(role);
        }
    }, [userId]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/management/admin/admins');
            const admins = response.data.admins || [];
            console.log('Fetched admins:', admins);
            console.log('Looking for userId:', userId);
            
            const admin = admins.find(a => a.id === userId);
            console.log('Found admin:', admin);
            
            if (!admin) {
                console.error('Admin not found. Available IDs:', admins.map(a => a.id));
                Swal.fire({
                    icon: 'error',
                    title: 'Admin Not Found',
                    text: 'The admin user you are looking for does not exist.',
                    confirmButtonColor: '#312259'
                }).then(() => {
                    navigate('/admin/admin-users');
                });
                setLoading(false);
                return;
            }
            
            setAdminData(admin);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            console.error('Error details:', error.response?.data);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || error.message || 'Failed to load admin data',
                confirmButtonColor: '#312259'
            }).then(() => {
                navigate('/admin/admin-users');
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!isSuperAdmin()) {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Only Super Admins can change admin status.',
                confirmButtonColor: '#312259'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Change Status?',
            text: `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this admin?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#312259',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${newStatus ? 'activate' : 'deactivate'}!`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const payload = {
                value: newStatus,
                paramtoupdate: 'isActive',
                user_id: userId
            };
            await api.put('/management/admin/update/oneparam', payload);

            setAdminData(prev => ({
                ...prev,
                status: newStatus ? 'Active' : 'Inactive'
            }));

            Swal.fire({
                title: 'Status Changed!',
                text: `Admin has been ${newStatus ? 'activated' : 'deactivated'}.`,
                icon: 'success',
                timer: 2000
            });
        } catch (error) {
            console.error("Error changing status:", error);
            Swal.fire({
                title: 'Error!',
                text: error.response?.data?.detail || 'Failed to change status.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
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
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!adminData) {
        return (
            <div className="container-fluid">
                <Title 
                    title="Admin User Profile" 
                    breadcrumb={[["Admin Users Management", "/admin/admin-users"], "Admin Profile"]} 
                />
                <div className="card border rounded-4 shadow-sm mt-4">
                    <div className="card-body p-4 text-center">
                        <i className="fas fa-exclamation-triangle text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                        <h5 className="mb-3">Admin Not Found</h5>
                        <p className="text-muted mb-4">
                            The admin user you are looking for does not exist or could not be loaded.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/admin/admin-users')}
                        >
                            <i className="fas fa-arrow-left me-2"></i>
                            Back to Admin Users
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isSuperAdminUser = isSuperAdmin();

    return (
        <div className="container-fluid">
            <Title 
                title="Admin User Profile" 
                breadcrumb={[["Admin Users Management", "/admin/admin-users"], "Admin Profile"]} 
            />

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

                                {adminData.position && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaIdCard className="text-info" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Position</small>
                                            <span className="fw-medium">{adminData.position}</span>
                                        </div>
                                    </div>
                                )}

                                {adminData.department && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaBuilding className="text-success" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Department</small>
                                            <span className="fw-medium">{adminData.department}</span>
                                        </div>
                                    </div>
                                )}

                                {adminData.region && (
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                                            <FaMapMarkerAlt className="text-warning" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <small className="text-muted d-block">Region</small>
                                            <span className="fw-medium">{adminData.region}</span>
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

                {/* Right Column - Details and Permissions */}
                <div className="col-lg-8">
                    {/* Status Card */}
                    <div className="card border rounded-4 shadow-sm mb-4">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="card-title mb-0">
                                    <FaShieldAlt className="me-2 text-primary" />
                                    Account Status
                                </h5>
                                {isSuperAdminUser && (
                                    <button
                                        className={`btn btn-sm ${adminData.status === 'Active' ? 'btn-warning' : 'btn-success'}`}
                                        onClick={() => handleStatusChange(adminData.status !== 'Active')}
                                    >
                                        {adminData.status === 'Active' ? (
                                            <>
                                                <FaToggleOff className="me-1" />Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <FaToggleOn className="me-1" />Activate
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <i className={`fas ${adminData.status === 'Active' ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'}`} style={{ fontSize: '1.5rem' }}></i>
                                <span className={`badge ${adminData.status === 'Active' ? 'bg-success' : 'bg-danger'} fs-6`}>
                                    {adminData.status || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Permissions Card */}
                    {isSuperAdminUser && (
                        <div className="card border rounded-4 shadow-sm">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title mb-0">
                                        <FaShieldAlt className="me-2 text-primary" />
                                        Permissions Management
                                    </h5>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowPermissionsModal(true)}
                                    >
                                        <FaShieldAlt className="me-1" />
                                        Manage Permissions
                                    </button>
                                </div>
                                <p className="text-muted mb-0">
                                    Customize permissions for this admin user. Click "Manage Permissions" to view and edit.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Admin Details Card */}
                    <div className="card border rounded-4 shadow-sm mt-4">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-4">
                                <FaUser className="me-2 text-primary" />
                                Admin Details
                            </h5>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Full Name</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.fullName || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Email</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.email || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Position</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.position || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Department</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.department || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Region</label>
                                    <div className="form-control-plaintext fw-medium">{adminData.region || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-medium text-muted">Access Level</label>
                                    <div>
                                        <span className={`badge ${adminData.accessLevel === 'Super Admin' || adminData.accessLevel === 'super_admin' ? 'bg-danger' : 'bg-primary'} fs-6`}>
                                            {formatAccessLevel(adminData.accessLevel)}
                                        </span>
                                    </div>
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
                </div>
            </div>

            {/* Permissions Management Modal */}
            {showPermissionsModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setShowPermissionsModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <FaShieldAlt className="me-2" />
                                    Manage Permissions - {adminData.fullName}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowPermissionsModal(false)}
                                ></button>
                            </div>
                            <AdminPermissionsManager
                                userId={userId}
                                adminName={adminData.fullName}
                                onClose={() => setShowPermissionsModal(false)}
                                onUpdate={fetchAdminData}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUserProfilePage;
