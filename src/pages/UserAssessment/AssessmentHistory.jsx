import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import api from '../../utils/api';
import { getScoreColor } from '../../utils/scoreUtils';
import { FaSearch } from 'react-icons/fa';

function AssessmentHistory() {
    const [data, setData] = useState([]);
    const [yearlyAssessment, setYearlyAssessment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterByYear, setFilterByYear] = useState('');
    const [sortBy, setSortBy] = useState('year');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            console.error('User ID not found. Please log in again.');
            setLoading(false);
            return;
        }

        api.get(`/assessment/user/v2/get-responses-2?user_id=${userId}&selected_only=true`)
            .then(res => {
                const data = res.data;
                setData(data);

                if (Array.isArray(data) && data.length > 0) {
                    const years = data[0]?.years || [];
                    const flattenedAssessments = [];

                    years.forEach(yearObj => {
                        if (yearObj.data && Array.isArray(yearObj.data) && yearObj.data.length > 0) {
                            const assessmentCount = yearObj.data.length;
                            let selectedAssessment = null;

                            if (assessmentCount > 1) {
                                selectedAssessment = yearObj.data.find(a => a.is_selected === true);
                                if (!selectedAssessment) {
                                    selectedAssessment = yearObj.data.reduce((latest, current) => {
                                        const currentDate = current.submitted_at || current.created_at || '';
                                        const latestDate = latest.submitted_at || latest.created_at || '';
                                        return currentDate > latestDate ? current : latest;
                                    }, yearObj.data[0]);
                                }
                            } else {
                                selectedAssessment = yearObj.data[0];
                            }

                            flattenedAssessments.push({
                                ...selectedAssessment,
                                year: yearObj.year || selectedAssessment.assessment_year,
                                score: selectedAssessment.score || yearObj.score,
                                is_selected: selectedAssessment.is_selected !== undefined ? selectedAssessment.is_selected : (assessmentCount === 1),
                                submitted_at: selectedAssessment.submitted_at || yearObj.last_updated,
                                assessment_year: selectedAssessment.assessment_year || yearObj.year
                            });
                        } else {
                            flattenedAssessments.push({
                                ...yearObj,
                                year: yearObj.year,
                                is_selected: true,
                                submitted_at: yearObj.last_updated,
                                assessment_year: yearObj.year
                            });
                        }
                    });

                    setYearlyAssessment(flattenedAssessments);
                } else {
                    setYearlyAssessment([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching assessment history:", err);
                setLoading(false);
            });
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getOverallScore = (assessment) => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        if (assessment.score.total_score !== undefined && assessment.score.max_score !== undefined) {
            return Math.round((assessment.score.total_score / assessment.score.max_score) * 100);
        }

        if (assessment.score.Environment !== undefined) {
            const scores = Object.values(assessment.score).filter(val => typeof val === 'number');
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return Math.round(average);
        }

        return null;
    };

    const getCategoryScore = (assessment, category) => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        if (assessment.responses && Array.isArray(assessment.responses)) {
            const categoryResponses = assessment.responses.filter(response =>
                response.category === category &&
                response.question_score !== undefined &&
                response.question_max !== undefined
            );

            if (categoryResponses.length > 0) {
                const totalScore = categoryResponses.reduce((sum, response) => sum + (parseFloat(response.question_score) || 0), 0);
                const totalMax = categoryResponses.reduce((sum, response) => sum + (parseFloat(response.question_max) || 0), 0);

                if (totalMax > 0) {
                    return Math.round((totalScore / totalMax) * 100);
                }
            }
        }

        if (assessment.score.category_max && assessment.score.category_max[category] !== undefined) {
            const categoryScore = assessment.score[category] || 0;
            const categoryMax = assessment.score.category_max[category] || 1;
            return Math.round((categoryScore / categoryMax) * 100);
        }

        if (assessment.score[category] !== undefined) {
            return assessment.score[category];
        }

        return null;
    };

    const handleViewDetails = (year) => {
        navigate(`/assessment-details-v2/${year}`);
    };

    // Get unique years for filter
    const getUniqueYears = () => {
        const years = yearlyAssessment
            .map(a => a.year || '')
            .filter(year => year && year.toString().trim() !== '')
            .filter((year, index, self) => self.indexOf(year) === index)
            .sort((a, b) => parseInt(b) - parseInt(a));
        return years;
    };

    // Filter and sort assessments
    const filteredAndSortedAssessments = useMemo(() => {
        let filtered = yearlyAssessment.filter(assessment => {
            // Filter by search term (year)
            const searchLower = (searchTerm || '').toLowerCase();
            const yearMatch = !searchTerm || (assessment.year || '').toString().toLowerCase().includes(searchLower);

            // Filter by year
            const yearFilterMatch = !filterByYear || (assessment.year || '').toString() === filterByYear;

            return yearMatch && yearFilterMatch;
        });

        // Sort assessments
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'year':
                    valueA = parseInt(a.year) || 0;
                    valueB = parseInt(b.year) || 0;
                    break;
                case 'overallScore':
                    valueA = getOverallScore(a) || 0;
                    valueB = getOverallScore(b) || 0;
                    break;
                case 'submittedDate':
                    valueA = new Date(a.submitted_at || 0).getTime();
                    valueB = new Date(b.submitted_at || 0).getTime();
                    break;
                default:
                    valueA = parseInt(a.year) || 0;
                    valueB = parseInt(b.year) || 0;
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        return filtered;
    }, [yearlyAssessment, searchTerm, filterByYear, sortBy, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedAssessments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAssessments = filteredAndSortedAssessments.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterByYear, sortBy, sortOrder]);

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Assessment History" breadcrumb={[["Dashboard", "/dashboard"], "Assessment History"]} />
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading assessment history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Assessment History" breadcrumb={[["Dashboard", "/dashboard"], "Assessment History"]} />

            {/* Filters */}
            <div className="row mb-3">
                <div className="col-lg-4 col-md-6 mb-3 d-none">
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <FaSearch className="text-muted" />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search by year..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={filterByYear}
                        onChange={(e) => setFilterByYear(e.target.value)}
                    >
                        <option value="">All Years</option>
                        {getUniqueYears().map((year, index) => (
                            <option key={index} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="year">Sort by Year</option>
                        <option value="overallScore">Sort by Overall Score</option>
                        <option value="submittedDate">Sort by Date</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
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
                                setItemsPerPage(Number(e.target.value));
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

            {(searchTerm || filterByYear) && (
                <div className="row mb-3">
                    <div className="col-12">
                        <button
                            className="btn btn-sm"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterByYear('');
                            }}
                        >
                            <i className="fas fa-times me-1"></i>
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Assessment History Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card-body">
                        {yearlyAssessment.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No Assessment History</h5>
                                <p className="text-muted">You haven't completed any assessments yet.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/assessment-v2')}
                                >
                                    <i className="fas fa-plus me-1"></i>
                                    Take Your First Assessment
                                </button>
                            </div>
                        ) : filteredAndSortedAssessments.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                                <h5 className="text-muted">No Assessments Found</h5>
                                <p className="text-muted">Try adjusting your search or filter criteria.</p>
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive rounded shadow-sm bg-white">
                                    <table className="table table-hover">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>No</th>
                                                <th>Actions</th>
                                                <th>Year</th>
                                                <th>Overall Score</th>
                                                <th>Environment</th>
                                                <th>Social</th>
                                                <th>Governance</th>
                                                <th>Submitted Date</th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentAssessments.map((assessment, index) => {
                                                const overallScore = getOverallScore(assessment) || 0;
                                                const envScore = getCategoryScore(assessment, 'Environment') || 0;
                                                const socialScore = getCategoryScore(assessment, 'Social') || 0;
                                                const govScore = getCategoryScore(assessment, 'Governance') || 0;

                                                return (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm"
                                                                onClick={() => handleViewDetails(assessment.year)}
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <strong>{assessment.year || 'N/A'}</strong>
                                                        </td>
                                                        <td>
                                                            <span className={`fw-bold ${getScoreColor(overallScore)}`}>
                                                                {overallScore}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={getScoreColor(envScore)}>
                                                                {envScore}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={getScoreColor(socialScore)}>
                                                                {socialScore}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={getScoreColor(govScore)}>
                                                                {govScore}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {formatDate(assessment.submitted_at)}
                                                        </td>

                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>


            {/* Pagination - Bottom Center */}
            {totalPages > 1 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <nav aria-label="Assessment pagination">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="mdi mdi-chevron-left"></i>
                                    </button>
                                </li>

                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    const isActive = pageNum === currentPage;

                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <li key={pageNum} className={`page-item ${isActive ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return (
                                            <li key={pageNum} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}

                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <i className="mdi mdi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AssessmentHistory;
