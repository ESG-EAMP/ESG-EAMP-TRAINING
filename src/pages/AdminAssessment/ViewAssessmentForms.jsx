import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { hasPermission, Permission } from '../../utils/permissions';

function ViewAssessmentForms() {
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDefault, setFilterDefault] = useState('all');
    const [sortBy, setSortBy] = useState('title');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        remarks: '',
        default: false
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            const response = await api.get('/assessment/admin/v2/get-all-forms');
            const data = response.data;
            console.log("Fetched forms:", data);
            setForms(Array.isArray(data) ? data : []);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load forms:", error);
            setLoading(false);
            if (error.response) {
                console.error("Error details:", error.response.data);
            }
        }
    };

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    // Filter and sort forms
    const filteredAndSortedForms = useMemo(() => {
        let filtered = forms.filter(form => {
            // Filter by search term (title, remarks)
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const title = (form.title || '').toLowerCase();
                const remarks = (form.remarks || '').toLowerCase();
                if (!title.includes(searchLower) && !remarks.includes(searchLower)) {
                    return false;
                }
            }

            // Filter by default status
            if (filterDefault !== 'all') {
                const isDefault = form.default === true;
                if (filterDefault === 'default' && !isDefault) {
                    return false;
                }
                if (filterDefault === 'non-default' && isDefault) {
                    return false;
                }
            }

            return true;
        });

        // Sort forms
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'title':
                    valueA = (a.title || '').toLowerCase();
                    valueB = (b.title || '').toLowerCase();
                    break;
                case 'questions':
                    valueA = (a.question_collection || []).length;
                    valueB = (b.question_collection || []).length;
                    break;
                case 'createdAt':
                    valueA = new Date(a.createdAt || 0).getTime();
                    valueB = new Date(b.createdAt || 0).getTime();
                    break;
                case 'updatedAt':
                    valueA = new Date(a.updatedAt || 0).getTime();
                    valueB = new Date(b.updatedAt || 0).getTime();
                    break;
                case 'default':
                    valueA = a.default ? 1 : 0;
                    valueB = b.default ? 1 : 0;
                    break;
                default:
                    valueA = (a.title || '').toLowerCase();
                    valueB = (b.title || '').toLowerCase();
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        return filtered;
    }, [forms, searchTerm, filterDefault, sortBy, sortOrder]);

    // Pagination calculations
    const totalItems = filteredAndSortedForms.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedForms = filteredAndSortedForms.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterDefault, sortBy, sortOrder]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleViewForm = (formId) => {
        navigate(`/admin/assessment/manage-v2?formId=${formId}`);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateForm = async () => {
        // Check permission before allowing create
        if (!hasPermission(Permission.CREATE_ASSESSMENT_FORMS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to create assessment forms.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        if (!formData.title.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Validation Error',
                text: 'Please enter a title',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/assessment/admin/v2/initiate-new-form', {
                title: formData.title.trim(),
                remarks: formData.remarks.trim(),
                default: formData.default
            });
            
            console.log('Form created successfully:', response.data);
            
            // Reset form and close modal
            setFormData({
                title: '',
                remarks: '',
                default: false
            });
            setShowCreateModal(false);
            
            // Refresh forms list
            await fetchForms();
            
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Form created successfully! Please edit the form to add questions.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                navigate(`/admin/assessment/manage-v2?formId=${response.data.inserted_id}`);
            });
        } catch (error) {
            console.error('Failed to create form:', error);
            const errorMessage = error.response?.data?.message || error.response?.statusText || 'Please try again.';
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Failed to create form: ${errorMessage}`
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setFormData({
            title: '',
            remarks: '',
            default: false
        });
        setShowCreateModal(false);
    };

    const handleDeleteForm = async (formId, formTitle) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_ASSESSMENTS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete assessments.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `This will permanently delete the form "${formTitle}". This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/assessment/admin/v2/delete-form/${formId}`);
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The form has been successfully deleted.',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Refresh forms list
                await fetchForms();
            } catch (error) {
                console.error('Failed to delete form:', error);
                const errorMessage = error.response?.data?.message || error.response?.statusText || 'Please try again.';
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to delete form: ${errorMessage}`
                });
            }
        }
    };

    const handleCloneForm = async (formId, formTitle) => {
        // Check permission before allowing clone
        if (!hasPermission(Permission.CREATE_ASSESSMENT_FORMS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to create assessment forms.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        try {
            const response = await api.post(`/assessment/admin/v2/clone-form/${formId}`);
            
            await Swal.fire({
                icon: 'success',
                title: 'Cloned!',
                text: `Form "${formTitle}" has been successfully cloned.`,
                timer: 2000,
                showConfirmButton: false
            });

            // Refresh forms list
            await fetchForms();
        } catch (error) {
            console.error('Failed to clone form:', error);
            const errorMessage = error.response?.data?.message || error.response?.statusText || 'Please try again.';
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Failed to clone form: ${errorMessage}`
            });
        }
    };

    const handleSetAsDefault = async (formId, formTitle, isCurrentlyDefault) => {
        if (isCurrentlyDefault) {
            await Swal.fire({
                icon: 'info',
                title: 'Already Default',
                text: `Form "${formTitle}" is already set as the default form.`,
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Set as Default?',
            text: `This will set "${formTitle}" as the default form. Any other form currently set as default will be unset.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, set as default',
            confirmButtonColor: '#28a745',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            // Check permission before allowing set as default
            if (!hasPermission(Permission.EDIT_ASSESSMENT_FORMS)) {
                Swal.fire({
                    title: 'Permission Denied',
                    text: 'You do not have permission to edit assessment forms.',
                    icon: 'error',
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            try {
                await api.put(`/assessment/admin/v2/set-as-default-form/${formId}`);
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Form "${formTitle}" has been set as the default form.`,
                    timer: 2000,
                    showConfirmButton: false
                });

                // Refresh forms list
                await fetchForms();
            } catch (error) {
                console.error('Failed to set as default:', error);
                const errorMessage = error.response?.data?.message || error.response?.statusText || 'Please try again.';
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to set as default: ${errorMessage}`
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Assessment Forms" breadcrumb={[["Assessment", "/admin/assessment/manage-v2"], "View Forms"]} />
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Assessment Forms" breadcrumb={[["Assessment", "/admin/assessment/manage-v2"], "View Forms"]} />

            {/* Filters and Controls */}
            <div className="row mb-1">
                <div className="col-lg-4 col-md-6 mb-3">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by title or remarks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={filterDefault}
                        onChange={(e) => setFilterDefault(e.target.value)}
                    >
                        <option value="all">All Forms</option>
                        <option value="default">Default Forms</option>
                        <option value="non-default">Non-Default Forms</option>
                    </select>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="title">Sort by Title</option>
                        <option value="questions">Sort by Questions Count</option>
                        <option value="createdAt">Sort by Created Date</option>
                        <option value="updatedAt">Sort by Updated Date</option>
                        <option value="default">Sort by Default Status</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div></div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <i className="fas fa-plus me-1"></i>
                            Create New Form
                        </button>
                    </div>
                </div>
            </div>

            {/* Items Per Page - Top Right */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                        <label className="form-label text-muted">Show:</label>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[10, 20, 30, 40, 50].map(size => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <span className="text-muted">entries</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="row">
                <div className="col-12">
                    <div className="table-scroll-top overflow-y-auto card shadow-sm rounded bg-white">
                        <table className="table  table-nowrap rounded">
                            <thead className="table-dark">
                                <tr>
                                    <th>No.</th>
                                    <th>Actions</th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('title')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Title
                                        {sortBy === 'title' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th>Remarks</th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('questions')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Questions
                                        {sortBy === 'questions' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('default')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Default
                                        {sortBy === 'default' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('createdAt')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Created At
                                        {sortBy === 'createdAt' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('updatedAt')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Updated At
                                        {sortBy === 'updatedAt' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                   
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedForms.map((form, index) => (
                                    <tr key={form._id || index}>
                                        <td>
                                            <span className="d-flex justify-content-center">{startIndex + index + 1}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => handleViewForm(form._id)}
                                                    title="View/Edit Form"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => handleCloneForm(form._id, form.title)}
                                                    title="Clone Form"
                                                >
                                                    <i className="fas fa-copy"></i>
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${form.default ? 'text-success' : ''}`}
                                                    onClick={() => handleSetAsDefault(form._id, form.title, form.default)}
                                                    title={form.default ? "Default Form" : "Set as Default Form"}
                                                >
                                                    <i className={`${form.default ? 'fas fa-star' : 'far fa-star'}`}></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm text-danger"
                                                    onClick={() => handleDeleteForm(form._id, form.title)}
                                                    title="Delete Form"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="fw-medium">{form.title || 'N/A'}</span>
                                        </td>
                                        <td>
                                            <div style={{ maxWidth: '300px' }}>
                                                <span className="text-truncate d-inline-block" style={{ maxWidth: '100%' }} title={form.remarks}>
                                                    {form.remarks || 'No remarks'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-info">
                                                {(form.question_collection || []).length} questions
                                            </span>
                                        </td>
                                        <td>
                                            {form.default ? (
                                                <span className="badge bg-success">
                                                    <i className="fas fa-star me-1"></i>
                                                    Default
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary">No</span>
                                            )}
                                        </td>
                                        <td>
                                            <small className="text-muted">
                                                {formatDate(form.createdAt)}
                                            </small>
                                        </td>
                                        <td>
                                            <small className="text-muted">
                                                {formatDate(form.updatedAt)}
                                            </small>
                                        </td>
                                       
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalItems === 0 && (
                        <div className="text-center py-5">
                            <i className="fas fa-search fa-3x text-muted mb-3"></i>
                            <h5>No forms found</h5>
                            <p className="text-muted">Try adjusting your search criteria or filters.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Per Page - Top Right */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                        <label className="form-label text-muted">Show:</label>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            {[10, 20, 30, 40, 50].map(size => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <span className="text-muted">entries</span>
                    </div>
                </div>
            </div>


            {/* Pagination - Bottom Center */}
            {totalPages > 1 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <nav aria-label="Forms pagination">
                            <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                        </li>

                                        {(() => {
                                            const pages = [];
                                            const maxVisiblePages = 5;
                                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                            if (endPage - startPage + 1 < maxVisiblePages) {
                                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                            }

                                            if (startPage > 1) {
                                                pages.push(
                                                    <li key={1} className="page-item">
                                                        <button className="page-link" onClick={() => setCurrentPage(1)}>
                                                            1
                                                        </button>
                                                    </li>
                                                );
                                                if (startPage > 2) {
                                                    pages.push(
                                                        <li key="ellipsis-start" className="page-item disabled">
                                                            <span className="page-link">...</span>
                                                        </li>
                                                    );
                                                }
                                            }

                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(
                                                    <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(i)}>
                                                            {i}
                                                        </button>
                                                    </li>
                                                );
                                            }

                                            if (endPage < totalPages) {
                                                if (endPage < totalPages - 1) {
                                                    pages.push(
                                                        <li key="ellipsis-end" className="page-item disabled">
                                                            <span className="page-link">...</span>
                                                        </li>
                                                    );
                                                }
                                                pages.push(
                                                    <li key={totalPages} className="page-item">
                                                        <button className="page-link" onClick={() => setCurrentPage(totalPages)}>
                                                            {totalPages}
                                                        </button>
                                                    </li>
                                                );
                                            }

                                            return pages;
                                        })()}

                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                        </div>
                    </div>
                )}

            {/* Create New Form Modal */}
            <div 
                className={`modal fade ${showCreateModal ? 'show d-block' : ''}`} 
                tabIndex="-1" 
                style={{ backgroundColor: showCreateModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}
                onClick={handleCloseModal}
            >
                <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Create New Form</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={handleCloseModal}
                                disabled={submitting}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Title <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter form title"
                                    disabled={submitting}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Remarks</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Enter remarks (optional)"
                                    disabled={submitting}
                                ></textarea>
                            </div>
                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="default"
                                        id="defaultCheck"
                                        checked={formData.default}
                                        onChange={handleInputChange}
                                        disabled={submitting}
                                    />
                                    <label className="form-check-label" htmlFor="defaultCheck">
                                        Set as default form
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-outline-secondary" 
                                onClick={handleCloseModal}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={handleCreateForm}
                                disabled={submitting}
                            >
                                {submitting ? (
                                   'Create Form...'
                                ) : (
                                    'Create Form'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewAssessmentForms;
