import React, { useState } from 'react';
import Title from '../../layouts/Title/Title';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import './UserSupport.css';

const API_BASE = import.meta.env.VITE_APP_API;

function UserFeedback() {
    const userEmail = localStorage.getItem('user_email') || '';
    const userFirstName = localStorage.getItem('first_name') || '';
    const userLastName = localStorage.getItem('last_name') || '';
    const userFirmName = localStorage.getItem('firm_name') || '';
    
    const [formData, setFormData] = useState({
        email: userEmail, // prefilled with logged-in user's email
        message: '',
        rating: 0,
        firm_name: userFirmName,
        first_name: userFirstName,
        last_name: userLastName
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRatingClick = (rating) => {
        setFormData(prev => ({
            ...prev,
            rating: rating
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/feedback/create-feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thank you for your feedback!',
                    text: 'We appreciate you taking the time to share your thoughts with us.',
                    confirmButtonText: 'Return to Support',
                    confirmButtonColor: '#0d6efd',
                    customClass: {
                        confirmButton: 'btn btn-primary'
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/support';
                    }
                });
                // Reset form
                setFormData({
                    email: userEmail,
                    message: '',
                    rating: 0,
                    firm_name: userFirmName,
                    first_name: userFirstName,
                    last_name: userLastName
                });
            } else {
                const data = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Submission Failed',
                    text: data.detail || 'Failed to submit feedback. Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error submitting feedback. Please try again.',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <Title title="Feedback" breadcrumb={[["Support", "/support"], "Feedback"]} />
            <div className="row">
                <div className="col-md-8 offset-md-2">
                    <div className="card mt-4">
                        <div className="card-header bg-primary text-white">
                            <h4>Share your thoughts below</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="form-label">How would you rate your experience?</label>
                                    <div className="rating-stars mb-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span 
                                                key={star}
                                                className={`star ${star <= formData.rating ? 'text-warning' : 'text-muted'}`}
                                                onClick={() => handleRatingClick(star)}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="message" className="form-label">Share your experience with us</label>
                                    <textarea 
                                        className="form-control" 
                                        id="message" 
                                        name="message" 
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="Tell us about your experience..."
                                    ></textarea>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="email" className="form-label">Your Email (for reply)</label>
                                    <input 
                                        type="email" 
                                        className="form-control" 
                                        id="email" 
                                        name="email" 
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Submitting...' : 'Submit Feedback'}
                                    </button>
                                    <Link to="/support" className="btn btn-outline-secondary">Cancel</Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserFeedback;