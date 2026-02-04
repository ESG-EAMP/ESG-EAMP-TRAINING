import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dummyUser } from './DummyUser';
import Swal from 'sweetalert2'
import { FiLoader } from 'react-icons/fi';
import AnimatedBackground from '../../../components/AnimatedBackground/AnimatedBackground';
import api, { setToken } from '../../../utils/api';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const bypassLogin = import.meta.env.VITE_APP_BYPASS_USER_LOGIN === 'true';

    // Redirect if user is already logged in (only if token exists)
    useEffect(() => {
        const currentUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // Only redirect if both user and token exist
        // This prevents redirect loops when localStorage data exists but token is invalid
        if (currentUser && token) {
            try {
                const parsedUser = JSON.parse(currentUser);
                // Check if user is logged in and is not an admin
                if (!('admin_access_level' in parsedUser)) {
                    navigate('/dashboard', { replace: true });
                }
            } catch (e) {
                // Invalid JSON, clear it
                localStorage.removeItem('user');
            }
        }
    }, []); // Empty dependency array - navigate is stable and we only want to run this once on mount

    const handleSubmit = async (e) => {
        localStorage.clear();
        e.preventDefault();

        /*if (bypassLogin) {            
            localStorage.setItem("user_email", dummyUser.email);
            sessionStorage.setItem("user_role", "msme");
            localStorage.setItem("user", JSON.stringify(dummyUser));
            navigate('/dashboard');
            return;
        }*/ // for dev donna login ps. this works for me

        setIsSubmitting(true);
        try {
            const response = await api.post('/auth/user/login', { email, password });
            const data = response.data;
            setToken(data.token); // Use centralized token management
            sessionStorage.setItem("user_role", 'user');
            localStorage.setItem("user", JSON.stringify(data.user));
            // Store user_email for assessment compatibility
            localStorage.setItem("user_email", data.user.email);
            // Store user_id for later use
            if (data.user_id) {
                localStorage.setItem("user_id", data.user_id);
            } else if (data._id) {
                localStorage.setItem("user_id", data._id);
            }

            Swal.fire({
                title: 'Login Successful!',
                text: 'Redirecting to your dashboard.',
                icon: 'success',
                confirmButtonText: 'Proceed'
            }).then(() => {
                navigate('/dashboard');
            });
        } catch (error) {
            // Check if email verification is required
            if (error.response?.status === 403 && error.response?.data?.requires_verification) {
                const userEmail = error.response.data.email || email;
                // Show prompt to resend verification email
                Swal.fire({
                    title: 'Email Not Verified',
                    text: 'Please verify your email address before logging in. Would you like us to resend the verification email?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Resend Email',
                    cancelButtonText: 'No, Thanks',
                    confirmButtonColor: '#4e368c',
                    cancelButtonColor: '#6c757d'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        // Resend verification email
                        try {
                            setIsSubmitting(true);
                            const resendResponse = await api.post('/auth/user/resend-verification', { email: userEmail });
                            Swal.fire({
                                title: 'Email Sent!',
                                text: resendResponse.data.message || 'A new verification email has been sent to your inbox. Please check your email.',
                                icon: 'success',
                                confirmButtonColor: '#4e368c'
                            });
                        } catch (resendError) {
                            const resendErrorMessage = resendError.response?.data?.detail || resendError.message || 'Failed to resend verification email';
                            Swal.fire({
                                title: 'Error',
                                text: resendErrorMessage,
                                icon: 'error',
                                confirmButtonColor: '#4e368c'
                            });
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                });
            } else {
                const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
                Swal.fire({
                    title: 'Login Failed',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'Try Again'
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

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
            <div className="auth-fluid-form-box">
                <div className="card-body d-flex flex-column gap-3">
                    {/* Logo */}
                    <div className="auth-brand text-center text-lg-center">
                        <a href="/" className="logo-dark">
                            <span>
                                <img
                                    src="/assetsv2/pks-lestari-side.png"
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
                        <h4 className="mt-0 text-center">Welcome to PLATFORM PKSLestari </h4>
                        <p className="text-muted mb-4 text-center">
                            Access your MSME's ESG dashboard to evaluate and improve your environmental, social, and governance performance.
                        </p>
                        {/* form */}
                        <form action="#">
                            <div className="mb-3">
                                <label htmlFor="emailaddress" className="form-label">
                                    Email
                                </label>
                                <input
                                    className="form-control"
                                    type="email"
                                    id="emailaddress"
                                    required=""
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <a href="/forgot-password" className="text-muted float-end">
                                    <small>Forgot your password?</small>
                                </a>
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <div className="position-relative">
                                    <input
                                        className="form-control"
                                        type={showPassword ? "text" : "password"}
                                        required=""
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{ paddingRight: '45px' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                        style={{
                                            border: 'none',
                                            background: 'none',
                                            padding: '0 10px',
                                            color: '#6c757d',
                                            zIndex: 10
                                        }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`mdi ${showPassword ? 'mdi-eye-off' : 'mdi-eye'}`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="d-grid  text-center">
                                <button 
                                    className="btn btn-primary" 
                                    type="submit" 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FiLoader className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <i className="mdi mdi-login" /> Sign in
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                        {/* end form*/}
                    </div>
                    {/* Footer*/}
                    <footer className="footer footer-alt">
                        <p className="text-dark text-opacity-50 text-center ">
                            © {new Date().getFullYear()} Copyright  SME Corp. Malaysia All rights reserved.
                        </p>
                    </footer>

                </div>{" "}
                {/* end .card-body */}
                <p className="text-muted">
                    New to ESG Assessment?{" "}
                    <Link to="/register" className="text-muted ms-1">
                        <b>Register Your Business</b>
                    </Link>
                </p>


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

export default Login;