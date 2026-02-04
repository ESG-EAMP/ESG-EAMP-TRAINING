import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiLoader } from 'react-icons/fi';

function ForgotAdminPassword() {
    const navigate = useNavigate();
    const [emailSent, setEmailSent] = useState(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    };

    // Handle email input change with validation
    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        if (value === '') {
            setEmailError('');
            setIsEmailValid(false);
        } else if (!validateEmail(value)) {
            setEmailError('Please enter a valid email address');
            setIsEmailValid(false);
        } else {
            setEmailError('');
            setIsEmailValid(true);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate email before submission
        if (!email.trim()) {
            setEmailError('Email address is required');
            return;
        }

        if (!isEmailValid) {
            setEmailError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API}/auth/admin/resetpassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });
            if (!response.ok) {
                throw new Error('Invalid email');
            }
            const data = await response.json();
            Swal.fire({
                title: 'Password Reset Successful!',
                icon: 'success',
                confirmButtonText: 'Proceed'
            }).then(() => {
                setEmailSent(true);
            });
        } catch (error) {
            Swal.fire({
                title: 'Reset Failed',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-vh-100 bg-white">
            <div className="row g-0 h-100" style={{minHeight: '100vh'}}>
                {/* Left Side - Branding */}
                <div className="col-lg-6 d-none d-lg-flex flex-column align-items-center justify-content-center bg-light position-relative overflow-hidden">
                    <div className="position-absolute w-100 h-100">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100%"
                            height="100%"
                            viewBox="0 0 800 800"
                        >
                            <g fillOpacity="0.22">
                                <circle style={{ fill: "rgba(var(--ct-primary-rgb), 0.1)" }} cx={400} cy={400} r={600} />
                                <circle style={{ fill: "rgba(var(--ct-primary-rgb), 0.2)" }} cx={400} cy={400} r={500} />
                                <circle style={{ fill: "rgba(var(--ct-primary-rgb), 0.3)" }} cx={400} cy={400} r={300} />
                                <circle style={{ fill: "rgba(var(--ct-primary-rgb), 0.4)" }} cx={400} cy={400} r={200} />
                                <circle style={{ fill: "rgba(var(--ct-primary-rgb), 0.5)" }} cx={400} cy={400} r={100} />
                            </g>
                        </svg>
                    </div>
                    <div className="position-relative text-center p-5" style={{zIndex: 1}}>
                        <img 
                            src="/assetsv2/pks-lestari-side.png" 
                            alt="Logo" 
                            height={150} 
                            className="mb-4"
                        />
                        <h2 className="fw-bold text-primary mb-3">Admin Portal</h2>
                        <p className="text-muted lead">Password Recovery Service</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="col-lg-6 d-flex flex-column align-items-center justify-content-center py-5">
                    <div className="w-100 p-4" style={{maxWidth: '450px'}}>
                        {/* Mobile Logo */}
                        <div className="text-center d-lg-none mb-4">
                            <img 
                                src="/assetsv2/pks-lestari-side.png" 
                                alt="Logo" 
                                height={80} 
                            />
                        </div>

                        <div className="text-center mb-2">
                            <h3 className="fw-bold mb-2">Reset Password</h3>
                            <p className="text-muted">Enter your email address and we'll send you an email with instructions to reset your password.</p>
                        </div>

                        {emailSent &&
                            <div className="text-info text-center my-2">
                                <i className="mdi mdi-information-outline me-1"></i>
                                We have sent you an email with instructions to reset your password.
                            </div>
                        }

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="emailaddress" className="form-label">Email Address</label>
                                <input
                                    className={`form-control form-control-lg ${emailError ? 'is-invalid' : isEmailValid ? 'is-valid' : ''}`}
                                    type="email"
                                    id="emailaddress"
                                    name="emailaddress"
                                    required=""
                                    value={email}
                                    onChange={handleEmailChange}
                                />
                                {emailError && (
                                    <div className="invalid-feedback">
                                        {emailError}
                                    </div>
                                )}
                                {isEmailValid && !emailError && (
                                    <div className="valid-feedback">
                                        Email address looks good!
                                    </div>
                                )}
                            </div>

                            <div className="d-grid mb-3">
                                <button 
                                    className="btn btn-primary btn-lg" 
                                    type="submit"
                                    disabled={!isEmailValid || !email.trim() || isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FiLoader className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="mdi mdi-lock-reset me-1" />
                                            Reset Password
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="text-center">
                                <Link to="/admin/login" className="text-muted fw-bold">
                                    <i className="mdi mdi-arrow-left me-1"></i>Back to Login
                                </Link>
                            </div>
                        </form>
                        
                        <div className="text-center mt-5 text-muted">
                            <small>2026 - © SME Corp. Malaysia</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotAdminPassword;