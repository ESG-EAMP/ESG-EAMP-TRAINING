import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import CKEditorWrapper from '../../components/CKEditorWrapper';
import { FaSave, FaEye, FaArrowLeft, FaFileAlt, FaVideo, FaDownload, FaUpload } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api, { getToken } from '../../utils/api';

function EditMaterial() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [contentType, setContentType] = useState('make-content'); // 'make-content', 'link-page', or 'downloadable-file'
    const [content, setContent] = useState('');
    const [materialData, setMaterialData] = useState({
        title: '',
        description: '',
        type: 'Article',
        category: '',
        tags: '',
        status: 'Draft',
        image_url: '',
        external_url: '',
        downloadable_file_url: '',
        isMaterialPublic: true,
        requiresAssessmentCompletion: false
    });
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [downloadableFile, setDownloadableFile] = useState(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [categories, setCategories] = useState([]);

    const handleContentTypeChange = (type) => {
        setContentType(type);
        if (type === 'link-page') {
            setContent('isexternal');
        } else if (type === 'downloadable-file') {
            setContent('isexternal');
        } else {
            setContent('');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/learning-materials-sections/');
            const data = res.data;
            const sections = Array.isArray(data) ? data : [];

            // Extract unique categories from sections
            const uniqueCategories = [...new Set(sections
                .map(section => section.category)
                .filter(category => category && category.trim() !== '')
            )].sort();

            // If no categories found, use default categories
            if (uniqueCategories.length === 0) {
                setCategories([
                    "ESG & Sustainability",
                    "Website & Platform",
                    "Resources",
                    "Certification",
                    "Financing & Incentives",
                    "ESG Champion"
                ]);
            } else {
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Fallback to default categories on error
            setCategories([
                "ESG & Sustainability",
                "Website & Platform",
                "Resources",
                "Certification",
                "Financing & Incentives",
                "ESG Champion"
            ]);
        }
    };

    useEffect(() => {
        const fetchMaterial = async () => {
            try {
                const res = await api.get(`/learning-materials/${id}`);
                const data = res.data;
                setMaterialData({
                    title: data.title || '',
                    description: data.description || '',
                    type: data.type || 'Article',
                    category: data.category || '',
                    tags: data.tags || '',
                    status: data.status || 'Draft',
                    image_url: data.image_url || '',
                    external_url: data.external_url || '',
                    downloadable_file_url: data.downloadable_file_url || '',
                    isMaterialPublic: data.isMaterialPublic !== undefined ? data.isMaterialPublic : true,
                    requiresAssessmentCompletion: data.requiresAssessmentCompletion !== undefined ? data.requiresAssessmentCompletion : false
                });
                setContent(data.content);

                // Determine content type based on existing data
                if (data.downloadable_file_url) {
                    setContentType('downloadable-file');
                } else if (data.content === 'isexternal' || (data.external_url && !data.content)) {
                    setContentType('link-page');
                } else {
                    setContentType('make-content');
                }
            } catch (error) {
                alert('Unable to load material.');
                navigate('/admin/learning-materials');
            }
        };
        fetchMaterial();
    }, [id, navigate]);

    const handleEditorChange = (event, editor, rawHtml) => {
        const data = rawHtml !== undefined ? rawHtml : editor.getData();
        setContent(data);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setMaterialData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        const updatedData = { ...materialData, content };
        try {
            await api.put(`/learning-materials/${id}`, updatedData);
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Material updated successfully!',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Navigate back with section/category preserved if available
                const sectionParam = searchParams.get('section');
                const categoryParam = searchParams.get('category') || materialData.category;
                if (sectionParam && categoryParam) {
                    navigate(`/admin/learning-materials?section=${sectionParam}&category=${encodeURIComponent(categoryParam)}`);
                } else if (categoryParam) {
                    navigate(`/admin/learning-materials?category=${encodeURIComponent(categoryParam)}`);
                } else {
                    navigate('/admin/learning-materials');
                }
            });
        } catch (error) {
            console.error('Update error:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to update material.';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    const togglePreview = () => setIsPreviewMode(!isPreviewMode);

    return (
        <div className="container-fluid">
            <Title title="Edit Learning Material" breadcrumb={[["Learning Centre", "/learning-materials"], "Edit"]} />

            <div className="row">
                <div className="col-lg-12">
                    <div className="">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-semibold ">
                                <FaFileAlt className="me-1 text-primary" />
                                Edit Content
                            </h5>
                            <div className="btn-group">
                                <button
                                    className={`btn btn-sm ${isPreviewMode ? 'btn-outline-primary' : 'btn-primary'}`}
                                    onClick={togglePreview}
                                >
                                    <FaEye className="me-1" />
                                    {isPreviewMode ? 'Edit' : 'Preview'}
                                </button>
                            </div>
                        </div>

                        {/* Content Type Selection */}
                        <div className="mb-4">
                            <label className="form-label fw-medium mb-3">Content Type</label>
                            <div className="btn-group w-100" role="group">
                                <button
                                    type="button"
                                    className={`btn ${contentType === 'make-content' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => handleContentTypeChange('make-content')}
                                >
                                    <FaFileAlt className="me-1" />
                                    Make Content
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${contentType === 'link-page' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => handleContentTypeChange('link-page')}
                                >
                                    <FaVideo className="me-1" />
                                    Link a Page
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${contentType === 'downloadable-file' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => handleContentTypeChange('downloadable-file')}
                                >
                                    <FaDownload className="me-1" />
                                    Downloadable File
                                </button>
                            </div>
                        </div>

                        {contentType === 'make-content' && (
                            <>
                                {!isPreviewMode ? (
                                    <CKEditorWrapper
                                        data={content}
                                        onChange={handleEditorChange}
                                        config={{
                                            placeholder: 'Write your learning material content here...',
                                            simpleUpload: {
                                                uploadUrl: `${import.meta.env.VITE_APP_API}/learning-materials/upload-image`,
                                                withCredentials: true,
                                                headers: {
                                                    Authorization: `Bearer ${getToken()}`
                                                }
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="border rounded p-4" style={{ minHeight: '400px' }}>
                                        <div dangerouslySetInnerHTML={{ __html: content }} />
                                    </div>
                                )}
                            </>
                        )}

                        {contentType === 'link-page' && (
                            <div className="alert alert-info">
                                <FaVideo className="me-1" />
                                <strong>External Link Mode:</strong> This material will redirect to an external URL. Please provide the external URL in the material details section.
                            </div>
                        )}

                        {contentType === 'downloadable-file' && (
                            <div className="alert alert-info">
                                <FaDownload className="me-1" />
                                <strong>Downloadable File Mode:</strong> This material will provide a downloadable file. Please upload the file in the material details section.
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-lg-12">
                    <div className="mt-5">
                        <h5 className="fw-semibold mb-3">Material Details</h5>
                        <div className="mb-3">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={materialData.title}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                name="description"
                                value={materialData.description}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Type</label>
                            <input
                                type="text"
                                className="form-control"
                                name="type"
                                value={materialData.type}
                                onChange={handleInputChange}
                                placeholder="e.g., Article, Video, Document, Infographic"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Category Section *</label>
                            <select 
                                className="form-select" 
                                name="category" 
                                value={materialData.category} 
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select category section</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {contentType === 'link-page' && (
                            <div className="mb-3">
                                <label className="form-label">External URL *</label>
                                <input
                                    type="url"
                                    className="form-control"
                                    name="external_url"
                                    value={materialData.external_url}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                    required
                                />
                                {!materialData.external_url && (
                                    <div className="form-text text-danger">
                                        External URL is required when linking to an external page.
                                    </div>
                                )}
                            </div>
                        )}

                        {contentType === 'downloadable-file' && (
                            <div className="mb-3">
                                <label className="form-label">Downloadable File *</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="*/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        
                                        setIsUploadingFile(true);
                                        const form = new FormData();
                                        form.append('file', file);
                                        form.append('user_id', localStorage.getItem('user_id') || 'unknown');
                                        form.append('folder_name', 'learning_materials_files');
                                        
                                        try {
                                            const res = await api.post('/storage/upload-file', form, {
                                                headers: {
                                                    'Content-Type': 'multipart/form-data',
                                                },
                                            });
                                            const data = res.data;
                                            setMaterialData(prev => ({ ...prev, downloadable_file_url: data.file_url }));
                                            setDownloadableFile(file);
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'File Uploaded',
                                                text: 'File uploaded successfully!',
                                                timer: 1500
                                            });
                                        } catch (err) {
                                            console.error(err);
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error',
                                                text: err.response?.data?.detail || err.message || 'Failed to upload file.'
                                            });
                                        } finally {
                                            setIsUploadingFile(false);
                                        }
                                    }}
                                    disabled={isUploadingFile}
                                />
                                {isUploadingFile && (
                                    <div className="form-text text-muted d-flex align-items-center">
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Uploading file...
                                    </div>
                                )}
                                {materialData.downloadable_file_url && (
                                    <div className="mt-2">
                                        <div className="d-flex align-items-center">
                                            <FaFileAlt className="me-1 text-primary" />
                                            <span className="text-muted">{downloadableFile?.name || 'File uploaded'}</span>
                                            <a
                                                href={`${import.meta.env.VITE_APP_API || ''}${materialData.downloadable_file_url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-sm btn-outline-primary ms-2"
                                            >
                                                <FaDownload className="me-1" />
                                                View File
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {!materialData.downloadable_file_url && (
                                    <div className="form-text text-danger">
                                        File upload is required when creating a downloadable file material.
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mb-3">
                            <label className="form-label">Tags</label>
                            <input
                                type="text"
                                className="form-control"
                                name="tags"
                                value={materialData.tags}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={materialData.isMaterialPublic !== undefined ? materialData.isMaterialPublic : true}
                                    onChange={(e) => setMaterialData({ ...materialData, isMaterialPublic: e.target.checked })}
                                    id="isMaterialPublic"
                                />
                                <label className="form-check-label" htmlFor="isMaterialPublic">
                                    Make this material public (visible to non-logged-in users)
                                </label>
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={materialData.requiresAssessmentCompletion !== undefined ? materialData.requiresAssessmentCompletion : false}
                                    onChange={(e) => setMaterialData({ ...materialData, requiresAssessmentCompletion: e.target.checked })}
                                    id="requiresAssessmentCompletion"
                                />
                                <label className="form-check-label" htmlFor="requiresAssessmentCompletion">
                                    Only viewable by MSME users who have completed at least 1 assessment
                                </label>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Cover Image</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const form = new FormData();
                                    form.append('image', file);
                                    try {
                                        const res = await api.post('/learning-materials/upload-image', form, {
                                            headers: {
                                                'Content-Type': 'multipart/form-data',
                                            },
                                        });
                                        const data = res.data;
                                        setMaterialData(prev => ({ ...prev, image_url: data.image_url }));
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to upload image');
                                    }
                                }}
                            />
                            {materialData.image_url && (
                                <div className="mt-2">
                                    <img
                                        src={`${import.meta.env.VITE_APP_API || ''}${materialData.image_url}`}
                                        alt="Cover"
                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="form-label">Status</label>
                            <div className="d-flex gap-4">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="status"
                                        id="statusDraft"
                                        value="Draft"
                                        checked={materialData.status === 'Draft'}
                                        onChange={handleInputChange}
                                    />
                                    <label className="form-check-label" htmlFor="statusDraft">
                                        Draft
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="status"
                                        id="statusPublished"
                                        value="Published"
                                        checked={materialData.status === 'Published'}
                                        onChange={handleInputChange}
                                    />
                                    <label className="form-check-label" htmlFor="statusPublished">
                                        Published
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="status"
                                        id="statusArchived"
                                        value="Archived"
                                        checked={materialData.status === 'Archived'}
                                        onChange={handleInputChange}
                                    />
                                    <label className="form-check-label" htmlFor="statusArchived">
                                        Archived
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-secondary" onClick={() => {
                                // Navigate back with section/category preserved if available
                                const sectionParam = searchParams.get('section');
                                const categoryParam = searchParams.get('category') || materialData.category;
                                if (sectionParam && categoryParam) {
                                    navigate(`/admin/learning-materials?section=${sectionParam}&category=${encodeURIComponent(categoryParam)}`);
                                } else if (categoryParam) {
                                    navigate(`/admin/learning-materials?category=${encodeURIComponent(categoryParam)}`);
                                } else {
                                    navigate('/admin/learning-materials');
                                }
                            }}>
                                <FaArrowLeft className="me-1" /> Go Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpdate}
                                disabled={
                                    !materialData.title ||
                                    (contentType === 'make-content' && !content) ||
                                    (contentType === 'link-page' && !materialData.external_url) ||
                                    (contentType === 'downloadable-file' && !materialData.downloadable_file_url)
                                }
                            >
                                <FaSave className="me-1" /> Update Material
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditMaterial;
