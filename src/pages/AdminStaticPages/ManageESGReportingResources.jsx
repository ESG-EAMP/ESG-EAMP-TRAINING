import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaPlus, FaEdit, FaTrashAlt, FaSave, FaTimes, FaUpload } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { hasPermission, Permission } from '../../utils/permissions';

function ManageESGReportingResources() {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Guide',
        status: 'Published',
        content: '',
        image_url: '',
        downloadable_file_url: '',
        order: 0
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [downloadableFile, setDownloadableFile] = useState(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const res = await api.get('/esg-reporting-resources/');
            setResources(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching resources:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch resources.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File Type',
                text: 'Please upload an image file (JPEG, PNG, GIF, or WebP).'
            });
            return;
        }

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', file);

            const res = await api.post('/esg-reporting-resources/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFormData(prev => ({ ...prev, image_url: res.data.image_url }));
            setImageFile(file);
            Swal.fire({
                icon: 'success',
                title: 'Image Uploaded',
                text: 'Image has been uploaded successfully.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error uploading image:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.response?.data?.detail || 'Failed to upload image.'
            });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploadingFile(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/esg-reporting-resources/upload-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFormData(prev => ({ ...prev, downloadable_file_url: res.data.file_url }));
            setDownloadableFile(file);
            Swal.fire({
                icon: 'success',
                title: 'File Uploaded',
                text: 'File has been uploaded successfully.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error uploading file:', error);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: error.response?.data?.detail || 'Failed to upload file.'
            });
        } finally {
            setUploadingFile(false);
        }
    };

    const handleEdit = (resource) => {
        setEditingId(resource.id);
        setFormData({
            title: resource.title || '',
            description: resource.description || '',
            category: resource.category || 'Guide',
            status: resource.status || 'Published',
            content: resource.content || '',
            image_url: resource.image_url || '',
            downloadable_file_url: resource.downloadable_file_url || '',
            order: resource.order || 0
        });
        setImageFile(null);
        setDownloadableFile(null);
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({
            title: '',
            description: '',
            category: 'Guide',
            status: 'Published',
            content: '',
            image_url: '',
            downloadable_file_url: '',
            order: 0
        });
        setImageFile(null);
        setDownloadableFile(null);
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Title is required.'
            });
            return;
        }

        // Check permission before allowing save
        if (!hasPermission(Permission.MANAGE_STATIC_PAGES)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to manage static pages.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        try {
            if (editingId) {
                await api.put(`/esg-reporting-resources/${editingId}`, formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Resource has been updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await api.post('/esg-reporting-resources/', formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'Resource has been created successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            handleCancel();
            fetchResources();
        } catch (error) {
            console.error('Error saving resource:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || 'Failed to save resource.'
            });
        }
    };

    const handleDelete = async (id) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_CONTENT)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete content.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/esg-reporting-resources/${id}`);
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Resource has been deleted.',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchResources();
            } catch (error) {
                console.error('Error deleting resource:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete resource.'
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Manage ESG Reporting Resources" breadcrumb={[["Pages", "/admin/pages"], "ESG Reporting Resources"]} />
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
            <Title title="Manage ESG Reporting Resources" breadcrumb={[["Pages", "/admin/pages"], "ESG Reporting Resources"]} />

            <div className="row mb-3">
                <div className="col-12 d-flex justify-content-between align-items-center">
                    <h5 className="">ESG Reporting Resources ({resources.length})</h5>
                    {!isCreating && !editingId && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsCreating(true)}
                        >
                            <FaPlus className="me-1" />
                            Add Resource
                        </button>
                    )}
                </div>
            </div>

            {(isCreating || editingId) && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="">{editingId ? 'Edit Resource' : 'Create New Resource'}</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Title *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter title"
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label fw-medium">Category</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    placeholder="Guide"
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label fw-medium">Status</label>
                                <select
                                    className="form-control"
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Published">Published</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium">Description</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter description"
                            />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Cover Image</label>
                                {formData.image_url ? (
                                    <div className="mb-2">
                                        <img
                                            src={`${import.meta.env.VITE_APP_API}${formData.image_url}`}
                                            alt="Cover"
                                            className="img-thumbnail"
                                            style={{ maxHeight: '200px', maxWidth: '100%' }}
                                        />
                                        <div className="mt-2">
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                                            >
                                                <FaTimes className="me-1" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                        />
                                        {uploadingImage && (
                                            <div className="mt-2">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="visually-hidden">Uploading...</span>
                                                </div>
                                                <span className="ms-2">Uploading...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-medium">Downloadable File</label>
                                {formData.downloadable_file_url ? (
                                    <div className="mb-2">
                                        <div className="alert alert-info">
                                            <FaUpload className="me-1" />
                                            File uploaded
                                        </div>
                                        <div>
                                            <a
                                                href={`${import.meta.env.VITE_APP_API}${formData.downloadable_file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-info me-1"
                                            >
                                                View File
                                            </a>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setFormData(prev => ({ ...prev, downloadable_file_url: '' }))}
                                            >
                                                <FaTimes className="me-1" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="file"
                                            className="form-control"
                                            onChange={handleFileUpload}
                                            disabled={uploadingFile}
                                        />
                                        {uploadingFile && (
                                            <div className="mt-2">
                                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                    <span className="visually-hidden">Uploading...</span>
                                                </div>
                                                <span className="ms-2">Uploading...</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-medium">Order</label>
                            <input
                                type="number"
                                className="form-control"
                                value={formData.order}
                                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                                placeholder="0"
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-success"
                                onClick={handleSave}
                            >
                                <FaSave className="me-1" />
                                Save
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={handleCancel}
                            >
                                <FaTimes className="me-1" />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col-12">
                    <div className="table-scroll-top overflow-y-auto card">
                        {resources.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                                <h5>No resources found</h5>
                                <p className="text-muted">Click "Add Resource" to create one.</p>
                            </div>
                        ) : (
                            <table className="table table-nowrap rounded">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Order</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Image</th>
                                        <th>File</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resources
                                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                                        .map((resource) => (
                                            <tr key={resource.id}>
                                                <td>
                                                    <span className="d-flex justify-content-center">{resource.order || 0}</span>
                                                </td>
                                                <td>
                                                    <strong>{resource.title}</strong>
                                                </td>
                                                <td>
                                                    <small className="text-muted">{resource.category || 'N/A'}</small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        resource.status === 'Published' ? 'bg-success' :
                                                        resource.status === 'Draft' ? 'bg-warning' :
                                                        'bg-secondary'
                                                    }`}>
                                                        {resource.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {resource.image_url ? (
                                                        <img
                                                            src={`${import.meta.env.VITE_APP_API}${resource.image_url}`}
                                                            alt={resource.title}
                                                            style={{ maxHeight: '50px', maxWidth: '50px', objectFit: 'cover' }}
                                                            className="img-thumbnail"
                                                        />
                                                    ) : (
                                                        <span className="text-muted">
                                                            <small>No image</small>
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {resource.downloadable_file_url ? (
                                                        <span className="badge bg-info">Yes</span>
                                                    ) : (
                                                        <span className="text-muted">
                                                            <small>No</small>
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-primary me-1"
                                                        onClick={() => handleEdit(resource)}
                                                        disabled={isCreating || editingId}
                                                        title="Edit Resource"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(resource.id)}
                                                        disabled={isCreating || editingId}
                                                        title="Delete Resource"
                                                    >
                                                        <FaTrashAlt />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageESGReportingResources;
