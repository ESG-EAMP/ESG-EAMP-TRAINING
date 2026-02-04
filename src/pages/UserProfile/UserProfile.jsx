import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import { Link } from 'react-router-dom';
import {
    FiLoader
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api, { API_BASE } from '../../utils/api';
// import './UserProfile.css';

function UserProfile() {
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
    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });
    const [sectors, setSectors] = useState([]);
    const [isLoadingSectors, setIsLoadingSectors] = useState(false);
    const [industries, setIndustries] = useState([]);
    const [businessSizes, setBusinessSizes] = useState([]);
    const [malaysianStates, setMalaysianStates] = useState([]);
    const [isLoadingInfoSettings, setIsLoadingInfoSettings] = useState(true);
    const [isLoadingStates, setIsLoadingStates] = useState(true);

    // Get user data from API and localStorage
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = localStorage.getItem('user_id');

                if (!userId) {
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
                            sector: user.sector || '',
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
                    setIsLoading(false);
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
                        sector: user.sector || '',
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
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch Info Settings (sectors, industries, business sizes)
    useEffect(() => {
        const fetchInfoSettings = async () => {
            try {
                setIsLoadingInfoSettings(true);
                const [sectorsRes, industriesRes, businessSizesRes] = await Promise.all([
                    api.get('/info-settings/public/sector'),
                    api.get('/info-settings/public/industry'),
                    api.get('/info-settings/public/business_size')
                ]);
                
                setSectors(sectorsRes.data.items || []);
                setIndustries(industriesRes.data.items || []);
                setBusinessSizes(businessSizesRes.data.items || []);
            } catch (error) {
                console.error('Error fetching info settings:', error);
                setSectors([]);
                setIndustries([]);
                setBusinessSizes([]);
            } finally {
                setIsLoadingInfoSettings(false);
                setIsLoadingSectors(false);
            }
        };
        fetchInfoSettings();
    }, []);

    // Fetch Malaysian states
    useEffect(() => {
        const fetchMalaysianStates = async () => {
            try {
                setIsLoadingStates(true);
                const response = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ country: "Malaysia" })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch states');
                }
                
                const data = await response.json();
                if (data.data && data.data.states) {
                    setMalaysianStates(data.data.states);
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Error fetching Malaysian states:', error);
                // Fallback to hardcoded states if API fails
                setMalaysianStates([
                    { name: "Johor" },
                    { name: "Kedah" },
                    { name: "Kelantan" },
                    { name: "Melaka" },
                    { name: "Negeri Sembilan" },
                    { name: "Penang" },
                    { name: "Pahang" },
                    { name: "Perak" },
                    { name: "Perlis" },
                    { name: "Sabah" },
                    { name: "Sarawak" },
                    { name: "Selangor" },
                    { name: "Terengganu" },
                    { name: "Kuala Lumpur" },
                    { name: "Labuan" },
                    { name: "Putrajaya" }
                ]);
            } finally {
                setIsLoadingStates(false);
            }
        };

        fetchMalaysianStates();
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
        formData.append('user_id', localStorage.getItem('user_id') || 'unknown');
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

        if (!formData.contact_no.trim()) {
            errors.contact_no = 'Contact number is required';
        } else if (!/^\+?[\d\s\-()]{10,20}$/.test(formData.contact_no)) {
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

    const handleSave = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                console.log('Saving profile data:', formData);

                const userId = localStorage.getItem('user_id');
                
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
                
                if (userId) {
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
                } else {
                    // Fallback to local state update
                    setUserData(formData);
                }

                setEditMode(false);
                setLogoPreview(null);

                // Update localStorage with fresh data
                localStorage.setItem('user', JSON.stringify(formData));

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
                    setShowPasswords({
                        currentPassword: false,
                        newPassword: false,
                        confirmPassword: false
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
            <Title title="My Profile" breadcrumb={[["Dashboard", "/dashboard"], "My Profile"]} />

            <div className="row">
                <div className="col-12">
                    {/* Profile Header Card */}
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
                                                    border: '4px solid #fff',
                                                    opacity: isUploadingLogo ? 0.5 : 1,
                                                    transition: 'opacity 0.3s ease'
                                                }}
                                            />
                                            {isUploadingLogo && (
                                                <div className="position-absolute top-50 start-50 translate-middle">
                                                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                                                        <span className="visually-hidden">Uploading...</span>
                                                    </div>
                                                </div>
                                            )}
                                            {editMode && !isUploadingLogo && (
                                                <div className="position-absolute bottom-0 end-0">
                                                    <label className="btn btn-sm btn-primary avatar-upload-btn">
                                                        <i className="fas fa-camera text-white" style={{ fontSize: '12px' }}></i>
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
                                                    className="form-control text-center fw-bold border-0 bg-transparent"
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
                                            <div>
                                                <small className="text-muted d-block">Email</small>
                                                <span className="fw-medium">{userData.email}</span>
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
                        <div className="col-lg-8">
                            <div className="border rounded-4 shadow profile-card">
                                <div className="card-body p-4">
                                    <h5 className="card-title mb-4 section-title">
                                        <i className="fas fa-info-circle me-1 text-primary"></i>
                                        Business Details
                                    </h5>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-medium text-muted">Firm Name</label>
                                            {editMode ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${fieldErrors.firm_name ? 'is-invalid' : ''}`}
                                                        name="firm_name"
                                                        value={formData.firm_name}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter firm name"
                                                    />
                                                    {fieldErrors.firm_name && (
                                                        <div className="invalid-feedback">{fieldErrors.firm_name}</div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="form-control-plaintext fw-medium">{userData.firm_name}</div>
                                            )}
                                        </div>

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
                                                    disabled={isLoadingInfoSettings}
                                                >
                                                    <option value="">
                                                        {isLoadingInfoSettings ? 'Loading business sizes...' : 'Select Business Size'}
                                                    </option>
                                                    {businessSizes.map((size, index) => (
                                                        <option key={index} value={size.value}>
                                                            {size.label || size.value}
                                                        </option>
                                                    ))}
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
                                                    disabled={isLoadingInfoSettings}
                                                >
                                                    <option value="">
                                                        {isLoadingInfoSettings ? 'Loading industries...' : 'Select Industry'}
                                                    </option>
                                                    {industries.map((industry, index) => (
                                                        <option key={index} value={industry.value}>
                                                            {industry.label || industry.value}
                                                        </option>
                                                    ))}
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
                                                    disabled={isLoadingStates}
                                                >
                                                    <option value="">
                                                        {isLoadingStates ? 'Loading states...' : 'Select Location'}
                                                    </option>
                                                    {malaysianStates.map((state, index) => (
                                                        <option key={index} value={state.name}>
                                                            {state.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="form-control-plaintext fw-medium">{userData.location}</div>
                                            )}
                                        </div>
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

                        <div className="col-12">
                            
                            {/* Email Verification Status Card */}
                            <div className="border rounded-4 shadow mt-4 profile-card col-12">
                                <div className="card-body p-4">
                                    <h5 className="card-title mb-4 section-title">
                                        <i className="fas fa-envelope-circle-check me-1 text-primary"></i>
                                        Email Verification Status
                                    </h5>

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
                                        <h5 className="card-title mb-4 section-title">
                                            <i className="fas fa-shield-alt me-1 text-success"></i>
                                            Business Verification Status
                                        </h5>

                                        <div className="row">
                                            <div className="col-12 mb-3">
                                                <label className="form-label fw-medium text-muted">Business verification status</label>
                                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                                    <i className={`fas ${userData.status?.business_verified ? 'fa-shield-check text-success' : 'fa-shield text-warning'}`}></i>
                                                    <span className={`badge ${userData.status?.business_verified ? 'bg-success' : 'bg-warning'} fs-6`}>
                                                        {userData.status?.business_verified ? 'Verified' : 'Submitted'}
                                                    </span>
                                                    <span className="text-muted small">
                                                        {userData.status?.business_verified
                                                            ? 'Your business has been verified by admin.'
                                                            : 'Your submission is pending admin review.'}
                                                    </span>
                                                </div>
                                            </div>
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

                                            {userData.verification.sme_corp && userData.verification.sme_corp.number && (
                                                <>
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">Verification Method</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            <span className="badge bg-info me-1">
                                                                <i className="fas fa-id-card me-1"></i>
                                                                SME Corp Number
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-medium text-muted">SME Corp Number</label>
                                                        <div className="form-control-plaintext fw-medium">
                                                            {userData.verification.sme_corp.number}
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
                                                Complete your business verification to comply with platform requirements and ensure accurate data collection. 
                                                This process helps us verify your MSME status for platform compliance.
                                            </p>
                                            
                                            <div className="alert alert-warning mb-4">
                                                <div className="d-flex align-items-center">
                                                    <i className="fas fa-info-circle me-1"></i>
                                                    <div>
                                                        <strong>Why verification is required:</strong>
                                                        <ul className=" mt-2 text-start">
                                                            <li>Compliance with platform policies</li>
                                                            <li>Accurate business data collection</li>
                                                            <li>MSME status validation</li>
                                                            <li>Platform access requirements</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Link to="/profile/verification" className="btn btn-warning">
                                                <i className="fas fa-shield-alt me-1"></i>
                                                Complete Business Verification
                                            </Link>
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

export default UserProfile;