import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dummyUser } from './DummyUser';
import Swal from 'sweetalert2'
import AnimatedBackground from '../../../components/AnimatedBackground/AnimatedBackground';

function Forgotpassword() {
    const navigate = useNavigate();
    const [emailSent, setEmailSent] = useState(false);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API}/auth/user/resetpassword`, {
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
                text: 'Password Reset Successful!',
                icon: 'success',
                confirmButtonText: 'Proceed'
            }).then(() => {
                setEmailSent(true);
                setIsLoading(false);
            });
        } catch (error) {
            setIsLoading(false);
            Swal.fire({
                title: 'Reset Failed',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        }
    };
    return (
        <div className="auth-fluid" style={{
            backgroundColor: '#4E368C',
        }}>
            {/*Auth fluid left content */}
            <div className="auth-fluid-form-box">
                <div className="card-body d-flex flex-column gap-3">
                    {/* Logo */}
                    <div className="auth-brand text-center text-lg-center">
                        <a href="/" className="logo-dark">
                            <span>
                                <img
                                    src="/assetsv2/pks-lestari-logov2.png"
                                    jsaction=""
                                    alt="Is ESG Dead? | PublicRelay"
                                    jsname="kn3ccd"
                                    height={100}
                                />
                            </span>
                        </a>
                        <a href="/" className="logo-light">
                            <span>
                                <img src="assets/images/logo.png" alt="logo" height={22} />
                            </span>
                        </a>
                    </div>
                    <div className="my-auto">
                        {/* title*/}
                        <h4>Reset Password</h4>
                        <p className="text-muted mb-4">
                            Enter your email address and we'll send you an email with instructions to
                            reset your password.
                        </p>
                        {emailSent &&
                            <div className="alert alert-info mb-4 text-center">
                                <i className="mdi mdi-information-outline me-1"></i>
                                We have sent you an email with instructions to reset your password.
                            </div>
                        }
                        {/* form */}
                        <form action="#">
                            <div className="mb-3">
                                <label htmlFor="emailaddress" className="form-label">
                                    Email address
                                </label>
                                <input
                                    className={`form-control ${emailError ? 'is-invalid' : isEmailValid ? 'is-valid' : ''}`}
                                    type="email"
                                    id="emailaddress"
                                    name="emailaddress"
                                    required=""
                                    placeholder="Enter your email"
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
                            <div className=" text-center d-grid">
                                <button
                                    className="btn btn-primary"
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={!isEmailValid || !email.trim() || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="mdi mdi-lock-reset" /> Reset Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                        {/* end form*/}
                        <a href="/login" className="text-muted float-end mt-2">
                            <strong><i className="fa-solid fa-arrow-left-to-bracket me-1"></i>Back to Login</strong>
                        </a>
                    </div>
                    {/* Footer*/}
                    <footer className="footer footer-alt">
                        <p className="text-dark text-opacity-50 text-center ">
                            © {new Date().getFullYear()} Copyright  SME Corp. Malaysia All rights reserved.
                        </p>
                    </footer>
                </div>{" "}
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
export default Forgotpassword;