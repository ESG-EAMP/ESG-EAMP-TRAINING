import React, { useEffect, useState } from 'react';
import Title from '../../layouts/Title/Title';
import { FaStar, FaRegTrashAlt, FaDownload, FaSearch, FaFilter, FaSort, FaReply } from 'react-icons/fa';
import api from '../../utils/api';
import Swal from 'sweetalert2';
import { hasPermission, Permission } from '../../utils/permissions';
import './Feedback.css';

function Feedback() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        api.get('/feedback/get-feedback-list')
            .then(response => {
                const data = response.data;
                console.log('Feedback data:', data);
                // Ensure data is an array
                if (Array.isArray(data)) {
                    setFeedbacks(data);
                    setFilteredFeedbacks(data);
                } else {
                    console.error('Invalid feedback data format:', data);
                    setFeedbacks([]);
                    setFilteredFeedbacks([]);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching feedbacks:', error);
                setFeedbacks([]);
                setFilteredFeedbacks([]);
                setLoading(false);
            });
    }, []);

    // Filter and sort feedbacks whenever filters change
    useEffect(() => {
        let filtered = [...feedbacks];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(fb =>
                (fb.firm_name && fb.firm_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (fb.email && fb.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (fb.message && fb.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (fb.first_name && fb.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (fb.last_name && fb.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Rating filter
        if (filterRating) {
            filtered = filtered.filter(fb => fb.rating === parseInt(filterRating));
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.date?.$date || a.date);
                    bValue = new Date(b.date?.$date || b.date);
                    break;
                case 'rating':
                    aValue = a.rating || 0;
                    bValue = b.rating || 0;
                    break;
                case 'name':
                    aValue = (a.firm_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || '').toLowerCase();
                    bValue = (b.firm_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email || '').toLowerCase();
                    break;
                default:
                    aValue = new Date(a.date?.$date || a.date);
                    bValue = new Date(b.date?.$date || b.date);
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredFeedbacks(filtered);
    }, [feedbacks, searchTerm, filterRating, sortBy, sortOrder]);

    const handleDownloadAll = () => {
        // Create CSV content
        const headers = ['Name', 'Date', 'Rating', 'Message', 'Email'];
        const csvContent = [
            headers.join(','),
            ...filteredFeedbacks.map(fb => [
                `"${fb.firm_name || `${fb.first_name || ''} ${fb.last_name || ''}`.trim() || fb.email || 'Anonymous User'}"`,
                `"${fb.date ? (new Date(fb.date.$date || fb.date)).toLocaleDateString() : '-'}"`,
                fb.rating || 0,
                `"${(fb.message || '').replace(/"/g, '""')}"`,
                `"${fb.email || ''}"`
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `feedback_reviews_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (id) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.MANAGE_FEEDBACK)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete feedback.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const confirmDelete = window.confirm('Are you sure you want to delete this feedback?');
        if (confirmDelete) {
            try {
                await api.delete(`/feedback/${id}`);
                // After delete, refetch feedbacks to update the list
                const response = await api.get('/feedback/get-feedback-list');
                const data = response.data;
                if (Array.isArray(data)) {
                    setFeedbacks(data);
                    setFilteredFeedbacks(data);
                } else {
                    setFeedbacks([]);
                    setFilteredFeedbacks([]);
                }
            } catch (error) {
                console.error('Error deleting feedback:', error);
            }
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRating('');
        setSortBy('date');
        setSortOrder('desc');
    };

    const handleReply = (email) => {
        window.open(`mailto:${email}?subject=Regarding your feedback`, '_blank');
    };

    const getDisplayName = (fb) => {
        if (fb.firm_name) return fb.firm_name;
        if (fb.first_name || fb.last_name) {
            return `${fb.first_name || ''} ${fb.last_name || ''}`.trim();
        }
        return fb.email || 'Anonymous User';
    };

    return (
        <div className="container-fluid">
            <Title title="Admin Support / User Messages" breadcrumb={[["Admin Support", "/faq-management"], "User Messages"]} />

            {/* Search and Filters */}
            <div className="mb-4">
                <div className="row align-items-center">
                    <div className="col-md-3">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <FaSearch className="text-muted" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search feedbacks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                   
                    <div className="col-md-1">
                        <button className="btn btn-outline-secondary w-100" onClick={clearFilters}>
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Showing */}
            <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="">Showing {filteredFeedbacks.length} of {feedbacks.length} feedbacks</h6>
                        <small className="text-muted">
                            {searchTerm && `Search: "${searchTerm}"`}
                            {filterRating && ` | Rating: ${filterRating} stars`}
                        </small>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleDownloadAll}
                        disabled={filteredFeedbacks.length === 0}
                    >
                        <FaDownload className="me-1" />
                        Download All Reviews ({filteredFeedbacks.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div>Loading feedbacks...</div>
            ) : filteredFeedbacks.length === 0 ? (
                <div className="bg-white rounded shadow-sm p-5 text-center">
                    <FaStar className="fs-1 text-muted mb-3" />
                    <h5 className="text-muted">No feedbacks found</h5>
                    <p className="text-muted">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="row">
                    {filteredFeedbacks.map((fb, index) => (
                        <div key={fb.id || fb._id || `feedback-${index}`} className="col-md-4 mb-3">
                            <div className="card h-100 shadow-sm ">
                                <div className="card-body">
                                    {/* Feedback Header */}
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <h6 className="card-title mb-1 fw-semibold h5 text-truncate">
                                                {getDisplayName(fb)}
                                            </h6>
                                            <div className="d-flex align-items-center small">
                                                <span className="small fw-medium">
                                                    {fb.date ? (new Date(fb.date.$date || fb.date)).toLocaleDateString() : '-'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="dropdown">
                                            <button className="btn btn-sm" type="button" data-bs-toggle="dropdown">
                                                <i className="mdi mdi-dots-vertical"></i>
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li>
                                                    <button
                                                        className="dropdown-item"
                                                        type="button"
                                                        onClick={() => handleReply(fb.email || 'support@esg.com')}
                                                    >
                                                        <FaReply className="me-1" />Reply via Email
                                                    </button>
                                                </li>
                                                {hasPermission(Permission.MANAGE_FEEDBACK) && (
                                                    <>
                                                        <li><hr className="dropdown-divider" /></li>
                                                        <li>
                                                            <button
                                                                className="dropdown-item text-danger"
                                                                type="button"
                                                                onClick={() => handleDelete(fb.id || fb._id)}
                                                            >
                                                                <FaRegTrashAlt className="me-1" />Delete
                                                            </button>
                                                        </li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Rating Display */}
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar
                                                        key={i}
                                                        className={`${i < (fb.rating || 0) ? 'text-warning' : 'text-muted'}`}
                                                        style={{ fontSize: '0.8rem' }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message Preview */}
                                    <div className="mb-3">
                                        <p className="card-text text " style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            fontSize: '0.875rem'
                                        }}>
                                            {fb.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Feedback;
