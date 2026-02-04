import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaArrowLeft, FaCalendarAlt, FaUser, FaTag } from 'react-icons/fa';
import api from '../../utils/api';

function UserLearningMaterialDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Helper to check if HTML content is empty or mostly blank
    const isContentEmpty = (htmlContent) => {
        if (!htmlContent || typeof htmlContent !== 'string') return true;
        
        // Create a temporary DOM element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Get text content (strips HTML tags)
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        // Remove whitespace and check if there's meaningful content
        const trimmedText = textContent.trim().replace(/\s+/g, ' ');
        
        // Consider content empty if:
        // 1. No text content after stripping HTML
        // 2. Only whitespace characters
        // 3. Very short content (less than 3 characters) - likely just formatting artifacts
        return trimmedText.length < 3;
    };

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                // Check if user is logged in
                const userId = localStorage.getItem('user_id');
                const token = localStorage.getItem('token');
                
                if (userId && token) {
                    // For logged-in users, use authenticated endpoint
                    // No fallback - if this fails, show error to user
                    try {
                        const res = await api.get(`/learning-materials/${id}`);
                        setMaterial(res.data);
                    } catch (err) {
                        console.error('Error fetching material for logged-in user:', err);
                        // Check if it's a 404 (material not found) vs other errors
                        if (err.response?.status === 404) {
                            setError('Material not found. It may not be published or you may not have access to it.');
                        } else if (err.response?.status === 401 || err.response?.status === 403) {
                            setError('Authentication failed. Please log in again.');
                        } else {
                            setError('Failed to load material. Please try refreshing the page.');
                        }
                    }
                } else {
                    // For non-logged-in users, use public endpoint
                    try {
                        const res = await api.get(`/learning-materials/public/${id}`);
                        setMaterial(res.data);
                    } catch (err) {
                        console.error('Error fetching public material:', err);
                        if (err.response?.status === 404) {
                            setError('Material not found or not available to the public.');
                        } else {
                            setError('Failed to load material.');
                        }
                    }
                }
            } catch (err) {
                console.error('Unexpected error fetching material:', err);
                setError('An unexpected error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchMaterial();
    }, [id]);

    if (loading) {
        return (
            <div>
                <Title title="Learning Material" breadcrumb={[["Learning Centre", "/learning-centre"], "Material"]} />
                <div className="container mt-5">
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading material...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !material) {
        return (
            <div>
                <Title title="Learning Material" breadcrumb={[["Learning Centre", "/learning-centre"], "Material"]} />
                <div className="container mt-5">
                    <div className="text-center py-5">
                        <h2 className="text-muted">Material Not Found</h2>
                        <p className="text-muted">The requested learning material could not be found.</p>
                        <button className="btn" onClick={() => navigate('/learning-centre')}>
                            <FaArrowLeft className="me-1" />
                            Back to Learning Centre
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Title 
                title={material.title || "Learning Material"} 
                breadcrumb={[["Learning Centre", "/learning-centre"], material.title || "Material"]} 
            />
            <div >
                <div className="container">
                    {/* Back Button */}
                    <div className="my-2">
                        <button
                            className="btn btn-link text-decoration-none p-0 mb-3"
                            onClick={() => navigate('/learning-centre')}
                            style={{ color: '#4e368c' }}
                        >
                            <FaArrowLeft className="me-3" />
                            <span className="fw-semibold">Back to Learning Centre</span>
                        </button>
                    </div>

                    <div className="row">
                        {/* Main Content */}
                        <div className="col-lg-8">
                            <article className="bg-white rounded-4 shadow-sm p-4 p-md-5 mb-4">
                                {/* Header Section */}
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <span className="badge rounded-pill px-3 py-2 mb-3" 
                                                style={{ 
                                                    backgroundColor: material.type === 'Article' ? '#28a745' : 
                                                                   material.type === 'Video' ? '#ffc107' : 
                                                                   material.type === 'Document' ? '#17a2b8' : '#6c757d',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600'
                                                }}>
                                                {material.type || 'Material'}
                                            </span>
                                            <h1 className="display-5 fw-bold mb-3" style={{ color: '#212529', lineHeight: '1.2' }}>
                                                {material.title}
                                            </h1>
                                        </div>
                                    </div>

                                    {material.description && (
                                        <p className="lead text-muted mb-4" style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                                            {material.description}
                                        </p>
                                    )}

                                    {/* Metadata */}
                                    <div className="d-flex flex-wrap gap-4 mb-4 pb-3 border-bottom">
                                        <div className="d-flex align-items-center text-muted">
                                            <FaTag className="me-3" style={{ color: '#4e368c', fontSize: '1.1rem' }} />
                                            <span className="fw-medium">{material.category || 'Uncategorized'}</span>
                                        </div>
                                        <div className="d-flex align-items-center text-muted">
                                            <FaCalendarAlt className="me-3" style={{ color: '#4e368c', fontSize: '1.1rem' }} />
                                            <span>{new Date(material.created_at).toLocaleDateString('en-GB', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}</span>
                                        </div>
                                        {material.tags && (
                                            <div className="d-flex align-items-center text-muted">
                                                <FaUser className="me-3" style={{ color: '#4e368c', fontSize: '1.1rem' }} />
                                                <span>{material.tags}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Featured Image */}
                                {material.image_url && (
                                    <div className="mb-5">
                                        <img
                                            src={`${import.meta.env.VITE_APP_API}${material.image_url}`}
                                            alt={material.title}
                                            className="img-fluid rounded-3 shadow-sm"
                                            style={{ 
                                                width: '100%', 
                                                maxHeight: '500px', 
                                                objectFit: 'cover',
                                                border: '1px solid #e9ecef'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                {material.content && !isContentEmpty(material.content) && (
                                    <div 
                                        className="content mt-4"
                                        style={{
                                            fontSize: '1.1rem',
                                            lineHeight: '1.8',
                                            color: '#495057'
                                        }}
                                    >
                                        <div dangerouslySetInnerHTML={{ __html: material.content }} />
                                    </div>
                                )}

                                {(!material.content || isContentEmpty(material.content)) && (
                                    <div className="text-center py-5 text-muted">
                                        <p>No content available for this material.</p>
                                    </div>
                                )}

                                {/* Download Button for Downloadable Files */}
                                {material.downloadable_file_url && (
                                    <div className="mt-4">
                                        <a 
                                            className="btn btn-primary btn-lg w-100" 
                                            href={`${import.meta.env.VITE_APP_API || ''}${material.downloadable_file_url}`} 
                                            download
                                        >
                                            <i className="fa-solid fa-download me-1"></i>Download File
                                        </a>
                                    </div>
                                )}
                            </article>
                        </div>

                        {/* Sidebar */}
                        <div className="col-lg-4">
                            <div className="bg-white rounded-4 shadow-sm p-4 sticky-top" style={{ top: '100px' }}>
                                <h5 className="fw-bold mb-4" style={{ color: '#4e368c' }}>Material Information</h5>
                                
                                <div className="mb-4">
                                    <div className="d-flex align-items-start mb-3">
                                        <FaTag className="me-3 mt-1" style={{ color: '#4e368c', fontSize: '1.1rem', flexShrink: 0 }} />
                                        <div>
                                            <small className="text-muted d-block mb-1">Category</small>
                                            <span className="fw-semibold">{material.category || 'Uncategorized'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex align-items-center mb-3">
                                        <span className="badge rounded-pill px-3 py-2" 
                                            style={{ 
                                                backgroundColor: material.type === 'Article' ? '#28a745' : 
                                                               material.type === 'Video' ? '#ffc107' : 
                                                               material.type === 'Document' ? '#17a2b8' : '#6c757d',
                                                color: 'white'
                                            }}>
                                            {material.type || 'Material'}
                                        </span>
                                    </div>

                                    <div className="d-flex align-items-start mb-3">
                                        <FaCalendarAlt className="me-3 mt-1" style={{ color: '#4e368c', fontSize: '1.1rem', flexShrink: 0 }} />
                                        <div>
                                            <small className="text-muted d-block mb-1">Published</small>
                                            <span className="fw-semibold">
                                                {new Date(material.created_at).toLocaleDateString('en-GB', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {material.tags && (
                                        <div className="d-flex align-items-start">
                                            <FaUser className="me-3 mt-1" style={{ color: '#4e368c', fontSize: '1.1rem', flexShrink: 0 }} />
                                            <div>
                                                <small className="text-muted d-block mb-1">Tags</small>
                                                <span className="fw-semibold">{material.tags}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserLearningMaterialDetail;
