import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import Assessments from '../AdminDashboard/Assesments';
import api from '../../utils/api';

function AdminFirmAssessments() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user information
        if (userId) {
            api.get('/management/users')
                .then(res => {
                    const data = res.data;
                // Find the specific user by ID
                const users = data.users || [];
                const user = users.find(u => u.id === userId);
                setUserInfo(user || null);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching user info:', err);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [userId, navigate]);

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Firm Assessment History" breadcrumb={[["Admin Dashboard", "/dashboard"], ["Firms", "/admin/firm-comparison"], "Assessment History"]} />
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading firm information...</p>
                </div>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div className="container-fluid">
                <Title title="Firm Assessment History" breadcrumb={[["Admin Dashboard", "/dashboard"], ["Firms", "/admin/firm-comparison"], "Assessment History"]} />
                <div className="error-state">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h5>Firm Not Found</h5>
                    <p className="text-muted">The requested firm could not be found.</p>
                    <button className="btn" onClick={() => navigate('/admin/firm-comparison')}>
                        <i className="fas fa-arrow-left me-1"></i>
                        Back to Firms
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title={`${userInfo.firm} - Assessment History`} breadcrumb={[["Admin Dashboard", "/dashboard"], ["Firms", "/admin/firm-comparison"], "Assessment History"]} />

            {/* Firm Header */}
            <div className="firm-header mb-4 p-3 bg-light rounded">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <h5 className="mb-1">Assessment History</h5>
                        <p className=" text-muted">
                            Viewing assessment history for: <strong>{userInfo.firm}</strong>
                        </p>
                        <div className="firm-details mt-2">
                            <small className="text-muted">
                                <i className="fas fa-envelope me-1"></i>
                                {userInfo.email} | 
                                <i className="fas fa-industry me-1 ms-2"></i>
                                {userInfo.industry} | 
                                <i className="fas fa-map-marker-alt me-1 ms-2"></i>
                                {userInfo.location}
                            </small>
                        </div>
                    </div>
                    <div className="col-md-4 text-end">
                        <button 
                            className="btn btn-sm me-1"
                            onClick={() => navigate('/admin/firm-comparison')}
                        >
                            <i className="fas fa-arrow-left me-1"></i>
                            Back to Firms
                        </button>
                        <button 
                            className="btn btn-primary btn-sm d-none"
                            onClick={() => navigate(`/admin/assessment-v2/${userId}`)}
                        >
                            <i className="fas fa-plus me-1"></i>
                            New Assessment
                        </button>
                    </div>
                </div>
            </div>
            {/* Assessment Component */}
            <Assessments userId={userId} userInfo={userInfo} />
        </div>
    );
}

export default AdminFirmAssessments;
