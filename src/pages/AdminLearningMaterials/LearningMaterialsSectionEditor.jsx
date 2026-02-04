import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../utils/api';

function LearningMaterialsSectionEditor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const isEditMode = !!id;

    const [sectionData, setSectionData] = useState({
        title: '',
        description: '',
        content: '',
        category: '',
        status: 'Published',
        order: 0,
        external_url: '',
    });

    const categories = [
        "ESG & Sustainability",
        "Website & Platform",
        "Resources",
        "Certification",
        "Financing & Incentives",
        "ESG Champion"
    ];

    useEffect(() => {
        if (isEditMode) {
            const fetchSection = async () => {
                try {
                    const res = await api.get(`/learning-materials-sections/${id}`);
                    const data = res.data;
                    const title = data.title || '';
                    setSectionData({
                        title: title,
                        description: data.description || '',
                        content: data.content || '',
                        category: title || 'ESG & Sustainability',
                        status: data.status || 'Published',
                        order: data.order || 0,
                        external_url: data.external_url || '',
                    });
                } catch (error) {
                    console.error(error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to load section.'
                    });
                    navigate('/admin/learning-materials-sections/');
                }
            };
            fetchSection();
        }
    }, [id, isEditMode, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSectionData(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-sync category with title when title changes
            if (name === 'title') {
                updated.category = value;
            }
            return updated;
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSectionData((prev) => ({
            ...prev,
            imageFile: file
        }));
    };

    const handleSave = async () => {
        const method = isEditMode ? 'PUT' : 'POST';
        const url = isEditMode
            ? `${import.meta.env.VITE_APP_API}/learning-materials-sections/${id}`
            : `${import.meta.env.VITE_APP_API}/learning-materials-sections/`;

        const formData = new FormData();
        formData.append('title', sectionData.title);
        formData.append('description', sectionData.description);
        formData.append('content', sectionData.content);
        formData.append('category', sectionData.category);
        formData.append('status', sectionData.status);
        formData.append('order', sectionData.order.toString());
        formData.append('external_url', sectionData.external_url || '');
        if (sectionData.imageFile) {
            formData.append('image', sectionData.imageFile);
        }

        try {
            const apiMethod = isEditMode ? api.put : api.post;
            const apiUrl = isEditMode
                ? `/learning-materials-sections/${id}`
                : '/learning-materials-sections/';
            await apiMethod(apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Section saved successfully!'
            });
            navigate('/admin/learning-materials');
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save section.'
            });
        }
    };

    return (
        <div className="container-fluid">
            <Title
                title={isEditMode ? "Edit Learning Centre Section" : "Create Learning Centre Section"}
                breadcrumb={[["Learning Centre", "/admin/learning-materials"], ["Sections", "/admin/learning-materials-sections"], isEditMode ? "Edit" : "Create"]}
            />

            <div className="row">
                <div className="col-lg-12">
                    <div className="">
                        <div className="mb-3">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={sectionData.title}
                                onChange={handleInputChange}
                                placeholder="Enter section title"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                name="description"
                                value={sectionData.description}
                                onChange={handleInputChange}
                                placeholder="Brief description of the section"
                            />
                        </div>

                        <div className="mb-3 d-none">
                            <label className="form-label">Content</label>
                            <textarea
                                className="form-control"
                                rows="8"
                                name="content"
                                value={sectionData.content}
                                onChange={handleInputChange}
                                placeholder="Detailed content for this section"
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 d-none">
                                <div className="mb-3">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        name="category"
                                        value={sectionData.category}
                                        onChange={handleInputChange}
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        name="status"
                                        value={sectionData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Published">Published</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Archived">Archived</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Order</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="order"
                                        value={sectionData.order}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="col-md-6 d-none">
                                <div className="mb-3">
                                    <label className="form-label">Image</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        name="imageFile"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-3 d-none">
                            <label className="form-label">External URL</label>
                            <input
                                type="url"
                                className="form-control"
                                name="external_url"
                                value={sectionData.external_url}
                                onChange={handleInputChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                                <FaArrowLeft className="me-1" /> Back
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                <FaSave className="me-1" /> Save
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LearningMaterialsSectionEditor;


