import React, { useRef, useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import { Link } from 'react-router-dom';
import { LearningMaterials } from '../Landing';
import api from '../../utils/api';
import Empty from '../../components/Empty';

function UserLearningCenter() {
    const featuredArticlesRef = useRef(null);
    const esgGuideRef = useRef(null);
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(true);

    useEffect(() => {
        fetchESGReportingResources();
    }, []);

    const fetchESGReportingResources = async () => {
        try {
            setLoadingResources(true);
            const res = await api.get('/esg-reporting-resources/public');
            setResources(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching ESG Reporting Resources:', error);
            setResources([]);
        } finally {
            setLoadingResources(false);
        }
    };

    const scrollToSection = (ref) => {
        if (ref.current) {
            window.scrollTo({
                top: ref.current.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="container-fluid">
            <Title
                title="Learning Centre"
                breadcrumb={[["Learning Centre", "/learning-centre"], "Learning Centre"]}
            />

            {/* Hero Section */}
            <div className="row">
                <div className="col-12">
                    <div
                        className="rounded-4 position-relative overflow-hidden"
                        style={{
                            minHeight: '280px',
                            position: 'relative'
                        }}
                    >
                        {/* Background Pattern */}
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '300px',
                                height: '300px',
                            }}
                        />

                        <div className="d-flex flex-column h-100 position-relative">
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-3">                                    
                                    <div>
                                        <h1 className="mb-2 fw-bold" style={{ fontSize: '2.5rem' }}>
                                            START YOUR ESG JOURNEY HERE
                                        </h1>
                                        <p className=" fs-5 opacity-90">
                                            Discover comprehensive resources to help your business implement sustainable practices and achieve ESG excellence
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Navigation Buttons */}
                            <div className="d-flex gap-3 mt-4">
                                <button
                                    onClick={() => scrollToSection(featuredArticlesRef)}
                                    className="btn btn-light btn-lg px-4 py-3 rounded-pill shadow-sm"
                                >
                                    <i className="fa-solid fa-book me-1"></i> Featured Articles
                                </button>
                                <button
                                    onClick={() => scrollToSection(esgGuideRef)}
                                    className="btn btn-primary btn-lg border rounded-pill font-weight-bold"

                                    
                                >
                                    <i className="fa-solid fa-pencil me-1"></i> <strong>ESG Quick Guide for MSMEs</strong>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div ref={featuredArticlesRef}>
                <LearningMaterials landing={false} />
            </div>

            {/* ESG Report Guide Section */}
            <div
                ref={esgGuideRef}
                className="row"
            >
                <div className="container">
                    <div className="row">
                        <div className="col-12 mb-3 text-center">
                            <div className="d-inline-block p-3 rounded-circle bg-success mb-3">
                                <i className="fas fa-download text-white fa-2x"></i>
                            </div>
                            <h2 className="mb-3 fw-bold text-success">ESG Reporting Resources</h2>
                        </div>
                    </div>

                    {loadingResources ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="text-center py-5">
                            {/* <Empty title="No ESG Reporting Resources available yet." /> */}
                        </div>
                    ) : (
                        <div className="row g-4">
                            {resources.map((resource) => (
                                <div key={resource.id} className="col-lg-4 col-md-6">
                                    <div
                                        className="card h-100 border rounded-4 shadow overflow-hidden"
                                        style={{
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-8px)';
                                            e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
                                        }}
                                    >
                                        {resource.image_url && (
                                            <div className="position-relative">
                                                <img
                                                    className="card-img-top"
                                                    src={`${import.meta.env.VITE_APP_API}${resource.image_url}`}
                                                    alt={resource.title}
                                                    style={{
                                                        height: '250px',
                                                        objectFit: 'cover',
                                                        transition: 'transform 0.3s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="card-body p-4 d-flex flex-column">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <span
                                                    className="badge rounded-pill"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #28a745, #20c997)',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {resource.category || 'Guide'}
                                                </span>
                                            </div>
                                            <h4 className="card-title fw-bold mb-3" style={{ lineHeight: '1.4' }}>
                                                {resource.title}
                                            </h4>
                                            <p className="card-text text-muted mb-4 flex-grow-1" style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>
                                                {resource.description || resource.content || 'No description available.'}
                                            </p>
                                            {resource.downloadable_file_url && (
                                                <a
                                                    href={`${import.meta.env.VITE_APP_API}${resource.downloadable_file_url}`}
                                                    className="btn btn-success rounded-pill fw-semibold"
                                                    download
                                                    style={{
                                                        transition: 'all 0.3s ease',
                                                        background: 'linear-gradient(135deg, #28a745, #20c997)',
                                                        border: 'none'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 8px 25px rgba(40, 167, 69, 0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.2)';
                                                    }}
                                                >
                                                    <i className="fa-solid fa-download me-1"></i>
                                                    Download
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserLearningCenter;