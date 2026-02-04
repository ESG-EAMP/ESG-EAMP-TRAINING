import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiMenu,
    FiBarChart2,
    FiUserPlus,
    FiUser
} from 'react-icons/fi';
import './LandingNav.css';

const LandingNav = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const adminUser = JSON.parse(localStorage.getItem('admin_user'));
    const isAdmin = !!adminUser || (currentUser && 'admin_access_level' in currentUser);
    const isLoggedIn = !!currentUser || !!adminUser;
    const showLoginButton = !isLoggedIn;
    const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsScrolled(scrollPosition > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`landing-navbar navbar navbar-expand-lg navbar-dark ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container">
                {/* logo */}
                <a href="/" className="navbar-brand me-lg-5">
                    <img
                        className='rounded'
                        src="/assetsv2/pks-lestari-logov2.png"
                        alt="PLATFORM PKSLestari   | PKSlestari"
                        height={50}
                    />
                </a>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNavDropdown"
                    aria-controls="navbarNavDropdown"
                    aria-expanded="false"
                >
                    <FiMenu />
                </button>
                {/* menus */}
                <div className="collapse navbar-collapse" id="navbarNavDropdown">
                    {/* left menu */}
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle"
                                href="/#about"
                                id="aboutDropdown"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="fa-solid fa-circle-info"></i>
                                <span>About</span>
                            </a>
                            <ul className="dropdown-menu" aria-labelledby="aboutDropdown">
                                <li><a className="dropdown-item" href="/#pkslestari">PKSlestari</a></li>
                            </ul>
                        </li>
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle"
                                href="/learning-materials"
                                id="learningCentreDropdown"
                                role="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="fa-solid fa-graduation-cap"></i>
                                <span>Learning Centre</span>
                            </a>
                            <ul className="dropdown-menu" aria-labelledby="learningCentreDropdown">
                                <li><a className="dropdown-item" href="/learning-materials#esg-and-sustainability">ESG & Sustainability</a></li>
                                <li><a className="dropdown-item" href="/learning-materials#website-and-platform">Website & Platform</a></li>
                                <li><a className="dropdown-item" href="/learning-materials#resources">Resources</a></li>
                                <li><a className="dropdown-item" href="/learning-materials#certification">Certification</a></li>
                                <li><a className="dropdown-item" href="/learning-materials#financing-and-incentives">Financing & Incentives</a></li>
                                <li><a className="dropdown-item" href="/learning-materials#esg-champion">ESG Champion</a></li>
                            </ul>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/events">
                                <i className="fa-solid fa-calendar-lines-pen"></i>
                                <span>Events</span>
                            </Link>
                        </li>
                        <li className="nav-item d-none">
                            <Link className="nav-link" to="/contact-us">
                                <i className="fa-solid fa-headset"></i>
                                <span>Contact Us</span>
                            </Link>
                        </li>
                    </ul>
                    {/* right menu */}
                    <ul className="navbar-nav ms-auto align-items-center">
                        {isLoggedIn && !isAdmin && (
                            <li className="nav-item d-lg-none">
                                <Link to="/dashboard" className="nav-link">
                                    <FiBarChart2 />
                                    <span>Start Assessment</span>
                                </Link>
                            </li>
                        )}

                        {!isLoggedIn && (
                            <li className="nav-item">
                                <Link
                                    to="/register"
                                    className="nav-link d-lg-none"
                                >
                                    <FiUserPlus />
                                    <span>Register</span>
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-light rounded-pill d-none d-lg-inline-flex"
                                >
                                    <FiUserPlus />
                                    <span>Register</span>
                                </Link>
                            </li>
                        )}

                        <li className="nav-item">
                            {showLoginButton ? (
                                <>
                                    <Link
                                        to="/login"
                                        className="nav-link d-lg-none"
                                    >
                                        <FiUser />
                                        <span>Login</span>
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="btn btn-primary rounded-pill d-none d-lg-inline-flex ms-2 login-btn"
                                    >
                                        <FiUser />
                                        <span>Login</span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={dashboardPath}
                                        className="nav-link d-lg-none"
                                    >
                                        <FiBarChart2 />
                                        <span>Dashboard</span>
                                    </Link>
                                    <Link
                                        to={dashboardPath}
                                        className="btn btn-primary rounded-pill d-none d-lg-inline-flex ms-2 login-btn"
                                    >
                                        <FiBarChart2 />
                                        <span>Dashboard</span>
                                    </Link>
                                </>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default LandingNav; 