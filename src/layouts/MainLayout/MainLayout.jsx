import React, { useState, useEffect } from "react";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Footer from "../Footer/Footer";
import LoadingScreen from "../../components/LoadingScreen";
import { useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Chatbox from "../../components/Chatbox/Chatbox";

function MainLayout({ children }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ensure global theme attributes are set on the <html> element
        const root = document.documentElement;
        // Remove any persisted theme overrides from vendor script
        try { sessionStorage.removeItem('__HYPER_CONFIG__'); } catch (_) {}
        // Restore previous defaults
        root.setAttribute('data-bs-theme', 'light');
        root.setAttribute('data-menu-color', 'dark');
        root.setAttribute('data-topbar-color', 'light');

        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const navigate = useNavigate();
    useEffect(() => {
        document.getElementById('main-layout').scrollIntoView({ behavior: 'instant' });
    }, [navigate]);


    function isAssessmentPage() {
        const path = window.location.pathname;
        if (path.includes('/admin/assessment/manage')) {
            return true;
        }
        return false;
    }


    return (
        <div id="main-layout">
            <HelmetProvider>
                <div className={`${!loading ? "d-none" : ""}`}>
                    <LoadingScreen />
                </div>
                <div className={`wrapper ${loading ? "d-none" : ""}`}>
                    <Header />
                    <Sidebar />
                    <div className="content-page">
                        <div className="content" style={{ minHeight: '90vh' }}>{children}</div>
                         {/* <Footer />  */}
                    </div>
                </div>
                {!isAssessmentPage() && <Chatbox />}
            </HelmetProvider>
        </div>
    );
}

export default MainLayout; 