import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import CKEditorWrapper from '../../components/CKEditorWrapper';
import { FaSave, FaEye, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api, { getToken } from '../../utils/api';

function ManageRegistrationTC() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPage();
    }, []);

    const fetchPage = async () => {
        try {
            setLoading(true);
            const res = await api.get('/static-pages/admin/registration_tc');
            const data = res.data;
            setTitle(data.title || 'Registration Terms & Conditions');
            setContent(data.content || '');
        } catch (error) {
            console.error('Error fetching page:', error);
            // If page doesn't exist, use defaults
            setTitle('Registration Terms & Conditions');
            setContent('');
        } finally {
            setLoading(false);
        }
    };

    const handleEditorChange = (event, editor, rawHtml) => {
        const data = rawHtml !== undefined ? rawHtml : editor.getData();
        setContent(data);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Title is required.'
            });
            return;
        }

        try {
            setSaving(true);
            await api.post('/static-pages/', {
                page_type: 'registration_tc',
                title: title.trim(),
                content: content
            });

            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: 'Registration Terms & Conditions have been saved successfully.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error saving page:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to save Registration Terms & Conditions.';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        } finally {
            setSaving(false);
        }
    };

    const togglePreview = () => {
        setIsPreviewMode(!isPreviewMode);
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Manage Registration T&C" breadcrumb={[["Pages", "/admin/pages"], "Registration T&C"]} />
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Manage Registration T&C" breadcrumb={[["Pages", "/admin/pages"], "Registration T&C"]} />

            <div className="row">
                <div className="col-lg-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="">Registration Terms & Conditions Content</h5>
                            <div className="btn-group" role="group">
                                <button
                                    className={`btn btn-sm ${isPreviewMode ? 'btn-outline-primary' : 'btn-primary'}`}
                                    onClick={togglePreview}
                                >
                                    <FaEye className="me-1" />
                                    {isPreviewMode ? 'Edit' : 'Preview'}
                                </button>
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    <FaSave className="me-1" />
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => navigate('/admin/pages')}
                                >
                                    <FaArrowLeft className="me-1" />
                                    Back
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label fw-medium">Page Title *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter page title"
                                />
                            </div>

                            {!isPreviewMode ? (
                                <div className="mb-3">
                                    <label className="form-label fw-medium">Content</label>
                                    <CKEditorWrapper
                                        data={content}
                                        onChange={handleEditorChange}
                                        config={{
                                            placeholder: 'Enter Registration Terms & Conditions content here...',
                                            simpleUpload: {
                                                uploadUrl: `${import.meta.env.VITE_APP_API}/learning-materials/upload-image`,
                                                withCredentials: true,
                                                headers: {
                                                    Authorization: `Bearer ${getToken()}`
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="border rounded p-4 bg-light" style={{ minHeight: '200px' }}>
                                    <div dangerouslySetInnerHTML={{ __html: content }} />
                                    {!content && (
                                        <div className="text-muted text-center py-5">
                                            <p>No content to preview. Start writing in edit mode.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageRegistrationTC;
