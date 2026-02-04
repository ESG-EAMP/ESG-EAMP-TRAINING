import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import { FaTrashAlt, FaEdit, FaPlus, FaSearch, FaQuestionCircle, FaChartBar } from 'react-icons/fa';
import api, { API_BASE } from '../../utils/api';
import Swal from 'sweetalert2';
import { hasPermission, Permission } from '../../utils/permissions';

function FaqManagement() {
    const [faqs, setFaqs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentFaq, setCurrentFaq] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchFaqs = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterCategory) params.append('category', filterCategory);
        if (filterStatus) params.append('status', filterStatus);

        api.get(`/faq/get-faq-list?${params.toString()}`)
            .then(res => setFaqs(res.data.faqs || res.data || []))
            .catch((error) => {
                console.error("Failed to fetch FAQs:", error);
                setFaqs([]);
            });
    };

    useEffect(() => {
        fetchFaqs();
    }, [searchTerm, filterCategory, filterStatus]);

    // Reset pagination when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus]);

    const handleDelete = async (id) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_FAQS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete FAQs.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this FAQ?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/faq/${id}`);
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'FAQ has been deleted.',
                timer: 1500,
                showConfirmButton: false
            });
            fetchFaqs();
        } catch (error) {
            console.error("Failed to delete FAQ:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Delete failed.'
            });
        }
    };

    const handleEdit = (faq) => {
        setCurrentFaq(faq);
        setShowModal(true);
    };

    const handleAddNew = () => {
        setCurrentFaq({
            id: null,
            title: '',
            category: 'General',
            answer: '',
            status: 'Draft',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        // Check permission before allowing save
        if (!hasPermission(Permission.MANAGE_FAQS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to manage FAQs.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        try {
            if (currentFaq.id) {
                // Update existing FAQ
                await api.put(`/faq/${currentFaq.id}`, currentFaq);
            } else {
                // Add new FAQ
                await api.post('/faq/create-faq', currentFaq);
            }
            // After save, refetch FAQs to update the list
            fetchFaqs();
            setShowModal(false);
        } catch (error) {
            console.error("Failed to save FAQ:", error);
            let errorMessage = 'Failed to save FAQ. Please try again.';
            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentFaq({
            ...currentFaq,
            [name]: value
        });
    };

    const countByStatus = (status) => {
        if (!Array.isArray(faqs)) return 0;
        return faqs.filter(f => f.status === status).length;
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Published': 'badge bg-success',
            'Draft': 'badge bg-warning text-dark'
        };
        return <span className={badges[status]}>{status}</span>;
    };

    const getCategoryBadge = (category) => {
        const colors = {
            'General': 'primary',
            'Assessment': 'info',
            'Goals': 'success'
        };
        return <span className={`badge bg-${colors[category] || 'secondary'}`}>{category}</span>;
    };

    // Pagination logic
    const totalPages = Math.ceil(faqs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFaqs = faqs.slice(startIndex, endIndex);

    // Pagination handlers
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    return (
        <div className="container-fluid">
            <Title title="Admin Support / FAQ Management" breadcrumb={[['Admin Support', '/faq-management'], 'FAQ Management']} />
            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="bg-white p-2 rounded shadow-sm border-start border-primary border-4">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <FaQuestionCircle className="fs-2 text-primary" />
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h6 className="text-muted mb-1">Published FAQs</h6>
                                <h3 className=" fw-bold">{countByStatus('Published')}</h3>
                                <small className="text-success">Active for users</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="bg-white p-2 rounded shadow-sm border-start border-warning border-4">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <FaQuestionCircle className="fs-2 text-warning" />
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h6 className="text-muted mb-1">Draft FAQs</h6>
                                <h3 className=" fw-bold">{countByStatus('Draft')}</h3>
                                <small className="text-muted">Not visible to users</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Search and Filters */}
            <div className="mb-4">
                <div className="row align-items-center">
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <FaSearch className="text-muted" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search FAQs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="General">General</option>
                            <option value="Assessment">Assessment</option>
                            <option value="Goals">Goals</option>
                        </select>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>
                    {hasPermission(Permission.MANAGE_FAQS) && (
                        <div className="col-md-2">
                            <button className="btn btn-primary w-100" onClick={handleAddNew}>
                                <FaPlus className="me-1" />
                                Add New
                            </button>
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
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
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

            {/* FAQs Table */}
            <div className="">
                <div className="mb-3">
                    <h5 className="fw-semibold ">Frequently Asked Questions ({faqs.length})</h5>
                </div>
                <div className=" table-scroll-top overflow-y-auto card">
                    <table className="table  table-hover ">
                        <thead className="table-dark">
                            <tr>
                                <th>No.</th>
                                <th>Actions</th>
                                <th>Question</th>
                                <th>Category</th>
                                <th>Answer Preview</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentFaqs.map((faq, index) => (
                                <tr key={faq.id} className="align-middle">
                                    <td>
                                        <span className="text-muted">{startIndex + index + 1}</span>
                                    </td>
                                    <td>
                                        {hasPermission(Permission.DELETE_FAQS) && (
                                            <button
                                                className="btn btn-sm text-danger"
                                                onClick={() => handleDelete(faq.id)}
                                                title="Delete FAQ"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        )}
                                        {hasPermission(Permission.MANAGE_FAQS) && (
                                            <button
                                                className="btn btn-sm me-1"
                                                onClick={() => handleEdit(faq)}
                                                title="Edit FAQ"
                                            >
                                                <FaEdit />
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <h6 className="mb-1 fw-semibold">{faq.title}</h6>
                                        <small className="text-muted d-none">ID: {faq.id}</small>
                                    </td>
                                    <td>
                                        {getCategoryBadge(faq.category)}
                                    </td>
                                    <td>
                                        <span className="text-muted">
                                            {faq.answer && faq.answer.length > 50 ? `${faq.answer.substring(0, 50)}...` : (faq.answer || 'N/A')}
                                        </span>
                                    </td>
                                    <td>
                                        {getStatusBadge(faq.status)}
                                    </td>
                                </tr>
                            ))}
                            {currentFaqs.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-5">
                                        No FAQs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination - Bottom Center */}
            {totalPages > 1 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <nav aria-label="FAQs pagination">
                            <ul className="pagination justify-content-center">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="fas fa-chevron-left"></i>
                                        </button>
                                    </li>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}

                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(currentPage + 1)}
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

            {/* Add/Edit Modal */}
            <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{currentFaq?.id ? 'Edit FAQ' : 'Add New FAQ'}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Question Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="title"
                                    value={currentFaq?.title || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter the question"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    name="category"
                                    value={currentFaq?.category || 'General'}
                                    onChange={handleInputChange}
                                >
                                    <option value="General">General</option>
                                    <option value="Assessment">Assessment</option>
                                    <option value="Goals">Goals</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Answer</label>
                                <textarea
                                    className="form-control"
                                    rows="5"
                                    name="answer"
                                    value={currentFaq?.answer || ''}
                                    onChange={handleInputChange}
                                    placeholder="Enter the detailed answer"
                                ></textarea>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    name="status"
                                    value={currentFaq?.status || 'Draft'}
                                    onChange={handleInputChange}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Published">Published</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FaqManagement;