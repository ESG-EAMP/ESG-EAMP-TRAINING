import React from 'react';
import LandingNav from '../LandingNav/LandingNav';
import LandingContent from '../../pages/Landing/LandingContent';
import LandingFooter from '../LandingFooter/LandingFooter';
import './Landing.css';

const LandingLayout = ({ children }) => {
    return (
        <div className="d-flex flex-column min-vh-100">
            <LandingNav />
            <div className="flex-grow-1">
                {children}
            </div>
            <LandingFooter />
        </div>
    );
};

export default LandingLayout;
