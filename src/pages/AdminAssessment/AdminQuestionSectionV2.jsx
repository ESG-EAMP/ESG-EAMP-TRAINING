import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import './QuestionSection.css';
import api from '../../utils/api';

function AdminQuestionSectionV2() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

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
                <div className="loading-container text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading assessment data...</p>
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="container-fluid">
                <div className="error-state text-center py-5">
                    <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5>User ID Required</h5>
                    <p className="text-muted">Please select a firm to complete the assessment.</p>
                    <button className="btn" onClick={() => navigate('/admin/firm-comparison')}>
                        <i className="fas fa-arrow-left me-1"></i>
                        Back to Firms
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            {/* Admin Header */}
            <div className="admin-header mb-4 p-3 bg-light rounded">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <h5 className="mb-1">Admin Assessment Mode</h5>
                        <p className=" text-muted">
                            Completing assessment for: <strong>{userInfo?.firm || 'Loading...'}</strong>
                        </p>
                    </div>
                    <div className="col-md-4 text-end">
                        <button 
                            className="btn btn-sm"
                            onClick={() => navigate('/admin/firm-comparison')}
                        >
                            <i className="fas fa-arrow-left me-1"></i>
                            Back to Firms
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center py-5">
                <h3>Admin Assessment V2</h3>
                <p className="text-muted">Assessment interface for {userInfo?.firm || 'the firm'}</p>
                <p className="text-muted">This is a simplified version for testing.</p>
            </div>
        </div>
    );
}

export default AdminQuestionSectionV2;