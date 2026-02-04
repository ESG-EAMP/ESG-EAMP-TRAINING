import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    FiMail,
    FiLock,
    FiUser,
    FiShield,
    FiCheckCircle,
    FiArrowRight,
    FiArrowLeft,
    FiBriefcase
} from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

function SuperAdminRegisterInit() {
    const [searchParams] = useSearchParams();
    const superSecretPassword = searchParams.get('superSecretPassword');
    const realSuperSecretPassword = import.meta.env.VITE_APP_SUPER_SECRET_PASSWORD;

    if (superSecretPassword !== realSuperSecretPassword) {
        return <Navigate to="/admin/login" replace />;
    }

    const [currentStep, setCurrentStep] = useState(1);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [formData, setFormData] = useState({
        // Personal Information
        fullName: '',
        icNumber: '',
        position: '',
        email: '',
        password: '',
        phoneNumber: '',

        // Administrative Details
        employeeId: '',
        accessLevel: '',

        // Verification
        supervisorEmail: '',
        approvalStatus: 'pending'
    });

    // Generate random password
    const generateRandomPassword = () => {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    };

    // Generate password on component mount
    useEffect(() => {
        const newPassword = generateRandomPassword();
        setGeneratedPassword(newPassword);
        setFormData(prev => ({
            ...prev,
            password: newPassword
        }));
    }, []);

    const validateField = (name, value) => {
        if (!value || value.trim() === '') {
            setFieldErrors(prev => ({
                ...prev,
                [name]: 'This is a required field'
            }));
            return false;
        }

        // Additional validation for specific fields
        if (name === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                setFieldErrors(prev => ({
                    ...prev,
                    [name]: 'Please enter a valid email address'
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
                return formData.fullName.trim() !== '' &&
                    formData.icNumber.trim() !== '' &&
                    formData.position.trim() !== '' &&
                    !fieldErrors.fullName &&
                    !fieldErrors.icNumber &&
                    !fieldErrors.position;
            case 2:
                return formData.email.trim() !== '' &&
                    formData.password.trim() !== '' &&
                    formData.phoneNumber.trim() !== '' &&
                    !fieldErrors.email &&
                    !fieldErrors.phoneNumber;
            case 3:
                return formData.employeeId.trim() !== '' &&
                    formData.accessLevel.trim() !== '' &&
                    formData.supervisorEmail.trim() !== '' &&
                    !fieldErrors.employeeId &&
                    !fieldErrors.accessLevel &&
                    !fieldErrors.supervisorEmail;
            default:
                return false;
        }
    };

    const validateStep = (step) => {
        const errors = {};

        switch (step) {
            case 1:
                if (!formData.fullName || formData.fullName.trim() === '') errors.fullName = 'This is a required field';
                if (!formData.icNumber || formData.icNumber.trim() === '') errors.icNumber = 'This is a required field';
                if (!formData.position || formData.position.trim() === '') errors.position = 'This is a required field';
                break;
            case 2:
                if (!formData.email || formData.email.trim() === '') {
                    errors.email = 'This is a required field';
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.email)) {
                        errors.email = 'Please enter a valid email address';
                    }
                }
                if (!formData.phoneNumber || formData.phoneNumber.trim() === '') errors.phoneNumber = 'This is a required field';
                break;
            case 3:
                if (!formData.employeeId || formData.employeeId.trim() === '') errors.employeeId = 'This is a required field';
                if (!formData.accessLevel || formData.accessLevel.trim() === '') errors.accessLevel = 'This is a required field';
                if (!formData.supervisorEmail || formData.supervisorEmail.trim() === '') {
                    errors.supervisorEmail = 'This is a required field';
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.supervisorEmail)) {
                        errors.supervisorEmail = 'Please enter a valid email address';
                    }
                }
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

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const nextStep = () => {
        const isValid = validateStep(currentStep);

        if (currentStep < 3 && isValid) {
            setCurrentStep(prev => prev + 1);
        } else if (!isValid) {
            Swal.fire({
                title: 'Required Fields Missing',
                text: 'Please fill in all required fields correctly before proceeding.',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

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

        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API}/auth/admin/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error details:", errorData);
                throw new Error(JSON.stringify(errorData));
            }

            const result = await response.json();
            Swal.fire({
                title: 'Registration Successful',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#312259'
            });

        } catch (error) {
            console.error("Registration Error:", error);

            Swal.fire({
                title: 'Registration Failed',
                text: error.toString() || 'Something went wrong',
                icon: 'error',
                confirmButtonColor: '#312259'
            });
        }
        setIsSubmitting(false);
    };

    const steps = [
        { id: 1, title: 'Personal', icon: FiUser, description: 'Personal information' },
        { id: 2, title: 'Account', icon: FiMail, description: 'Account credentials' },
        { id: 3, title: 'Admin', icon: FiShield, description: 'Administrative details' }
    ];

    return (
        <div className="pt-5">
            {/* Super Admin Only Warning Banner */}
            <div className="container mb-4">
                <div className="alert alert-danger border-0 shadow-sm" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
                    <div className="d-flex align-items-center">
                        <FiShield className="me-3 text-white" size={24} />
                        <div className="flex-grow-1">
                            <h5 className="alert-heading mb-1 fw-bold text-white">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                SUPER ADMIN ACCESS ONLY
                            </h5>
                            <p className=" text-white">
                                This page is restricted to authorized super administrators only. Unauthorized access is prohibited and monitored.
                            </p>
                        </div>
                        <div className="text-end">
                            <div className="badge bg-warning text-dark px-3 py-2" style={{ fontSize: '0.8rem' }}>
                                <i className="fas fa-lock me-1"></i>
                                SECURE ZONE
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="align-items-center justify-content-center">
                <div className="container">    
                    <div className="row justify-content-center">
                        <div className="p-4 p-lg-5">
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
                                                <small className="text-muted d-none d-md-block">{step.description}</small>
                                            </div>
                                            {index < steps.length - 1 && (
                                                <div
                                                    className={`position-absolute top-50 start-100 translate-middle-y ${currentStep > step.id ? 'bg-primary' : 'bg-light'
                                                        }`}
                                                    style={{
                                                        width: '30px',
                                                        height: '2px',
                                                        marginLeft: '25px'
                                                    }}
                                                />
                                            )}
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
                                {/* Step 1: Personal Information */}
                                <div className={`${currentStep === 1 ? 'd-block' : 'd-none'}`}>
                                    <div className="text-center mb-4">
                                        <h4 className="fw-bold text-primary mb-2">
                                            <FiUser className="me-1" />
                                            Personal Information
                                        </h4>
                                        <p className="text-muted">Enter your personal details</p>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                <FiUser className="me-1" />
                                                Full Name <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.fullName ? 'is-invalid border-danger' : ''}`}
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter your full name"
                                                style={{ borderRadius: '12px' }}
                                                required
                                            />
                                            {fieldErrors.fullName && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.fullName}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                <FiUser className="me-1" />
                                                IC Number <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.icNumber ? 'is-invalid border-danger' : ''}`}
                                                name="icNumber"
                                                value={formData.icNumber}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter IC number"
                                                style={{ borderRadius: '12px' }}
                                                required
                                            />
                                            {fieldErrors.icNumber && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.icNumber}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                <FiBriefcase className="me-1" />
                                                Position <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.position ? 'is-invalid border-danger' : ''}`}
                                                name="position"
                                                value={formData.position}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter your position"
                                                style={{ borderRadius: '12px' }}
                                                required
                                            />
                                            {fieldErrors.position && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.position}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>

                                {/* Step 2: Account Information */}
                                <div className={`${currentStep === 2 ? 'd-block' : 'd-none'}`}>
                                    <div className="text-center mb-4">
                                        <h4 className="fw-bold text-primary mb-2">
                                            <FiMail className="me-1" />
                                            Account Information
                                        </h4>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                <FiMail className="me-1" />
                                                Email Address <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className={`form-control ${fieldErrors.email ? 'is-invalid border-danger' : ''}`}
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter your email address"
                                                style={{ borderRadius: '12px' }}
                                                required
                                            />
                                            {fieldErrors.email && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.email}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-12 d-none">
                                            <label className="form-label fw-semibold">
                                                <FiLock className="me-1" />
                                                Generated Password
                                            </label>
                                            <div className="alert alert-info d-flex align-items-center" style={{ borderRadius: '12px' }}>
                                                <FiLock className="me-1" />
                                                <div className="flex-grow-1">
                                                    <strong>Password:</strong> <code className="ms-2">{generatedPassword}</code>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => {
                                                        const newPassword = generateRandomPassword();
                                                        setGeneratedPassword(newPassword);
                                                        setFormData(prev => ({ ...prev, password: newPassword }));
                                                    }}
                                                >
                                                    Generate New
                                                </button>
                                            </div>
                                            <small className="text-muted">
                                                <i className="fas fa-info-circle me-1"></i>
                                                A secure password has been automatically generated for this account.
                                            </small>
                                        </div>


                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                <FiMail className="me-1" />
                                                Phone Number <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                className={`form-control ${fieldErrors.phoneNumber ? 'is-invalid border-danger' : ''}`}
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter your phone number"
                                                style={{ borderRadius: '12px' }}
                                                required
                                            />
                                            {fieldErrors.phoneNumber && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.phoneNumber}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Administrative Details */}
                                <div className={`${currentStep === 3 ? 'd-block' : 'd-none'}`}>
                                    <div className="text-center mb-4">
                                        <h4 className="fw-bold text-primary mb-2">
                                            <FiShield className="me-1" />
                                            Administrative Details
                                        </h4>
                                        <p className="text-muted">Configure administrative access and permissions</p>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                <FiUser className="me-1" />
                                                Employee ID <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${fieldErrors.employeeId ? 'is-invalid border-danger' : ''}`}
                                                name="employeeId"
                                                value={formData.employeeId}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter employee ID"
                                                style={{ borderRadius: '12px' }}
                                                required
                                            />
                                            {fieldErrors.employeeId && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.employeeId}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">
                                                <FiShield className="me-1" />
                                                Access Level <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${fieldErrors.accessLevel ? 'is-invalid border-danger' : ''}`}
                                                name="accessLevel"
                                                value={formData.accessLevel}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                style={{ borderRadius: '12px' }}
                                                required
                                            >
                                                <option value="">Select Access Level</option>
                                                <option value="super_admin">Super Admin</option>
                                                <option value="admin">Administrator</option>
                                            </select>
                                            {fieldErrors.accessLevel && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.accessLevel}
                                                </div>
                                            )}
                                        </div>



                                        <div className="col-12">
                                            <label className="form-label fw-semibold">
                                                <FiMail className="me-1" />
                                                Supervisor Email <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                className={`form-control ${fieldErrors.supervisorEmail ? 'is-invalid border-danger' : ''}`}
                                                name="supervisorEmail"
                                                value={formData.supervisorEmail}
                                                onChange={handleInputChange}
                                                onBlur={handleBlur}
                                                placeholder="Enter supervisor's email address"
                                                style={{ borderRadius: '12px' }}
                                                required
                                            />
                                            {fieldErrors.supervisorEmail && (
                                                <div className="invalid-feedback d-block fw-semibold">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    {fieldErrors.supervisorEmail}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="d-flex justify-content-between align-items-center mt-5">
                                    <button
                                        type="button"
                                        className={`btn px-4 py-2 ${currentStep === 1 ? 'btn-outline-secondary disabled' : 'btn-outline-primary'}`}
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
                                            className="btn btn-primary px-5 py-2 d-flex align-items-center justify-content-center"
                                            style={{ borderRadius: '12px' }}
                                            disabled={!isStepComplete(3) || isSubmitting}
                                        >
                                            {!isSubmitting && <FiCheckCircle className="me-1" />}
                                            {isSubmitting && <i className="mdi mdi-dots-circle mdi-spin text-white me-1"></i>}
                                            Create Admin Account
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`btn px-4 py-2 ${isStepComplete(currentStep) ? 'btn-primary' : 'btn-outline-secondary disabled'}`}
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

                </div>
            </div>
        </div>
    );
}

export default SuperAdminRegisterInit; 