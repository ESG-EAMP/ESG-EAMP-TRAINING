import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaExternalLinkAlt, FaEdit, FaArrowLeft } from 'react-icons/fa';
import api, { API_BASE } from '../../utils/api';

const LearningMaterialsSectionPreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [section, setSection] = useState(null);

    useEffect(() => {
        const fetchSection = async () => {
            try {
                const res = await api.get(`/learning-materials-sections/${id}`);
                const data = res.data;
                setSection(data);
            } catch (err) {
                console.error(err);
                alert('Failed to load section details.');
                navigate('/admin/learning-materials-sections/');
            }
        };
        fetchSection();
    }, [id, navigate]);

    const getCategoryColor = (category) => {
        const colors = {
            "ESG & Sustainability": "success",
            "Website & Platform": "primary",
            "Resources": "info",
            "Certification": "warning",
            "Financing & Incentives": "secondary",
            "ESG Champion": "danger"
        };
        return colors[category] || 'light';
    };

    return (
        <div className="container-fluid">
            <Title
                title="Section Preview"
                breadcrumb={[['Learning Centre', '/admin/learning-materials'], ['Sections', '/admin/learning-materials-sections/'], 'Preview']}
            />

            <div className="row py-5">
                <div className="container">
                    {section ? (
                        <div className="row justify-content-center">
                            <div className="col-lg-8">
                                <div className="card h-100 border-0 shadow-sm rounded-4 p-4">
                                    {section.image_url && (
                                        <img
                                            src={`${API_BASE}${section.image_url}`}
                                            alt={section.title}
                                            className="mb-4 w-100"
                                            style={{
                                                maxHeight: '300px',
                                                objectFit: 'contain',
                                                borderRadius: '4px',
                                            }}
                                        />
                                    )}

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className={`badge bg-${getCategoryColor(section.category)} px-3 py-2 rounded-pill`}>
                                            {section.category}
                                        </span>
                                        <span className={`badge ${section.status === 'Published' ? 'bg-success' : section.status === 'Draft' ? 'bg-warning' : 'bg-secondary'}`}>
                                            {section.status}
                                        </span>
                                    </div>

                                    <h3 className="fw-bold mb-3">{section.title}</h3>

                                    {section.description && (
                                        <p className="text-muted mb-4 fs-5">{section.description}</p>
                                    )}

                                    {/* <div className="mb-4">
                                        <h5 className="fw-semibold mb-3">Content:</h5>
                                        <div
                                            className="text-muted"
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: '1.6',
                                                fontSize: '1.1rem'
                                            }}
                                        >
                                            {section.content}
                                        </div>
                                    </div> */}

                                    {section.external_url && (
                                        <div className="mb-4">
                                            <h5 className="fw-semibold mb-3">External Link:</h5>
                                            <a
                                                href={section.external_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline-primary"
                                            >
                                                <FaExternalLinkAlt className="me-1" />
                                                Visit External Resource
                                            </a>
                                        </div>
                                    )}

                                    <div className="d-flex gap-2 mt-4">
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate(`/admin/learning-materials-sections/edit/${section.id}`)}
                                        >
                                            <FaEdit className="me-1" />
                                            Edit Section
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/admin/learning-materials')}
                                        >
                                            <FaArrowLeft className="me-1" />
                                            Back to Sections
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted">Loading section details...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LearningMaterialsSectionPreview;


