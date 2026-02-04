import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    FiMail,
    FiUser,
    FiHome,
    FiMapPin,
    FiCheckCircle,
    FiArrowRight,
    FiArrowLeft,
    FiLoader
} from 'react-icons/fi';
import AnimatedBackground from '../../../components/AnimatedBackground/AnimatedBackground';
function Register() {
    const [currentStep, setCurrentStep] = useState(1);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [malaysianStates, setMalaysianStates] = useState([]);
    const [isLoadingStates, setIsLoadingStates] = useState(true);
    const [termsContent, setTermsContent] = useState('');
    const [isLoadingTerms, setIsLoadingTerms] = useState(true);
    const [sectors, setSectors] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [businessSizes, setBusinessSizes] = useState([]);
    const [isLoadingInfoSettings, setIsLoadingInfoSettings] = useState(true);
    const [formData, setFormData] = useState({
        // Account Info
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Business Info
        firmName: '',
        contactNo: '',
        sector: '',
        industry: '',
        businessSize: '',
        location: '',
    });

    // Fetch Registration Terms & Conditions on component mount
    useEffect(() => {
        const fetchTermsAndConditions = async () => {
            try {
                setIsLoadingTerms(true);
                const response = await fetch(`${import.meta.env.VITE_APP_API}/static-pages/registration_tc`);
                if (response.ok) {
                    const data = await response.json();
                    setTermsContent(data.content || '');
                } else {
                    // If no T&C found, use empty string
                    setTermsContent('');
                }
            } catch (error) {
                console.error('Error fetching terms and conditions:', error);
                setTermsContent('');
            } finally {
                setIsLoadingTerms(false);
            }
        };

        fetchTermsAndConditions();
    }, []);

    // Fetch Info Settings (sectors, industries, business sizes)
    useEffect(() => {
        const fetchInfoSettings = async () => {
            try {
                setIsLoadingInfoSettings(true);
                const [sectorsRes, industriesRes, businessSizesRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_APP_API}/info-settings/public/sector`),
                    fetch(`${import.meta.env.VITE_APP_API}/info-settings/public/industry`),
                    fetch(`${import.meta.env.VITE_APP_API}/info-settings/public/business_size`)
                ]);
                
                const sectorsData = await sectorsRes.json();
                const industriesData = await industriesRes.json();
                const businessSizesData = await businessSizesRes.json();
                
                setSectors(sectorsData.items || []);
                setIndustries(industriesData.items || []);
                setBusinessSizes(businessSizesData.items || []);
            } catch (error) {
                console.error('Error fetching info settings:', error);
                // Set empty arrays on error
                setSectors([]);
                setIndustries([]);
                setBusinessSizes([]);
            } finally {
                setIsLoadingInfoSettings(false);
            }
        };
        
        fetchInfoSettings();
    }, []);

    // Fetch Malaysian states on component mount
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
                    { name: "Pahang" },
                    { name: "Penang" },
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

    // Password validation helper
    const validatePassword = (password) => {
        if (!password || password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (password.length > 72) {
            return 'Password must be less than 72 characters';
        }
        return '';
    };
    const validateField = (name, value) => {
        if (!value || value.trim() === '') {
            setFieldErrors(prev => ({
                ...prev,
                [name]: 'This is a required field'
            }));
            return false;
        }
        
        // Special validation for password
        if (name === 'password') {
            const passwordError = validatePassword(value);
            if (passwordError) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: passwordError
                }));
                return false;
            }
        }
        
        // Special validation for confirm password
        if (name === 'confirmPassword') {
            if (value !== formData.password) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Passwords do not match'
                }));
                return false;
            }
        }
        
        setFieldErrors(prev => ({
            ...prev,
            [name]: ''
        }));
        return true;
    };
    const isStepComplete = (step) => {
        switch (step) {
            case 1:
                return formData.first_name.trim() !== '' &&
                    formData.last_name.trim() !== '' &&
                    formData.email.trim() !== '' &&
                    formData.password.trim() !== '' &&
                    formData.confirmPassword.trim() !== '' &&
                    formData.password === formData.confirmPassword &&
                    formData.password.length >= 8;
            case 2:
                return formData.firmName.trim() !== '' &&
                    formData.contactNo.trim() !== '' &&
                    formData.sector.trim() !== '' &&
                    formData.industry.trim() !== '' &&
                    formData.businessSize.trim() !== '' &&
                    formData.location.trim() !== '';
            case 3:
                return hasScrolledToBottom;
            default:
                return false;
        }
    };
    const validateStep = (step) => {
        const errors = {};
        switch (step) {
            case 1:
                if (!formData.first_name || formData.first_name.trim() === '') errors.first_name = 'This is a required field';
                if (!formData.last_name || formData.last_name.trim() === '') errors.last_name = 'This is a required field';
                if (!formData.email || formData.email.trim() === '') errors.email = 'This is a required field';
                if (!formData.password || formData.password.trim() === '') {
                    errors.password = 'This is a required field';
                } else {
                    const passwordError = validatePassword(formData.password);
                    if (passwordError) errors.password = passwordError;
                }
                if (!formData.confirmPassword || formData.confirmPassword.trim() === '') {
                    errors.confirmPassword = 'This is a required field';
                } else if (formData.password !== formData.confirmPassword) {
                    errors.confirmPassword = 'Passwords do not match';
                }
                break;
            case 2:
                if (!formData.firmName || formData.firmName.trim() === '') errors.firmName = 'This is a required field';
                if (!formData.contactNo || formData.contactNo.trim() === '') errors.contactNo = 'This is a required field';
                if (!formData.sector || formData.sector.trim() === '') errors.sector = 'This is a required field';
                if (!formData.industry || formData.industry.trim() === '') errors.industry = 'This is a required field';
                if (!formData.businessSize || formData.businessSize.trim() === '') errors.businessSize = 'This is a required field';
                if (!formData.location || formData.location.trim() === '') errors.location = 'This is a required field';
                break;
            case 3:
                if (!hasScrolledToBottom) errors.terms = 'Please read the terms and conditions';
                break;
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        validateField(name, value);
    };
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 10) {
            setHasScrolledToBottom(true);
        }
    };
    const nextStep = () => {
        const isValid = validateStep(currentStep);
        if (currentStep < 3 && isValid) {
            setCurrentStep(prev => prev + 1);
        } else if (!isValid) {  
            Swal.fire({
                title: 'Required Fields Missing',
                text: 'Please fill in all required fields before proceeding.',
                icon: 'warning',
                confirmButtonColor: '#312259'
            });
        }
    };
    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };
    const handleTabClick = (step) => {
        setCurrentStep(step);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validate all steps before submission
        for (let step = 1; step <= 3; step++) {
            if (!validateStep(step)) {
                setCurrentStep(step);
                Swal.fire({
                    title: 'Required Fields Missing',
                    text: 'Please complete all required fields in all steps before submitting.',
                    icon: 'warning',
                    confirmButtonColor: '#312259'
                });
                return;
            }
        }
        // If all validations pass, proceed with submission
        setIsSubmitting(true);
        
        const submissionData = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            password: formData.password,
            firm_name: formData.firmName,
            contact_no: formData.contactNo,
            sector: formData.sector,
            industry: formData.industry,
            business_size: formData.businessSize,
            location: formData.location
        };
        fetch(`${import.meta.env.VITE_APP_API}/auth/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errorBody = await res.text();
                    let errorMessage = "Registration failed";
                    try {
                        const parsed = JSON.parse(errorBody);
                        errorMessage = parsed.detail || errorMessage;
                    } catch (e) {
                        console.warn("Could not parse backend error response:", errorBody);
                    }
                    throw new Error(errorMessage);
                }
                return res.json();
            })
            .then(() => {
                Swal.fire({
                    title: 'Registration Successful!',
                    html: 'You have been successfully registered. Please check your email to verify your account before logging in.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.location.href = '/login';
                });
            })
            .catch(error => {
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error'
                });
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };
    const steps = [
        { id: 1, title: 'Account', icon: FiUser, description: 'Create your account' },
        { id: 2, title: 'Business', icon: FiHome, description: 'Business information' },
        { id: 3, title: 'Finish', icon: FiCheckCircle, description: 'Terms & submit' }
    ];
    return (
        <div className="auth-fluid" style={{
            backgroundColor: '#4E368C',
            // backgroundImage: 'url("https://thumbs.dreamstime.com/b/cubes-dice-blocks-acronym-esg-environment-social-governance-green-grass-236878056.jpg")',
            // backgroundSize: 'cover',
            // backgroundPosition: 'center',
            // backgroundRepeat: 'no-repeat',
            // minHeight: '100vh'
        }}>
            {/*Auth fluid left content */}
            <div className="auth-fluid-form-box p-0 pb-3" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="border-0" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header text-white text-center py-4 d-none" style={{ background: 'linear-gradient(135deg, #312259 0%, #4a4a8a 100%)' }}>
                        <h2 className="mb-2 fw-bold">
                            <FiHome className="me-1" />
                            MSME Registration
                        </h2>
                        <p className=" opacity-75">Join our PKSLestari Platform</p>
                    </div>
                    <div className="p-4" style={{ flex: 1 }}>
                        {/* Progress Steps */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="d-flex flex-column align-items-center position-relative">
                                        <div
                                            className={`d-flex align-items-center justify-content-center rounded-circle mb-2 ${currentStep >= step.id
                                                ? 'bg-primary text-white'
                                                : 'bg-light text-muted'
                                                }`}
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onClick={() => handleTabClick(step.id)}
                                        >
                                            <step.icon size={20} />
                                        </div>
                                        <div className="text-center">
                                            <div className={`fw-semibold ${currentStep >= step.id ? 'text-primary' : 'text-muted'}`}>
                                                {step.title}
                                            </div>
                                            <small className="text-muted d-none">{step.description}</small>
                                        </div>

                                    </div>
                                ))}
                            </div>
                            {/* Progress Bar */}
                            <div className="progress" style={{ height: '8px', borderRadius: '10px' }}>
                                <div
                                    className="progress-bar bg-primary"
                                    style={{
                                        width: `${(currentStep / steps.length) * 100}%`,
                                        transition: 'width 0.5s ease',
                                        borderRadius: '10px'
                                    }}
                                />
                            </div>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {/* Step 1: Account Information */}
                            <div className={`${currentStep === 1 ? 'd-block' : 'd-none'}`}>
                                <div className="text-center mb-4">
                                    <h4 className="fw-bold text-primary mb-2">
                                        <FiUser className="me-1" />
                                        Account Information
                                    </h4>
                                </div>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">
                                            <FiUser className="me-1" />
                                            First Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control form-control ${fieldErrors.first_name ? 'is-invalid' : ''}`}
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your first name"
                                            style={{ borderRadius: '12px' }}
                                            required
                                        />
                                        {fieldErrors.first_name && <div className="invalid-feedback">{fieldErrors.first_name}</div>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">
                                            <FiUser className="me-1" />
                                            Last Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control form-control ${fieldErrors.last_name ? 'is-invalid' : ''}`}
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your last name"
                                            style={{ borderRadius: '12px' }}
                                            required
                                        />
                                        {fieldErrors.last_name && <div className="invalid-feedback">{fieldErrors.last_name}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiMail className="me-1" />
                                            Business Email <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email"
                                            style={{ borderRadius: '12px' }}
                                            required
                                        />
                                        {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiUser className="me-1" />
                                            Password <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={`form-control form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter your password (min 8 characters)"
                                            style={{ borderRadius: '12px' }}
                                            required
                                        />
                                        {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                                        <small className="text-muted">Password must be at least 8 characters long</small>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiUser className="me-1" />
                                            Confirm Password <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            className={`form-control form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Confirm your password"
                                            style={{ borderRadius: '12px' }}
                                            required
                                        />
                                        {fieldErrors.confirmPassword && <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>}
                                    </div>
                                </div>
                            </div>
                            {/* Step 2: Business Information */}
                            <div className={`${currentStep === 2 ? 'd-block' : 'd-none'}`}>
                                <div className="text-center mb-4">
                                    <h4 className="fw-bold text-primary mb-2">
                                        <FiHome className="me-1" />
                                        Business Information
                                    </h4>
                                    <p className="text-muted">Tell us about your MSME</p>
                                </div>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiHome className="me-1" />
                                            Firm Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control form-control ${fieldErrors.firmName ? 'is-invalid' : ''}`}
                                            name="firmName"
                                            value={formData.firmName}
                                            onChange={handleInputChange}
                                            placeholder="Enter your firm name"
                                            style={{ borderRadius: '12px' }}
                                            required
                                        />
                                        {fieldErrors.firmName && <div className="invalid-feedback">{fieldErrors.firmName}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiMail className="me-1" />
                                            Contact Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className={`form-control form-control ${fieldErrors.contactNo ? 'is-invalid' : ''}`}
                                            name="contactNo"
                                            value={formData.contactNo}
                                            onChange={handleInputChange}
                                            placeholder="Enter contact number"
                                            style={{ borderRadius: '12px' }}
                                            required
                                        />
                                        {fieldErrors.contactNo && <div className="invalid-feedback">{fieldErrors.contactNo}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiHome className="me-1" />
                                            Sector <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select form-select ${fieldErrors.sector ? 'is-invalid' : ''}`}
                                            name="sector"
                                            value={formData.sector}
                                            onChange={handleInputChange}
                                            style={{ borderRadius: '12px' }}
                                            required
                                            disabled={isLoadingInfoSettings}
                                        >
                                            <option value="">
                                                {isLoadingInfoSettings ? 'Loading sectors...' : 'Select Sector'}
                                            </option>
                                            {sectors.map((sector, index) => (
                                                <option key={index} value={sector.value}>
                                                    {sector.label || sector.value}
                                                </option>
                                            ))}
                                        </select>
                                        {fieldErrors.sector && <div className="invalid-feedback">{fieldErrors.sector}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiHome className="me-1" />
                                            Industry <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select form-select ${fieldErrors.industry ? 'is-invalid' : ''}`}
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleInputChange}
                                            style={{ borderRadius: '12px' }}
                                            required
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
                                        {fieldErrors.industry && <div className="invalid-feedback">{fieldErrors.industry}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiHome className="me-1" />
                                            Business Size <span className="text-danger">*</span>
                                        </label>
                                        <div className="mb-3">
                                            <img
                                                src="https://app.agolix.com/storage/user_files/photos/94568/MSME%20Size.JPG"
                                                alt="MSME Size Guide"
                                                className="img-fluid rounded"
                                                style={{ maxWidth: '100%', height: 'auto' }}
                                            />
                                        </div>
                                        <select
                                            className={`form-select form-select ${fieldErrors.businessSize ? 'is-invalid' : ''}`}
                                            name="businessSize"
                                            value={formData.businessSize}
                                            onChange={handleInputChange}
                                            style={{ borderRadius: '12px' }}
                                            required
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
                                        {fieldErrors.businessSize && <div className="invalid-feedback">{fieldErrors.businessSize}</div>}
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            <FiMapPin className="me-1" />
                                            Location <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select form-select ${fieldErrors.location ? 'is-invalid' : ''}`}
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            style={{ borderRadius: '12px' }}
                                            required
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
                                        {fieldErrors.location && <div className="invalid-feedback">{fieldErrors.location}</div>}
                                    </div>
                                </div>
                            </div>
                            {/* Step 3: Terms and Conditions */}
                            <div className={`${currentStep === 3 ? 'd-block' : 'd-none'}`}>
                                <div className="text-center mb-4">
                                    <h4 className="fw-bold text-primary mb-2">
                                        <FiCheckCircle className="me-1" />
                                        Terms and Conditions
                                    </h4>
                                    <p className="text-muted">Please read and accept our terms</p>
                                </div>
                                <div className="card border-0 bg-light" style={{ borderRadius: '15px' }}>
                                    <div className="card-header bg-primary text-white rounded-top p-2" style={{ borderRadius: '15px 15px 0 0' }}>
                                        <h6 className="fw-semibold">
                                            <FiCheckCircle className="me-1" />
                                            Platform Terms and Conditions
                                        </h6>
                                    </div>
                                    <div
                                        className="card-body"
                                        style={{
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            borderRadius: '0 0 15px 15px'
                                        }}
                                        onScroll={handleScroll}
                                    >
                                        {isLoadingTerms ? (
                                            <div className="text-center py-4">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="text-muted mt-2">Loading Terms and Conditions...</p>
                                            </div>
                                        ) : termsContent ? (
                                            <div dangerouslySetInnerHTML={{ __html: termsContent }} />
                                        ) : (
                                            <div className="text-muted text-center py-4">
                                                <p>Terms and Conditions content is not available. Please contact the administrator.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <div className="form-check d-inline-block">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="terms"
                                            required
                                            disabled={!hasScrolledToBottom}
                                            style={{
                                                opacity: hasScrolledToBottom ? 1 : 0.5,
                                                cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
                                                transform: 'scale(1.2)'
                                            }}
                                        />
                                        <label
                                            className="form-check-label ms-2 fw-semibold"
                                            htmlFor="terms"
                                            style={{
                                                opacity: hasScrolledToBottom ? 1 : 0.5,
                                                cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed'
                                            }}
                                        >
                                            I have read and agree to the Terms and Conditions
                                        </label>
                                    </div>
                                    {fieldErrors.terms && <div className="text-danger mt-2">{fieldErrors.terms}</div>}
                                </div>
                            </div>
                            {/* Navigation Buttons */}
                            <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
                                <button
                                    type="button"
                                    className={`btn  ${currentStep === 1 ? 'btn-outline-secondary disabled' : 'btn-outline-primary'}`}
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    style={{ borderRadius: '12px' }}
                                >
                                    <FiArrowLeft className="me-1" />
                                    Back
                                </button>
                                {currentStep === 3 ? (
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ borderRadius: '12px' }}
                                        disabled={!isStepComplete(3) || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <FiLoader className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheckCircle className="me-1" />
                                                Submit Registration
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={`btn  ${isStepComplete(currentStep) ? 'btn-primary' : 'btn-outline-secondary disabled'}`}
                                        onClick={nextStep}
                                        disabled={!isStepComplete(currentStep)}
                                        style={{ borderRadius: '12px' }}
                                    >
                                        Next
                                        <FiArrowRight className="ms-2" />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
                {/* Footer*/}
                <footer className="" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <p className="text-dark text-opacity-50 text-center">
                        © {new Date().getFullYear()} Copyright  SME Corp. Malaysia All rights reserved.
                    </p>
                </footer>
            </div>
            {/* end auth-fluid-form-box*/}
            {/* Auth fluid right content */}
            <div className="auth-fluid-right text-center">
                <AnimatedBackground />
                <div className="auth-user-testimonial">
                    <img
                        src="/assetsv2/man-comp.svg"
                        jsaction=""
                        className="m-1 mb-5"
                        alt="Is ESG Dead? | PublicRelay"
                        jsname="kn3ccd"
                        height={500}
                    />
                    <h2 className="mb-3">Building Sustainable MSMEs</h2>
                    <p className="lead">
                        <i className="mdi mdi-format-quote-open" /> This ESG assessment platform has helped us understand our environmental impact and implement sustainable practices. The comprehensive evaluation tools have been crucial for our sustainability journey. <i className="mdi mdi-format-quote-close" />
                    </p>
                    {/* <p>- Michael Rodriguez, Sustainable Business Director</p> */}
                </div>{" "}
                {/* end auth-user-testimonial*/}
            </div>
            {/* end Auth fluid right content */}
        </div>
    );
}
export default Register;