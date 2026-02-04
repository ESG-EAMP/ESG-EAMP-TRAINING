import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiLoader } from 'react-icons/fi';
import api, { setToken } from '../../../utils/api';

function AdminLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Redirect if admin is already logged in (only if token exists)
    useEffect(() => {
        const adminUser = localStorage.getItem('admin_user');
        const token = localStorage.getItem('token');
        
        // Only redirect if both admin_user and token exist
        // This prevents redirect loops when localStorage data exists but token is invalid
        if (adminUser && token) {
            try {
                JSON.parse(adminUser); // Validate JSON format
                navigate('/admin/dashboard', { replace: true });
            } catch (e) {
                // Invalid JSON, clear it
                localStorage.removeItem('admin_user');
            }
        }
    }, []); // Empty dependency array - navigate is stable and we only want to run this once on mount

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        localStorage.clear();
        e.preventDefault();

        const email = document.getElementById("emailaddress").value;
        const password = document.getElementById("password").value;

        setIsSubmitting(true);
        try {
            const response = await api.post('/auth/admin/login', { email, password });
            const data = response.data;

            // Normalize accessLevel to role format
            const normalizeRole = (accessLevel) => {
                if (!accessLevel) return 'admin';
                const normalized = accessLevel.toLowerCase().trim();
                if (normalized === 'super admin' || normalized === 'super administrator' || normalized === 'super_admin') {
                    return 'super_admin';
                } else if (normalized === 'administrator' || normalized === 'admin') {
                    return 'admin';
                }
                return 'admin'; // Default fallback
            };
            
            const normalizedRole = normalizeRole(data.admin_user.accessLevel);
            
            localStorage.setItem("admin_access_level", data.admin_user.accessLevel); // Keep original for display
            localStorage.setItem("admin_email", data.admin_user.email);
            localStorage.setItem("admin_user", JSON.stringify(data.admin_user));
            setToken(data.token); // Use centralized token management
            sessionStorage.setItem("user_role", normalizedRole); // Store normalized role

            // Redirect
            navigate("/admin/dashboard");

        } catch (error) {
            console.error("Login error:", error);
            Swal.fire("Login Failed", "Invalid admin credentials", "error");
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
                            className="mb-4 rounded shadow"
                        />
                        <h2 className="fw-bold text-primary mb-3">Admin Portal</h2>
                        <p className="text-muted lead">Welcome to SME Corp. Malaysia<br/>ESG Assessment & Monitoring Platform</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="col-lg-6 d-flex flex-column align-items-center justify-content-center py-5">
                    <div className="w-100 p-4" style={{maxWidth: '450px'}}>
                        {/* Mobile Logo */}
                        <div className="text-center d-lg-none mb-4">
                            <img 
                                className="rounded"
                                src="/assetsv2/pks-lestari-side.png" 
                                alt="Logo" 
                                height={80} 
                            />
                        </div>

                        <div className="text-center mb-4">
                            <h3 className="fw-bold mb-2">Sign In</h3>
                            <p className="text-muted">Enter your email and password to access the admin panel.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="emailaddress" className="form-label">Email Address</label>
                                <input
                                    className="form-control form-control-lg"
                                    type="email"
                                    id="emailaddress"
                                    required=""
                                />
                            </div>

                            <div className="mb-3">
                                <a href="/admin/forgot-password" className="text-muted float-end">
                                    <small>Forgot Password?</small>
                                </a>
                                <label htmlFor="password" className="form-label">Password</label>
                                <div className="input-group input-group-merge">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        className="form-control form-control-lg"
                                    />
                                    <div
                                        className="input-group-text"
                                        onClick={togglePasswordVisibility}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className={`mdi ${showPassword ? 'mdi-eye-off' : 'mdi-eye'}`}></i>
                                    </div>
                                </div>
                            </div>

                            <div className="d-grid  text-center">
                                <button 
                                    className="btn btn-primary btn-lg" 
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FiLoader className="me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                            Accessing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="mdi mdi-shield-account me-1" />
                                            Login
                                        </>
                                    )}
                                </button>
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

export default AdminLogin;