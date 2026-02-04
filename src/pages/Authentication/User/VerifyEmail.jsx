import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiMail, FiCheckCircle, FiXCircle, FiLoader, FiArrowLeft } from 'react-icons/fi';
import AnimatedBackground from '../../../components/AnimatedBackground/AnimatedBackground';
import api from '../../../utils/api';

function VerifyEmail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [errorMessage, setErrorMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setErrorMessage('No verification token provided');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token) => {
        try {
            const response = await api.get(`/auth/user/verify-email?token=${token}`);
            Swal.fire({
                title: 'Email Verified!',
                text: response.data.message || 'Your email has been verified successfully. You can now log in.',
                icon: 'success',
                confirmButtonText: 'Go to Login'
            }).then(() => {
                navigate('/login');
            });
        } catch (error) {
            console.error('Verification error:', error);
            const errorDetail = error.response?.data?.detail || error.message || 'Failed to verify email';
            setErrorMessage(errorDetail);
        }
    };

    const handleResendVerification = async () => {
        if (!email || !email.trim()) {
            Swal.fire({
                title: 'Email Required',
                text: 'Please enter your email address to resend the verification email.',
                icon: 'warning',
                confirmButtonColor: '#312259'
            });
            return;
        }

        setIsResending(true);
        try {
            const response = await api.post('/auth/user/resend-verification', { email });
            Swal.fire({
                title: 'Email Sent!',
                text: 'A new verification email has been sent to your inbox. Please check your email.',
                icon: 'success',
                confirmButtonColor: '#312259'
            });
        } catch (error) {
            const errorDetail = error.response?.data?.detail || error.message || 'Failed to resend verification email';
            Swal.fire({
                title: 'Error',
                text: errorDetail,
                icon: 'error',
                confirmButtonColor: '#312259'
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="auth-fluid" style={{
            backgroundColor: '#4E368C',
        }}>
            {/*Auth fluid left content */}
            <div className="auth-fluid-form-box p-0 pb-3">
                <div className="border-0">
                    <div className="p-4">
                        <div className="text-center mb-4">
                            <h2 className="fw-bold text-primary mb-2">
                                Email Verification
                            </h2>
                        </div>

                        {errorMessage ? (
                            <div className="text-center py-5">
                                <h4 className="mb-3 text-danger">Verification Failed</h4>
                                <p className="text-muted mb-4">{errorMessage}</p>
                                
                                <div className="card border-0 bg-light mb-4" style={{ borderRadius: '15px' }}>
                                    <div className="card-body p-4">
                                        <h6 className="fw-semibold mb-3">Resend Verification Email</h6>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">
                                                <FiMail className="me-1" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                                style={{ borderRadius: '12px' }}
                                            />
                                        </div>
                                        <button
                                            className="btn btn-primary w-100"
                                            onClick={handleResendVerification}
                                            disabled={isResending}
                                            style={{ borderRadius: '12px' }}
                                        >
                                            {isResending ? (
                                                <>
                                                    <FiLoader className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <FiMail className="me-1" />
                                                    Resend Verification Email
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <Link to="/login" className="btn btn-outline-primary" style={{ borderRadius: '12px' }}>
                                    <FiArrowLeft className="me-1" />
                                    Back to Login
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <FiLoader className="mb-3" size={48} style={{ animation: 'spin 1s linear infinite', color: '#4e368c' }} />
                                <h4 className="mb-3">Verifying your email...</h4>
                                <p className="text-muted">Please wait while we verify your email address.</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Footer*/}
                <footer className="">
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
                        className="m-1 mb-5"
                        alt="PLATFORM PKSLestari  "
                        height={500}
                    />
                    <h2 className="mb-3">Verify Your Account</h2>
                    <p className="lead">
                        <i className="mdi mdi-format-quote-open" /> Please verify your email address to activate your account and start your ESG journey with us. <i className="mdi mdi-format-quote-close" />
                    </p>
                </div>
            </div>
            {/* end Auth fluid right content */}
        </div>
    );
}

export default VerifyEmail;

