import React, { useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { FaUsers, FaCheckCircle, FaBook, FaLifeRing, FaChartLine, FaTrophy, FaCalendarAlt, FaStar, FaEllipsisV } from 'react-icons/fa';
import Title from '../../layouts/Title/Title';
import { getScoreColor, getScoreBadge } from '../../utils/scoreUtils';
// import './UserDashboard.css';
const dashboardStats = []
const sizeData = [
    { name: 'Micro', value: 40 },
    { name: 'Small', value: 35 },
    { name: 'Medium', value: 20 },
    { name: 'Large', value: 5 }
];

const emissionData = [
    { name: 'Petrol', value: 45 },
    { name: 'Electricity', value: 35 },
    { name: 'Diesel', value: 20 }
];

const COLORS = ['#0088FE', '#FFBB28', '#FF8042'];

const assessmentData = [
    { year: 2023, status: 'Completed', date: '15 Mar 2023', score: '85%' },
    { year: 2024, status: 'Completed', date: '10 Jan 2024', score: '65%' },
    { year: 2026, status: 'Not Started', date: '-', score: '-' }
];

const reportData = [
    { year: 2023, type: 'Annual ESG Report', status: 'Submitted', date: '30 Apr 2023' },
    { year: 2024, type: 'Annual ESG Report', status: 'Submitted', date: '30 Jun 2024' },
    { year: 2026, type: 'Annual ESG Report', status: 'Not Due', date: '-' }
];

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

function UserDashboardContent() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [selectedYear, setSelectedYear] = useState(2024);
    const [dropdownOpen, setDropdownOpen] = useState(null);

    const toggleDropdown = (year) => {
        setDropdownOpen(dropdownOpen === year ? null : year);
    };

    const handleAction = (action, year) => {
        console.log(`${action} for year ${year}`);
        setDropdownOpen(null);
    };

    return (
        <div className="container-fluid">
            <Title title="Dashboard" breadcrumb={[["Dashboard", "/dashboard"], "Dashboard"]} />

            {/* Header Section */}
            <div className="dashboard-header">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <h2 className="dashboard-title">
                            <i className="fas fa-tachometer-alt me-3"></i>
                            Dashboard
                        </h2>
                        <p className="text-white ">
                            Track your ESG performance and monitor your sustainability journey
                        </p>
                    </div>
                    <div className="col-md-4 text-end">
                        <div className="user-info">
                            <i className="fas fa-user-circle me-1"></i>
                            <span className="user-email">{user?.first_name || 'User'} {user?.last_name || ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FaCheckCircle />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-number">{dashboardStats?.totalAssessments}</h3>
                            <p className="stat-label">Total Assessments</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FaCalendarAlt />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-number">{dashboardStats?.latestYear}</h3>
                            <p className="stat-label">Latest Year</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FaTrophy />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-number">{dashboardStats?.currentStatus}</h3>
                            <p className="stat-label">Current Status</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FaChartLine />
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-number">{formatDate(dashboardStats?.lastUpdated)}</h3>
                            <p className="stat-label">Last Updated</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-8">
                    <div className="dashboard-section">
                        <h4 className="section-title">
                            <i className="fas fa-chart-line me-1"></i>
                            ESG Assessment Progress
                        </h4>

                        <div className="progress-section">
                            <div className="progress-item">
                                <div className="progress-header">
                                    <div className="progress-title">
                                        <i className="fas fa-leaf me-1"></i>
                                        <strong>Environmental</strong>
                                    </div>
                                    <div className="progress-percentage">
                                        <span className={`score-value ${getScoreColor(dashboardStats?.environmentalScore)}`}>
                                            {dashboardStats?.environmentalScore}%
                                        </span>
                                    </div>
                                </div>
                                <div className="progress-container">
                                    <div className="progress-bar-custom">
                                        <div
                                            className="progress-fill bg-success"
                                            style={{ width: `${dashboardStats?.environmentalScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="progress-item">
                                <div className="progress-header">
                                    <div className="progress-title">
                                        <i className="fas fa-users me-1"></i>
                                        <strong>Social</strong>
                                    </div>
                                    <div className="progress-percentage">
                                        <span className={`score-value ${getScoreColor(dashboardStats?.socialScore)}`}>
                                            {dashboardStats?.socialScore}%
                                        </span>
                                    </div>
                                </div>
                                <div className="progress-container">
                                    <div className="progress-bar-custom">
                                        <div
                                            className="progress-fill bg-warning"
                                            style={{ width: `${dashboardStats?.socialScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="progress-item">
                                <div className="progress-header">
                                    <div className="progress-title">
                                        <i className="fas fa-shield-alt me-1"></i>
                                        <strong>Governance</strong>
                                    </div>
                                    <div className="progress-percentage">
                                        <span className={`score-value ${getScoreColor(dashboardStats?.governanceScore)}`}>
                                            {dashboardStats?.governanceScore}%
                                        </span>
                                    </div>
                                </div>
                                <div className="progress-container">
                                    <div className="progress-bar-custom">
                                        <div
                                            className="progress-fill bg-info"
                                            style={{ width: `${dashboardStats?.governanceScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Performance Summary */}
                        <div className="performance-summary">
                            <h5 className="summary-title">
                                <i className="fas fa-star me-1"></i>
                                Overall Performance
                            </h5>
                            <div className="summary-content">
                                <div className="summary-item">
                                    <span className="summary-label">Average Score:</span>
                                    <span className="summary-value">
                                        {Math.round((dashboardStats?.environmentalScore + dashboardStats?.socialScore + dashboardStats?.governanceScore) / 3)}%
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Status:</span>
                                    <span className={`status-badge ${getScoreBadge((dashboardStats?.environmentalScore + dashboardStats?.socialScore + dashboardStats?.governanceScore) / 3)}`}>
                                        {(() => {
                                            const avg = (dashboardStats?.environmentalScore + dashboardStats?.socialScore + dashboardStats?.governanceScore) / 3;
                                            if (avg >= 80) return 'Excellent';
                                            if (avg >= 60) return 'Good';
                                            if (avg >= 40) return 'Fair';
                                            return 'Needs Improvement';
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="bg-white p-4 rounded shadow-sm mb-4">
                        <h4 className="fw-semibold mb-3">Latest Emission kgCO2</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={emissionData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name }) => `${name}`}
                                >
                                    {emissionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-md-6">
                    <div className="bg-white p-4 rounded shadow-sm h-100 position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-semibold ">Assessments by Year</h4>
                        </div>
                        <div className="">
                            <table className="table  table-hover">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Status</th>
                                        <th>Completion Date</th>
                                        <th>Score</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessmentData.map((item) => (
                                        <tr key={`assessment-${item.year}`}>
                                            <td>{item.year}</td>
                                            <td>
                                                <span className={`badge ${
                                                    item.status === 'Completed' ? 'bg-success' :
                                                    item.status === 'Not Started' ? 'bg-warning' :
                                                    'bg-secondary'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>{item.date}</td>
                                            <td>{item.score}</td>
                                            <td className="position-relative">
                                                <div className="dropdown">
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                        onClick={() => toggleDropdown(`assessment-${item.year}`)}
                                                    >
                                                        <FaEllipsisV />
                                                    </button>
                                                    <div className={`dropdown-menu ${dropdownOpen === `assessment-${item.year}` ? 'show' : ''}`}
                                                        style={{
                                                            position: 'absolute',
                                                            right: 0,
                                                            zIndex: 1000,
                                                            minWidth: '160px'
                                                        }}>
                                                        <button 
                                                            className="dropdown-item" 
                                                            onClick={() => handleAction('View', item.year)}
                                                        >
                                                            View Results
                                                        </button>
                                                        {item.status === 'Not Started' && (
                                                            <button 
                                                                className="dropdown-item" 
                                                                onClick={() => handleAction('Continue', item.year)}
                                                            >
                                                                Continue Assessment
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="bg-white p-4 rounded shadow-sm h-100 position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-semibold ">Submitted Reports</h4>
                        </div>
                        <div className="">
                            <table className="table  table-hover">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Submission Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((item) => (
                                        <tr key={`report-${item.year}`}>
                                            <td>{item.year}</td>
                                            <td>{item.type}</td>
                                            <td>
                                                <span className={`badge ${
                                                    item.status === 'Submitted' ? 'bg-success' :
                                                    item.status === 'Not Due' ? 'bg-warning' :
                                                    'bg-secondary'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td>{item.date}</td>
                                            <td className="position-relative">
                                                <div className="dropdown">
                                                    <button 
                                                        className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                        onClick={() => toggleDropdown(`report-${item.year}`)}
                                                    >
                                                        <FaEllipsisV />
                                                    </button>
                                                    <div className={`dropdown-menu ${dropdownOpen === `report-${item.year}` ? 'show' : ''}`}
                                                        style={{
                                                            position: 'absolute',
                                                            right: 0,
                                                            zIndex: 1000,
                                                            minWidth: '160px'
                                                        }}>
                                                        <button 
                                                            className="dropdown-item" 
                                                            onClick={() => handleAction('View', item.year)}
                                                        >
                                                            View Report
                                                        </button>
                                                        <button 
                                                            className="dropdown-item" 
                                                            onClick={() => handleAction('Download', item.year)}
                                                        >
                                                            Download PDF
                                                        </button>
                                                        {item.status === 'Not Due' && (
                                                            <button 
                                                                className="dropdown-item" 
                                                                onClick={() => handleAction('Submit', item.year)}
                                                            >
                                                                Submit Now
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserDashboardContent;