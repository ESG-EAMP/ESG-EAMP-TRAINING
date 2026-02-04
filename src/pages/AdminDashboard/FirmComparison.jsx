import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import './DashboardContent.css';
import api from '../../utils/api';
import { getScoreColor } from '../../utils/scoreUtils';
import Assesments from './Assesments';
import * as XLSX from 'xlsx';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title as ChartTitle,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ChartTitle,
    Tooltip,
    Legend,
    Filler
);

function FirmComparison() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [userAssessmentData, setUserAssessmentData] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('overallScore');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterByStatus, setFilterByStatus] = useState('all');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Callback function to receive assessment data from child components
    const handleAssessmentData = useCallback((userId, assessmentData) => {
        setUserAssessmentData(prev => ({
            ...prev,
            [userId]: assessmentData
        }));
    }, []);


    // Helper function to get category score from assessment
    const getCategoryScore = (assessment, category) => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        // Calculate from individual question responses if available
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

        // Fallback: Use the raw scores and category_max
        if (assessment.score.category_max && assessment.score.category_max[category] !== undefined) {
            const categoryScore = assessment.score[category] || 0;
            const categoryMax = assessment.score.category_max[category] || 1;
            return Math.round((categoryScore / categoryMax) * 100);
        }

        // Handle old format
        if (assessment.score[category] !== undefined) {
            return assessment.score[category];
        }

        return null;
    };

    // Helper function to get overall score from assessment
    const getOverallScore = (assessment) => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        // Check if it's the new format with total_score - use 300 as max for consistency
        if (assessment.score.total_score !== undefined) {
            return Math.round((assessment.score.total_score / assessment.score.max_score || 300) * 100);
        }

        // Check if it's the old format with Environment, Social, Governance
        if (assessment.score.Environment !== undefined) {
            const scores = Object.values(assessment.score).filter(val => typeof val === 'number');
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return Math.round(average);
        }

        return null;
    };

    // Fetch users on load
    useEffect(() => {
        api.get('/management/users')
            .then(res => {
                setUsers(res.data.users || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch users:", err);
                setLoading(false);
            });
    }, []);

    // Pre-calculate all user metrics to avoid recalculating on every render
    const userMetrics = useMemo(() => {
        const metrics = {};

        users.forEach(user => {
            const userData = userAssessmentData[user.id];
            let totalAssessments = 0;
            let latestYear = 'N/A';
            let overallScore = 0;
            let envScore = 0;
            let socialScore = 0;
            let govScore = 0;

            if (userData && userData.yearlyAssessment && Array.isArray(userData.yearlyAssessment)) {
                totalAssessments = userData.yearlyAssessment.length;
                const years = userData.yearlyAssessment.map(a => parseInt(a.year)).filter(y => !isNaN(y));
                latestYear = years.length > 0 ? Math.max(...years).toString() : 'N/A';

                // Calculate averages
                let totalOverall = 0;
                let totalEnv = 0;
                let totalSocial = 0;
                let totalGov = 0;
                let validCount = 0;

                userData.yearlyAssessment.forEach(assessment => {
                    const overall = getOverallScore(assessment);
                    const env = getCategoryScore(assessment, 'Environment');
                    const social = getCategoryScore(assessment, 'Social');
                    const gov = getCategoryScore(assessment, 'Governance');

                    if (overall !== null) {
                        totalOverall += overall;
                        validCount++;
                    }
                    if (env !== null) totalEnv += env;
                    if (social !== null) totalSocial += social;
                    if (gov !== null) totalGov += gov;
                });

                if (validCount > 0) {
                    overallScore = Math.round(totalOverall / validCount);
                    envScore = Math.round(totalEnv / validCount);
                    socialScore = Math.round(totalSocial / validCount);
                    govScore = Math.round(totalGov / validCount);
                }
            }

            metrics[user.id] = {
                totalAssessments,
                latestYear,
                overallScore,
                envScore,
                socialScore,
                govScore
            };
        });

        return metrics;
    }, [users, userAssessmentData]);

    // Get unique sectors for filter dropdown
    const getUniqueSectors = () => {
        const sectors = users
            .map(user => user.sector || '')
            .filter(sector => sector && sector.trim() !== '')
            .filter((sector, index, self) => self.indexOf(sector) === index)
            .sort();
        return sectors;
    };

    // Get unique sizes for filter dropdown
    const getUniqueSizes = () => {
        const sizes = users
            .map(user => user.business_size || '')
            .filter(size => size && size.trim() !== '')
            .filter((size, index, self) => self.indexOf(size) === index)
            .sort();
        return sizes;
    };

    // Get unique industries for filter dropdown
    const getUniqueIndustries = () => {
        const industries = users
            .map(user => user.industry || '')
            .filter(industry => industry && industry.trim() !== '')
            .filter((industry, index, self) => self.indexOf(industry) === index)
            .sort();
        return industries;
    };

    // Get unique locations for filter dropdown
    const getUniqueLocations = () => {
        const locations = users
            .map(user => user.location || user.address?.location || '')
            .filter(location => location && location.trim() !== '')
            .filter((location, index, self) => self.indexOf(location) === index)
            .sort();
        return locations;
    };

    // Helper functions for status and colors

    const getStatusBadge = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'badge bg-secondary';
        if (numScore === 0) return 'badge bg-dark';
        if (numScore >= 80) return 'badge bg-success';
        if (numScore >= 60) return 'badge bg-warning';
        if (numScore >= 40) return 'badge bg-orange';
        return 'badge bg-danger';
    };

    const getStatusText = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'N/A';
        if (numScore === 0) return 'YET TO START';
        if (numScore <= 30) return 'BASIC';
        if (numScore <= 50) return 'DEVELOPING';
        if (numScore <= 80) return 'INTERMEDIATE';
        return 'ADVANCED';
    };

    // Excel download function
    const downloadExcel = () => {
        // Prepare data for Excel export
        const excelData = filteredAndSortedUsers.map((user, index) => {
            const metrics = userMetrics[user.id] || {
                totalAssessments: 0,
                latestYear: 'N/A',
                overallScore: 0,
                envScore: 0,
                socialScore: 0,
                govScore: 0
            };

            return {
                'No.': index + 1,
                'Firm Name': user.firm || 'N/A',
                'Email': user.email || 'N/A',
                'Sector': user.sector || 'N/A',
                'Size': user.business_size || 'N/A',
                'Industry': user.industry || 'N/A',
                'Location': user.location || user.address?.location || 'N/A',
                'Total Assessments': metrics.totalAssessments,
                'Latest Year': metrics.latestYear,
                'Overall Score (%)': metrics.overallScore,
                'Environment Score (%)': metrics.envScore,
                'Social Score (%)': metrics.socialScore,
                'Governance Score (%)': metrics.govScore,
                'Status': getStatusText(metrics.overallScore),
                'Registration Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
            };
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const colWidths = [
            { wch: 6 },  // No.
            { wch: 25 }, // Firm Name
            { wch: 30 }, // Email
            { wch: 20 }, // Sector
            { wch: 15 }, // Size
            { wch: 30 }, // Industry
            { wch: 20 }, // Location
            { wch: 18 }, // Total Assessments
            { wch: 12 }, // Latest Year
            { wch: 15 }, // Overall Score
            { wch: 18 }, // Environment Score
            { wch: 15 }, // Social Score
            { wch: 18 }, // Governance Score
            { wch: 15 }, // Status
            { wch: 18 }  // Registration Date
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Firm Comparison');

        // Generate filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `Firm_Comparison_${currentDate}.xlsx`;

        // Download the file
        XLSX.writeFile(wb, filename);
    };

    // Filter and sort users
    const filteredAndSortedUsers = useMemo(() => {
        let filtered = users.filter(user => {
            const metrics = userMetrics[user.id];
            const searchLower = (searchTerm || '').toLowerCase();
            const sector = user.sector || '';
            const size = user.business_size || '';
            const industry = user.industry || '';
            const location = user.location || user.address?.location || '';
            
            const matchesSearch = (user.firm?.toLowerCase().includes(searchLower) || false) ||
                (user.email?.toLowerCase().includes(searchLower) || false) ||
                (sector.toLowerCase().includes(searchLower) || false) ||
                (size.toLowerCase().includes(searchLower) || false) ||
                (industry.toLowerCase().includes(searchLower) || false) ||
                (location.toLowerCase().includes(searchLower) || false);

            let matchesStatus = true;
            if (filterByStatus !== 'all') {
                const status = getStatusText(metrics?.overallScore || 0);
                matchesStatus = status.toLowerCase() === filterByStatus.toLowerCase();
            }

            // Filter by sector
            let matchesSector = true;
            if (selectedSector) {
                matchesSector = sector.toLowerCase().includes(selectedSector.toLowerCase());
            }

            // Filter by size
            let matchesSize = true;
            if (selectedSize) {
                matchesSize = size.toLowerCase().includes(selectedSize.toLowerCase());
            }

            // Filter by industry
            let matchesIndustry = true;
            if (selectedIndustry) {
                matchesIndustry = industry.toLowerCase().includes(selectedIndustry.toLowerCase());
            }

            // Filter by location
            let matchesLocation = true;
            if (selectedLocation) {
                matchesLocation = location.toLowerCase().includes(selectedLocation.toLowerCase());
            }

            return matchesSearch && matchesStatus && matchesSector && matchesSize && matchesIndustry && matchesLocation;
        });

        // Sort users
        filtered.sort((a, b) => {
            const metricsA = userMetrics[a.id];
            const metricsB = userMetrics[b.id];

            let valueA, valueB;

            switch (sortBy) {
                case 'firmName':
                    valueA = (a.firm || '').toLowerCase();
                    valueB = (b.firm || '').toLowerCase();
                    break;
                case 'totalAssessments':
                    valueA = metricsA?.totalAssessments || 0;
                    valueB = metricsB?.totalAssessments || 0;
                    break;
                case 'latestYear':
                    valueA = parseInt(metricsA?.latestYear) || 0;
                    valueB = parseInt(metricsB?.latestYear) || 0;
                    break;
                case 'sector':
                    valueA = (a.sector || '').toLowerCase();
                    valueB = (b.sector || '').toLowerCase();
                    break;
                case 'size':
                    valueA = (a.business_size || '').toLowerCase();
                    valueB = (b.business_size || '').toLowerCase();
                    break;
                case 'industry':
                    valueA = (a.industry || '').toLowerCase();
                    valueB = (b.industry || '').toLowerCase();
                    break;
                case 'location':
                    valueA = (a.location || a.address?.location || '').toLowerCase();
                    valueB = (b.location || b.address?.location || '').toLowerCase();
                    break;
                case 'overallScore':
                default:
                    valueA = metricsA?.overallScore || 0;
                    valueB = metricsB?.overallScore || 0;
                    break;
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        return filtered;
    }, [users, userMetrics, searchTerm, sortBy, sortOrder, filterByStatus, selectedSector, selectedSize, selectedIndustry, selectedLocation]);

    // Pagination calculations
    const totalItems = filteredAndSortedUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, sortOrder, filterByStatus, selectedSector, selectedSize, selectedIndustry, selectedLocation]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Firms" breadcrumb={[["Dashboard", "/dashboard"], "Firms"]} />
                <div className="loading-container text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading Firms data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Firms" breadcrumb={[["Dashboard", "/dashboard"], "Firms"]} />

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
                            placeholder="Search by firm, email, sector, size, industry, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={filterByStatus}
                        onChange={(e) => setFilterByStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="advanced">Advanced (80-100%)</option>
                        <option value="intermediate">Intermediate (50-80%)</option>
                        <option value="developing">Developing (30-50%)</option>
                        <option value="basic">Basic (0-30%)</option>
                        <option value="yet to start">Yet To Start (0%)</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                    >
                        <option value="">All Sectors</option>
                        {getUniqueSectors().map((sector, index) => (
                            <option key={index} value={sector}>
                                {sector}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                    >
                        <option value="">All Sizes</option>
                        {getUniqueSizes().map((size, index) => (
                            <option key={index} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="row mb-1">
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                    >
                        <option value="">All Industries</option>
                        {getUniqueIndustries().map((industry, index) => (
                            <option key={index} value={industry}>
                                {industry}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="">All Locations</option>
                        {getUniqueLocations().map((location, index) => (
                            <option key={index} value={location}>
                                {location}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="overallScore">Sort by Overall Score</option>
                        <option value="firmName">Sort by Firm Name</option>
                        <option value="sector">Sort by Sector</option>
                        <option value="size">Sort by Size</option>
                        <option value="industry">Sort by Industry</option>
                        <option value="location">Sort by Location</option>
                        <option value="totalAssessments">Sort by Total Assessments</option>
                        <option value="latestYear">Sort by Latest Year</option>
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
            {(searchTerm || filterByStatus !== 'all' || selectedSector || selectedSize || selectedIndustry || selectedLocation) && (
                <div className="row mb-3">
                    <div className="col-12">
                        <button
                            className="btn"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterByStatus('all');
                                setSelectedSector('');
                                setSelectedSize('');
                                setSelectedIndustry('');
                                setSelectedLocation('');
                            }}
                        >
                            <i className="fas fa-times me-1"></i>
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Export Button */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex justify-content-end">
                        <button
                            className="btn btn-success"
                            onClick={downloadExcel}
                            disabled={filteredAndSortedUsers.length === 0}
                        >
                            <i className="fas fa-file-excel me-1"></i>
                            Download Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Comparison Table */}
            <div className="row">
                <div className="col-12">
                    <div className=" table-scroll-top overflow-y-auto card">
                        <table className="table  table-nowrap rounded">
                            <thead className="table-dark">
                                <tr>
                                    <th>No.</th>
                                    <th>Actions</th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('firmName')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Firm Name
                                        {sortBy === 'firmName' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('sector')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Sector
                                        {sortBy === 'sector' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('size')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Size
                                        {sortBy === 'size' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('industry')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Industry
                                        {sortBy === 'industry' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('location')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Location
                                        {sortBy === 'location' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('totalAssessments')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Total Assessments
                                        {sortBy === 'totalAssessments' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('latestYear')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Latest Year
                                        {sortBy === 'latestYear' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('overallScore')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Overall Score
                                        {sortBy === 'overallScore' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th>Environment</th>
                                    <th>Social</th>
                                    <th>Governance</th>
                                    <th>Status</th>

                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.map((user, index) => {
                                    const metrics = userMetrics[user.id] || {
                                        totalAssessments: 0,
                                        latestYear: 'N/A',
                                        overallScore: 0,
                                        envScore: 0,
                                        socialScore: 0,
                                        govScore: 0
                                    };

                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <span className="d-flex justify-content-center">{startIndex + index + 1}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => navigate(`/admin/firm-assessments/${user.id}`)}
                                                    title="View Assessment History"
                                                >
                                                    <i className="fas fa-history"></i>
                                                </button>
                                            </td>
                                            <td>
                                                <div className="firm-info-cell">
                                                    <strong>{user.firm || 'N/A'}</strong>
                                                    <br />
                                                    <small className="text-muted">{user.email || 'N/A'}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <small className="text-muted">{user.sector || 'N/A'}</small>
                                            </td>
                                            <td>
                                                <small className="text-muted">{user.business_size || 'N/A'}</small>
                                            </td>
                                            <td>
                                                <small className="text-muted">{user.industry || 'N/A'}</small>
                                            </td>
                                            <td>
                                                <small className="text-muted">{user.location || user.address?.location || 'N/A'}</small>
                                            </td>
                                            <td>
                                                <span className="d-flex justify-content-center text-center">{metrics.totalAssessments}</span>
                                            </td>
                                            <td>
                                                <span className="fw-medium">{metrics.latestYear}</span>
                                            </td>
                                            <td>
                                                <div className="score-cell">
                                                    <span className={`fw-bold ${getScoreColor(metrics.overallScore)}`}>
                                                        {metrics.overallScore}%
                                                    </span>
                                                    <div className="progress mt-1" style={{ height: '4px', width: '60px' }}>
                                                        <div
                                                            className={`progress-bar ${getScoreColor(metrics.overallScore).replace('text-', 'bg-')}`}
                                                            style={{ width: `${metrics.overallScore}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={getScoreColor(metrics.envScore)}>
                                                    {metrics.envScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getScoreColor(metrics.socialScore)}>
                                                    {metrics.socialScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getScoreColor(metrics.govScore)}>
                                                    {metrics.govScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getStatusBadge(metrics.overallScore)}>
                                                    {getStatusText(metrics.overallScore)}
                                                </span>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalItems === 0 && (
                        <div className="text-center py-5">
                            <i className="fas fa-search fa-3x text-muted mb-3"></i>
                            <h5>No firms found</h5>
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
                        <nav aria-label="Firms pagination">
                            <ul className="pagination justify-content-center">
                                        {/* Previous Button */}
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                        </li>

                                        {/* Page Numbers */}
                                        {(() => {
                                            const pages = [];
                                            const maxVisiblePages = 5;
                                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                            // Adjust start page if we're near the end
                                            if (endPage - startPage + 1 < maxVisiblePages) {
                                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                            }

                                            // First page and ellipsis
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

                                            // Page numbers
                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(
                                                    <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(i)}>
                                                            {i}
                                                        </button>
                                                    </li>
                                                );
                                            }

                                            // Last page and ellipsis
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

                                        {/* Next Button */}
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

            {/* Hidden Assessment Components for Data Collection */}
            <div style={{ display: 'none' }}>
                {users.map((user) => (
                    <Assesments
                        key={user.id}
                        userId={user.id}
                        userDetails={user}
                        onDataUpdate={(data) => handleAssessmentData(user.id, data)}
                    />
                ))}
            </div>
        </div>
    );
}

export default FirmComparison;
