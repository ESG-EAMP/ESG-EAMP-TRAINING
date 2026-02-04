import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    FiLoader
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../../utils/api';
// import './AdminUserProfile.css';

function AdminUserProfile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        _id: '',
        first_name: '',
        last_name: '',
        email: localStorage.getItem('user_email'),
        firm_name: '',
        contact_no: '',
        sector: '',
        industry: '',
        business_size: '',
        location: '',
        logo: null,
        verification: null,
        status: null,
        created_at: '',
        updated_at: ''
    });

    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ ...userData });
    const [fieldErrors, setFieldErrors] = useState({});
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [sectors, setSectors] = useState([]);
    const [isLoadingSectors, setIsLoadingSectors] = useState(false);

    const { userId } = useParams();

    // Get user data from API and localStorage
    useEffect(() => {

        const fetchUserData = async () => {
            try {
                if (!userId) {
                    // Admin must provide a userId to view a user profile
                    Swal.fire({
                        title: 'Error',
                        text: 'User ID is required to view user profile.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        navigate('/manage-users');
                    });
                    setIsLoading(false);
                    return;
                }

                // Use admin endpoint instead of user endpoint to avoid auth conflicts
                const response = await api.get(`/management/users/${userId}`);
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
                    sector: userData.sector || '',
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

                // DO NOT update localStorage with viewed user's data - this would overwrite admin session
                // localStorage.setItem('user', JSON.stringify(formattedUserData));

            } catch (error) {
                console.error('Error fetching user data:', error);

                // Show error message and redirect back to manage users
                Swal.fire({
                    title: 'Error',
                    text: error.response?.data?.detail || error.message || 'Failed to fetch user data. You may not have permission to view this user.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                }).then(() => {
                    navigate('/manage-users');
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch sectors from Info Settings
    useEffect(() => {
        const fetchSectors = async () => {
            try {
                setIsLoadingSectors(true);
                const response = await api.get('/info-settings/public/sector');
                setSectors(response.data.items || []);
            } catch (error) {
                console.error('Error fetching sectors:', error);
                setSectors([]);
            } finally {
                setIsLoadingSectors(false);
            }
        };
        fetchSectors();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleLogoUpload = async (file) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            Swal.fire({
                title: "Invalid File Type",
                text: "Please upload a JPG, JPEG, PNG, GIF, or WebP image file.",
                icon: "error",
                confirmButtonColor: "#f5576c"
            });
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            Swal.fire({
                title: "File Too Large",
                text: "File size must be less than 5MB.",
                icon: "error",
                confirmButtonColor: "#f5576c"
            });
            return;
        }

        setIsUploadingLogo(true);

        const formData = new FormData();
        formData.append('file', file);
        // Use the viewed user's ID from URL params, not admin's user_id from localStorage
        formData.append('user_id', userId || localStorage.getItem('user_id') || 'unknown');
        formData.append('folder_name', 'company_logos');

        try {
            const response = await api.post('/storage/upload-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadResult = response.data;
            setLogoUrl(uploadResult.file_url);
            setLogoFile(file);

            // Create preview for immediate display
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);

            Swal.fire({
                title: "Upload Successful!",
                text: "Company logo uploaded successfully.",
                icon: "success",
                confirmButtonColor: "#667eea"
            });

        } catch (error) {
            Swal.fire({
                title: "Upload Failed",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#f5576c"
            });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleLogoUpload(file);
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.firm_name.trim()) {
            errors.firm_name = 'Firm name is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.contact_no.trim()) {
            errors.contact_no = 'Contact number is required';
        } else if (!/^\+?[\d\s\-\(\)]{10,20}$/.test(formData.contact_no)) {
            errors.contact_no = 'Please enter a valid contact number';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePassword = () => {
        const errors = {};

        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        }

        if (!passwordData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleToggleVerification = async () => {
        if (!userId) {
            Swal.fire({
                title: 'Error',
                text: 'User ID is required.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        const currentStatus = userData.status?.is_verified || false;
        const newStatus = !currentStatus;
        const action = newStatus ? 'verify' : 'unverify';

        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${action} this account?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#17a2b8' : '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${action}!`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/management/users/${userId}/verification`, {
                is_verified: newStatus
            });

            // Update local state
            setUserData(prev => ({
                ...prev,
                status: {
                    ...prev.status,
                    is_verified: newStatus
                }
            }));

            Swal.fire({
                title: 'Success!',
                text: `Account ${action}d successfully.`,
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
        } catch (err) {
            console.error(`Error ${action}ing account:`, err);
            Swal.fire({
                title: 'Error!',
                text: err.response?.data?.detail || `Failed to ${action} account.`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleToggleBusinessVerification = async () => {
        const currentStatus = userData.status?.business_verified ?? false;
        const newStatus = !currentStatus;
        const action = newStatus ? 'Verify' : 'Unverify';

        const result = await Swal.fire({
            title: `${action} Business Verification?`,
            text: `Do you want to ${action.toLowerCase()} this user's business verification?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#28a745' : '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${action}!`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/management/users/${userId}/business-verification`, {
                is_business_verified: newStatus
            });

            setUserData(prev => ({
                ...prev,
                status: {
                    ...prev.status,
                    business_verified: newStatus
                }
            }));

            let msg = action;
            let msg2 = action;
            if (action == "Verify") {
                msg = "verified"
                msg2 = "verifying"
            } else {
                msg = "unverified"
                msg2 = "unverifying"
            }

            Swal.fire({
                title: 'Success!',
                text: `Business verification ${msg} successfully.`,
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
        } catch (err) {
            console.error(`Error ${msg2}ing business verification:`, err);
            Swal.fire({
                title: 'Error!',
                text: err.response?.data?.detail || `Failed to ${msg2} business verification.`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                console.log('Saving profile data:', formData);

                // Prepare data for API update
                const updateData = { ...formData };
                delete updateData.verification;
                delete updateData.status;
                delete updateData.created_at;
                delete updateData.updated_at;

                // Include logo URL if it was uploaded
                if (logoUrl) {
                    updateData.logo = logoUrl;
                }

                console.log('Update Data:', updateData);

                // Update via API
                const response = await api.put('/auth/user/user/update', updateData);
                const updatedData = response.data;
                console.log('Profile updated via API:', updatedData);

                // Update local state with the response data
                const formattedData = {
                    ...updateData,
                    verification: userData.verification,
                    status: userData.status,
                    created_at: userData.created_at,
                    updated_at: userData.updated_at
                };

                setUserData(formattedData);
                setFormData(formattedData);

                setEditMode(false);
                setLogoPreview(null);

                // DO NOT update localStorage - this is admin viewing another user's profile
                // localStorage.setItem('user', JSON.stringify(formData));

                // Show success message
                Swal.fire({
                    title: 'Profile updated successfully!',
                    icon: 'success',
                    confirmButtonColor: '#667eea'
                });
            } catch (error) {
                console.error('Error updating profile:', error);
                Swal.fire({
                    title: 'Failed to update profile. Please try again.',
                    text: error.message,
                    icon: 'error',
                    confirmButtonColor: '#f5576c'
                });
            }
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (validatePassword()) {
            setIsUpdatingPassword(true);
            try {
                const res = await api.put('/auth/user/changepassword', {
                    email: userData.email,
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

                Swal.fire({
                    title: 'Password updated successfully!',
                    icon: 'success'
                });
            } catch (error) {
                console.error('Error updating password:', error);
                Swal.fire({
                    title: 'Failed to update password!',
                    text: error.message,
                    icon: 'error'
                });
            } finally {
                setIsUpdatingPassword(false);
            }
        }
    };

    const handleCancel = () => {
        setFormData(userData);
        setFieldErrors({});
        setEditMode(false);
        setLogoPreview(null);
        setLogoFile(null);
        // Reset logo URL to original if no new upload was successful
        if (!logoFile) {
            setLogoUrl(userData.logo || '');
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
        <div className="container-fluid ">
            <Title title="User's Profile" breadcrumb={[["Dashboard", "/dashboard"], "My Profile"]} />

            <div className="row">
                <div className="col-12">
                    {/* Profile Header Card */}
                    <div className="mb-4">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="text-end">
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
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                Cancel
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleSave}
                                            >
                                                <i className="fas fa-save me-1"></i>
                                                Save Changes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Profile Content */}
                    <div className="row">
                        {/* Left Column - Logo and Basic Info */}
                        <div className="col-lg-4">
                            <div className="border rounded-4 shadow h-100 profile-card">
                                <div className="card-body p-4">
                                    <div className="text-center mb-4">
                                        <div className="position-relative d-inline-block profile-avatar">
                                            <img
                                                src={logoPreview || (logoUrl ? `${API_BASE}${logoUrl}` : '/assetsv2/image-square-default.svg')}
                                                alt="Company Logo"
                                                className="rounded-4 -circle shadow-sm"
                                                style={{
                                                    width: '120px',
                                                    height: '120px',
                                                    objectFit: 'cover',
                                                    border: '4px solid #fff'
                                                }}
                                            />
                                            {editMode && (
                                                <div className="position-absolute bottom-0 end-0">
                                                    <label className={`btn btn-sm ${isUploadingLogo ? 'btn-outline-secondary' : 'btn-primary'} avatar-upload-btn`} >
                                                        {isUploadingLogo ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                <i className="fas fa-upload text-white" style={{ fontSize: '12px' }}></i>
                                                            </>
                                                        ) : (
                                                            <i className="fas fa-camera text-white" style={{ fontSize: '12px' }}></i>
                                                        )}
                                                        <input
                                                            type="file"
                                                            className="d-none"
                                                            accept="image/*"
                                                            onChange={handleLogoChange}
                                                            disabled={isUploadingLogo}
                                                        />
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3">
                                            {editMode ? (
                                                <input
                                                    type="text"
                                                    className="form-control text-center fw-bold"
                                                    name="firm_name"
                                                    value={formData.firm_name}
                                                    onChange={handleInputChange}
                                                    style={{ fontSize: '1.5rem' }}
                                                />
                                            ) : (
                                                <h3 className="fw-bold text-dark mb-1">{userData.firm_name}</h3>
                                            )}
                                            <p className="text-muted ">
                                                <i className="fas fa-building me-1"></i>
                                                {userData.business_size} Business
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-top pt-3">
                                        <div className="d-flex align-items-center mb-3 info-item">
                                            <div className="bg-primary bg-opacity-10 rounded-4 -circle p-2 me-3 info-icon">
                                                <i className="fas fa-envelope text-primary"></i>
                                            </div>
                                            <div className="flex-grow-1">
                                                <small className="text-muted d-block">Email</small>
                                                {editMode ? (
                                                    <>
                                                        <input
                                                            type="email"
                                                            className={`form-control form-control-sm ${fieldErrors.email ? 'is-invalid' : ''}`}
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter email address"
                                                        />
                                                        {fieldErrors.email && (
                                                            <div className="invalid-feedback">{fieldErrors.email}</div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="fw-medium">{userData.email}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center mb-3 info-item">
                                            <div className="bg-success bg-opacity-10 rounded-4 -circle p-2 me-3 info-icon">
                                                <i className="fas fa-phone text-success"></i>
                                            </div>
                                            <div>
                                                <small className="text-muted d-block">Contact</small>
                                                <span className="fw-medium">{userData.contact_no}</span>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center info-item">
                                            <div className="bg-info bg-opacity-10 rounded-4 -circle p-2 me-3 info-icon">
                                                <i className="fas fa-map-marker-alt text-info"></i>
                                            </div>
                                            <div>
                                                <small className="text-muted d-block">Location</small>
                                                <span className="fw-medium">{userData.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Detailed Information */}
                        <div className="col-lg-8 border rounded-4 shadow profile-card">
                            <div className="card-body p-4">
                                <h5 className="card-title mb-4 section-title">
                                    <i className="fas fa-info-circle me-1 text-primary"></i>
                                    Business Details
                                </h5>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Contact Number</label>
                                        {editMode ? (
                                            <>
                                                <input
                                                    type="tel"
                                                    className={`form-control ${fieldErrors.contact_no ? 'is-invalid' : ''}`}
                                                    name="contact_no"
                                                    value={formData.contact_no}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter contact number"
                                                />
                                                {fieldErrors.contact_no && (
                                                    <div className="invalid-feedback">{fieldErrors.contact_no}</div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="form-control-plaintext fw-medium">{userData.contact_no}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Business Size</label>
                                        {editMode ? (
                                            <select
                                                className="form-select"
                                                name="business_size"
                                                value={formData.business_size}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Microenterprises">Microenterprises</option>
                                                <option value="Small">Small</option>
                                                <option value="Medium">Medium</option>
                                            </select>
                                        ) : (
                                            <div className="form-control-plaintext fw-medium">{userData.business_size}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Sector</label>
                                        {editMode ? (
                                            <select
                                                className="form-select"
                                                name="sector"
                                                value={formData.sector}
                                                onChange={handleInputChange}
                                                disabled={isLoadingSectors}
                                            >
                                                <option value="">{isLoadingSectors ? 'Loading sectors...' : 'Select Sector'}</option>
                                                {sectors.map((sector, index) => (
                                                    <option key={index} value={sector.value}>
                                                        {sector.label || sector.value}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="form-control-plaintext fw-medium">{userData.sector || '—'}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Industry</label>
                                        {editMode ? (
                                            <select
                                                className="form-select"
                                                name="industry"
                                                value={formData.industry}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Services: Wholesale & retail including motor vehicles">Services: Wholesale & retail including motor vehicles</option>
                                                <option value="Services: Food & beverages (F&B)">Services: Food & beverages (F&B)</option>
                                                <option value="Services: Transportation & storage">Services: Transportation & storage</option>
                                                <option value="Services: Accommodations">Services: Accommodations</option>
                                                <option value="Services: Information & communication (publishing / broadcasting / telco / etc.)">Services: Information & communication (publishing / broadcasting / telco / etc.)</option>
                                                <option value="Services: Professionals / scientific / technical">Services: Professionals / scientific / technical</option>
                                                <option value="Services: Private education">Services: Private education</option>
                                                <option value="Services: Private healthcare and social work">Services: Private healthcare and social work</option>
                                                <option value="Services: Finance & insurance and real estates">Services: Finance & insurance and real estates</option>
                                                <option value="Services: Art / entertainment / recreational activities">Services: Art / entertainment / recreational activities</option>
                                                <option value="Services: Sewerage & waste management and supply of electricity / gas / water">Services: Sewerage & waste management and supply of electricity / gas / water</option>
                                                <option value="Services: Administrative & support services (rental / security / building maintenance / office management / etc.)">Services: Administrative & support services (rental / security / building maintenance / office management / etc.)</option>
                                                <option value="Services: Other services (salon / laundry / spa / barbers / etc.)">Services: Other services (salon / laundry / spa / barbers / etc.)</option>
                                                <option value="Manufacturing: Food & beverages (F&B) and tobacco">Manufacturing: Food & beverages (F&B) and tobacco</option>
                                                <option value="Manufacturing: Electric & electronic products (E&E)">Manufacturing: Electric & electronic products (E&E)</option>
                                                <option value="Manufacturing: Plastic products">Manufacturing: Plastic products</option>
                                                <option value="Manufacturing: Rubber & leather products">Manufacturing: Rubber & leather products</option>
                                                <option value="Manufacturing: Chemical / pharmaceuticals / medicinal / coke & refined petroleum products">Manufacturing: Chemical / pharmaceuticals / medicinal / coke & refined petroleum products</option>
                                                <option value="Manufacturing: Textile & apparels">Manufacturing: Textile & apparels</option>
                                                <option value="Manufacturing: Wood & paper products">Manufacturing: Wood & paper products</option>
                                                <option value="Manufacturing: Metal & metal products">Manufacturing: Metal & metal products</option>
                                                <option value="Manufacturing: Non-metallic mineral products (clay / glass / etc.)">Manufacturing: Non-metallic mineral products (clay / glass / etc.)</option>
                                                <option value="Manufacturing: Transport equipment / machinery & engineering (M&E) equipment & parts">Manufacturing: Transport equipment / machinery & engineering (M&E) equipment & parts</option>
                                                <option value="Manufacturing: Furniture">Manufacturing: Furniture</option>
                                                <option value="Manufacturing: Printing & reproduction of recorded media">Manufacturing: Printing & reproduction of recorded media</option>
                                                <option value="Manufacturing: Other manufacturing (toys / sporting goods / printed matter / antiques / etc.)">Manufacturing: Other manufacturing (toys / sporting goods / printed matter / antiques / etc.)</option>
                                                <option value="Agriculture: Production of agricultural crops">Agriculture: Production of agricultural crops</option>
                                                <option value="Agriculture: Fishing / livestock / aquaculture activities">Agriculture: Fishing / livestock / aquaculture activities</option>
                                                <option value="Agriculture: Forestry & logging">Agriculture: Forestry & logging</option>
                                                <option value="Construction">Construction</option>
                                                <option value="Mining & Quarrying">Mining & Quarrying</option>
                                            </select>
                                        ) : (
                                            <div className="form-control-plaintext fw-medium">{userData.industry}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">Location</label>
                                        {editMode ? (
                                            <select
                                                className="form-select"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Johor">Johor</option>
                                                <option value="Kedah">Kedah</option>
                                                <option value="Kelantan">Kelantan</option>
                                                <option value="Melaka">Melaka</option>
                                                <option value="Negeri Sembilan">Negeri Sembilan</option>
                                                <option value="Pahang">Pahang</option>
                                                <option value="Perak">Perak</option>
                                                <option value="Perlis">Perlis</option>
                                                <option value="Pulau Pinang">Pulau Pinang</option>
                                                <option value="Sabah">Sabah</option>
                                                <option value="Sarawak">Sarawak</option>
                                                <option value="Selangor">Selangor</option>
                                                <option value="Terengganu">Terengganu</option>
                                                <option value="WP Kuala Lumpur">WP Kuala Lumpur</option>
                                                <option value="WP Putrajaya">WP Putrajaya</option>
                                                <option value="WP Labuan">WP Labuan</option>
                                            </select>
                                        ) : (
                                            <div className="form-control-plaintext fw-medium">{userData.location}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="col-12">

                            {/* Email Verification Status Card */}
                            <div className="border rounded-4 shadow mt-4 profile-card col-12">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="card-title  section-title">
                                            <i className="fas fa-envelope-circle-check me-1 text-primary"></i>
                                            Email Verification Status
                                        </h5>
                                        {!userData.status?.is_verified && (
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={handleToggleVerification}
                                            >
                                                <i className="fas fa-check-circle me-1"></i>
                                                Verify Email
                                            </button>
                                        )}
                                        {userData.status?.is_verified && (
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={handleToggleVerification}
                                            >
                                                <i className="fas fa-times-circle me-1"></i>
                                                Unverify Email
                                            </button>
                                        )}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-medium text-muted">Email Verification Status</label>
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`fas ${userData.status?.is_verified ? 'fa-envelope-circle-check text-success' : 'fa-envelope text-warning'}`}></i>
                                                <span className={`badge ${userData.status?.is_verified ? 'bg-success' : 'bg-warning'} fs-6`}>
                                                    {userData.status?.is_verified ? 'Email Verified' : 'Email Unverified'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-medium text-muted">Account Status</label>
                                            <div className="d-flex align-items-center">
                                                <span className={`badge ${userData.status?.is_active ? 'bg-success' : 'bg-danger'} fs-6 me-1`}>
                                                    <i className={`fas ${userData.status?.is_active ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                                                    {userData.status?.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Verification Status Card */}
                            {userData.verification && (userData.verification.sme_corp?.number || userData.verification.ssm?.registration_number || userData.verification.business || Object.keys(userData.verification).length > 0) ? (
                                <div className="border rounded-4 shadow mt-4 profile-card col-12">
                                    <div className="card-body p-4">
                                        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                                            <h5 className="card-title section-title mb-0">
                                                <i className="fas fa-shield-alt me-1 text-success"></i>
                                                Business Verification Status
                                            </h5>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={`badge ${userData.status?.business_verified ? 'bg-success' : 'bg-warning'} fs-6`}>
                                                    <i className={`fas ${userData.status?.business_verified ? 'fa-shield-check' : 'fa-shield'} me-1`}></i>
                                                    {userData.status?.business_verified ? 'Verified' : 'Submitted'}
                                                </span>
                                                {!userData.status?.business_verified ? (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={handleToggleBusinessVerification}
                                                    >
                                                        <i className="fas fa-check-circle me-1"></i>
                                                        Verify Business
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-warning btn-sm"
                                                        onClick={handleToggleBusinessVerification}
                                                    >
                                                        <i className="fas fa-times-circle me-1"></i>
                                                        Unverify Business
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <label className="form-label fw-medium text-muted">Business verification status</label>
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <span className={`badge ${userData.status?.business_verified ? 'bg-success' : 'bg-warning'} fs-6`}>
                                                    {userData.status?.business_verified ? 'Verified' : 'Submitted'}
                                                </span>
                                                <span className="text-muted small">
                                                    {userData.status?.business_verified
                                                        ? 'Approved by admin. User\'s business is verified.'
                                                        : 'Pending your review. Review details below and click Verify Business to approve.'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* SME Corp Number Review Alert - Prominent for Admin */}
                                        {userData.verification?.sme_corp?.number && !userData.status?.is_verified && (
                                            <div className="alert alert-warning border-warning mb-4">
                                                <div className="d-flex align-items-start">
                                                    <div className="me-3">
                                                        <i className="fas fa-exclamation-triangle fa-2x text-warning"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h6 className="alert-heading fw-bold mb-2">
                                                            <i className="fas fa-id-card me-1"></i>
                                                            SME Corp Number Verification Required
                                                        </h6>
                                                        <p className="mb-2">
                                                            Please verify the following SME Corp number before approving this account:
                                                        </p>
                                                        <div className="bg-light p-3 rounded mb-3">
                                                            <div className="d-flex align-items-center justify-content-between">
                                                                <div>
                                                                    <label className="form-label fw-semibold text-muted mb-1">SME Corp Number:</label>
                                                                    <div className="fs-5 fw-bold text-primary">
                                                                        {userData.verification.sme_corp.number}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <small className="text-muted">
                                                            <i className="fas fa-info-circle me-1"></i>
                                                            After verifying the SME Corp number, click "Verify Email" above to approve this user's email verification.
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-medium text-muted">Business Verification Method</label>
                                                <div className="d-flex align-items-center flex-wrap gap-2">
                                                    {userData.verification?.sme_corp?.number && (
                                                        <span className="badge bg-info fs-6">
                                                            <i className="fas fa-id-card me-1"></i>
                                                            Verified via SME Corp Number
                                                        </span>
                                                    )}
                                                    {userData.verification?.ssm?.registration_number && (
                                                        <span className="badge bg-success fs-6">
                                                            <i className="fas fa-file-contract me-1"></i>
                                                            Verified via Business Registration
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-medium text-muted">Account Status</label>
                                                <div className="d-flex align-items-center">
                                                    <span className={`badge ${userData.status?.is_active ? 'bg-success' : 'bg-danger'} fs-6 me-1`}>
                                                        <i className={`fas ${userData.status?.is_active ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                                                        {userData.status?.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>

                                            {userData.verification.business && (
                                                <>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Business Type</label>
                                                        <div className="form-control-plaintext fw-medium text-capitalize">
                                                            {userData.verification.business.type?.replace('_', ' ')}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Business Premises</label>
                                                        <div className="form-control-plaintext fw-medium text-capitalize">
                                                            {userData.verification.business.premises?.replace('_', ' ')}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Employee Count</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            {userData.verification.business.employee_count} employees
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Annual Revenue</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            RM {userData.verification.business.annual_revenue?.toLocaleString()}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Bumiputera Status</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            <span className={`badge ${userData.verification.business.bumiputera_status ? 'bg-primary' : 'bg-secondary'}`}>
                                                                {userData.verification.business.bumiputera_status ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="col-12 mb-3">
                                                        <label className="form-label fw-medium text-muted">Business Address</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            {userData.verification.business.address}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {userData.verification.ssm && (
                                                <>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Verification Method</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            <span className="badge bg-success me-1">
                                                                <i className="fas fa-file-contract me-1"></i>
                                                                Business Registration
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">SSM Registration Number</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            {userData.verification.ssm.registration_number}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Registration Date</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            {new Date(userData.verification.ssm.registration_date).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">SSM Certificate</label>
                                                        <div className="form-control-plaintext">
                                                            {userData.verification.ssm.certificate_file ? (
                                                                <a
                                                                    href={`${import.meta.env.VITE_APP_API}${userData.verification.ssm.certificate_file}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="btn btn-outline-primary btn-sm"
                                                                >
                                                                    <i className="fas fa-eye me-1"></i>
                                                                    View Certificate
                                                                </a>
                                                            ) : (
                                                                <span className="text-muted">No certificate uploaded</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border rounded-4 shadow mt-4 profile-card col-12">
                                    <div className="card-body p-4">
                                        <div className="text-center">
                                            <div className="mb-4">
                                                <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
                                            </div>
                                            <h5 className="card-title mb-3 text-warning">
                                                <i className="fas fa-shield-alt me-1"></i>
                                                Business Verification — Not submitted
                                            </h5>
                                            <p className="text-muted mb-4">
                                                This user has not submitted business verification yet. They can complete it from their profile.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}

export default AdminUserProfile;