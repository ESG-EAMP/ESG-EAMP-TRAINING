import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { getScoreColor, getScoreBadge } from '../../utils/scoreUtils';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    FaChartLine,
    FaUsers,
    FaCheckCircle,
    FaExclamationTriangle,
    FaClock,
    FaTrophy,
    FaIndustry,
    FaBuilding,
    FaCalendarAlt,
    FaEye,
    FaDownload,
    FaSyncAlt,
    FaFileAlt,
    FaArrowUp,
    FaArrowDown,
    FaMinus,
    FaChartBar,
    FaCog,
    FaHome,
    FaLeaf,
    FaShieldAlt,
    FaUserFriends
} from 'react-icons/fa';

// Mock data for demonstration - replace with actual API calls
const mockAssessmentData = {
    // Overall Statistics
    statistics: {
        totalAssessments: 1247,
        completedAssessments: 892,
        pendingAssessments: 355,
        averageScore: 67.3,
        improvementRate: 12.5,
        thisMonthAssessments: 156,
        lastMonthAssessments: 134,
        completionRate: 71.5
    },

    // ESG Performance by Category
    esgPerformance: {
        Environment: {
            average: 72.3,
            completed: 892,
            pending: 45,
            improvement: 8.2
        },
        Social: {
            average: 65.8,
            completed: 856,
            pending: 67,
            improvement: 5.7
        },
        Governance: {
            average: 70.1,
            completed: 823,
            pending: 89,
            improvement: 9.4
        }
    },

    // Monthly Assessment Trends
    monthlyTrends: [
        { month: 'Jan', completed: 89, pending: 23, averageScore: 65.2 },
        { month: 'Feb', completed: 92, pending: 19, averageScore: 66.1 },
        { month: 'Mar', completed: 87, pending: 28, averageScore: 64.8 },
        { month: 'Apr', completed: 104, pending: 15, averageScore: 67.3 },
        { month: 'May', completed: 98, pending: 22, averageScore: 68.1 },
        { month: 'Jun', completed: 112, pending: 18, averageScore: 69.2 }
    ],

    // Industry Performance
    industryPerformance: [
        { industry: 'Manufacturing', count: 234, avgScore: 72.3, trend: 'up', completion: 85 },
        { industry: 'Services', count: 189, avgScore: 68.7, trend: 'up', completion: 78 },
        { industry: 'Retail', count: 156, avgScore: 65.2, trend: 'stable', completion: 72 },
        { industry: 'Technology', count: 98, avgScore: 78.9, trend: 'up', completion: 91 },
        { industry: 'Agriculture', count: 87, avgScore: 58.4, trend: 'down', completion: 65 },
        { industry: 'Construction', count: 76, avgScore: 62.1, trend: 'up', completion: 68 }
    ],

    // Assessment Status Distribution
    statusDistribution: [
        { name: 'Completed', value: 892, color: '#10b981' },
        { name: 'In Progress', value: 234, color: '#f59e0b' },
        { name: 'Not Started', value: 121, color: '#ef4444' }
    ],

    // Recent Assessments
    recentAssessments: [
        { id: 1, company: 'EcoTech Solutions', score: 78, status: 'completed', date: '2026-01-15', industry: 'Technology' },
        { id: 2, company: 'Green Manufacturing Co', score: 72, status: 'completed', date: '2026-01-14', industry: 'Manufacturing' },
        { id: 3, company: 'Sustainable Retail Ltd', score: 65, status: 'in_progress', date: '2026-01-13', industry: 'Retail' },
        { id: 4, company: 'Clean Energy Corp', score: 85, status: 'completed', date: '2026-01-12', industry: 'Technology' },
        { id: 5, company: 'Organic Foods Inc', score: 58, status: 'not_started', date: '2026-01-11', industry: 'Agriculture' }
    ]
};

function Assessment({ userId, userInfo }) {
    const [assessmentData, setAssessmentData] = useState(mockAssessmentData);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState('2026');
    const [selectedIndustry, setSelectedIndustry] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const navigate = useNavigate();

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return <FaArrowUp className="text-success" />;
            case 'down': return <FaArrowDown className="text-danger" />;
            default: return <FaMinus className="text-muted" />;
        }
    };


    const getScoreStatus = (score) => {
        if (score >= 80) return 'Advanced';
        if (score >= 60) return 'Intermediate';
        if (score >= 40) return 'Developing';
        if (score >= 1) return 'Basic';
        return 'Yet to Start';
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return 'bg-success';
            case 'in_progress': return 'bg-warning';
            case 'not_started': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in_progress': return 'In Progress';
            case 'not_started': return 'Not Started';
            default: return 'Unknown';
        }
    };

    // Fetch assessment data (replace with actual API call)
    const fetchAssessmentData = async () => {
        setLoading(true);
        try {
            // Replace with actual API endpoint
            // const response = await fetch(`${import.meta.env.VITE_APP_API}/admin/assessment/stats`);
            // const data = await response.json();
            // setAssessmentData(data);

            // For now, using mock data
            setTimeout(() => {
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching assessment data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssessmentData();
    }, []);

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="ESG Performance Assessment" breadcrumb={[["Assessment", "/assessment"], "ESG Performance Assessment"]} />
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
            <Title title="ESG Performance Assessment" breadcrumb={[["Assessment", "/assessment"], "ESG Performance Assessment"]} />

            {/* Header Section */}
            <div className="bg-gradient-primary text-white rounded shadow-sm p-4 mb-4">
                <div className="row align-items-center">
                    <div className="col-lg-8">
                        <h2 className="fw-bold mb-2">ESG Assessment Analytics</h2>
                        <p className=" opacity-75">Comprehensive analysis of MSME ESG assessment performance and trends</p>
                    </div>
                    <div className="col-lg-4 text-end">
                        <button className="btn btn-light btn-sm me-1" onClick={fetchAssessmentData}>
                            <FaSyncAlt className="me-1" />
                            Refresh
                        </button>
                        <button className="btn btn-light btn-sm">
                            <FaFileAlt className="me-1" />
                            Export Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Key Statistics */}
            <div className="row mb-4">
                {[
                    {
                        icon: <FaCheckCircle className="fs-1 text-success" />,
                        title: 'Completed Assessments',
                        value: formatNumber(assessmentData.statistics.completedAssessments),
                        change: '+12.5%',
                        changeType: 'positive',
                        color: 'success'
                    },
                    {
                        icon: <FaClock className="fs-1 text-warning" />,
                        title: 'Pending Assessments',
                        value: formatNumber(assessmentData.statistics.pendingAssessments),
                        change: '-8.3%',
                        changeType: 'negative',
                        color: 'warning'
                    },
                    {
                        icon: <FaTrophy className="fs-1 text-info" />,
                        title: 'Average Score',
                        value: `${assessmentData.statistics.averageScore}%`,
                        change: '+2.7%',
                        changeType: 'positive',
                        color: 'info'
                    },
                    {
                        icon: <FaChartLine className="fs-1 text-primary" />,
                        title: 'Completion Rate',
                        value: `${assessmentData.statistics.completionRate}%`,
                        change: '+5.2%',
                        changeType: 'positive',
                        color: 'primary'
                    }
                ].map((card, idx) => (
                    <div key={idx} className="col-lg-3 col-md-6 mb-3">
                        <div className="bg-white p-4 rounded shadow-sm h-100">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                {card.icon}
                                <span className={`badge bg-${card.color} bg-opacity-10 text-${card.color}`}>
                                    {card.change}
                                </span>
                            </div>
                            <h3 className="fw-bold mb-1">{card.value}</h3>
                            <p className="text-muted ">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ESG Performance Overview */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h5 className="fw-semibold mb-3">
                            <FaChartBar className="me-1 text-primary" />
                            ESG Performance Overview
                        </h5>
                        <div className="row">
                            {Object.entries(assessmentData.esgPerformance).map(([category, data]) => (
                                <div key={category} className="col-lg-4 mb-3">
                                    <div className="border rounded p-3 h-100">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className={`me-3 ${category === 'Environment' ? 'text-success' : category === 'Social' ? 'text-primary' : 'text-warning'}`}>
                                                {category === 'Environment' && <FaLeaf className="fs-2" />}
                                                {category === 'Social' && <FaUserFriends className="fs-2" />}
                                                {category === 'Governance' && <FaShieldAlt className="fs-2" />}
                                            </div>
                                            <div>
                                                <h6 className="fw-bold ">{category}</h6>
                                                <small className="text-muted">{data.completed} completed</small>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="fw-semibold">Average Score</span>
                                                <span className={`fw-bold ${getScoreColor(data.average)}`}>
                                                    {data.average}%
                                                </span>
                                            </div>
                                            <div className="progress" style={{ height: '8px' }}>
                                                <div
                                                    className={`progress-bar ${getScoreBadge(data.average)}`}
                                                    style={{ width: `${data.average}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="row text-center">
                                            <div className="col-6">
                                                <div className="text-success">
                                                    <div className="fw-bold">+{data.improvement}%</div>
                                                    <small>Improvement</small>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="text-warning">
                                                    <div className="fw-bold">{data.pending}</div>
                                                    <small>Pending</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="row mb-4">
                {/* Monthly Trends */}
                <div className="col-lg-8 mb-4">
                    <div className="bg-white p-4 rounded shadow-sm h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-semibold ">
                                <FaChartLine className="me-1 text-primary" />
                                Monthly Assessment Trends
                            </h5>
                            <select
                                className="form-select form-select-sm w-auto"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="2026">2026</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={assessmentData.monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    name="Completed"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="pending"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="Pending"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="averageScore"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    name="Avg Score"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Assessment Status Distribution */}
                <div className="col-lg-4 mb-4">
                    <div className="bg-white p-4 rounded shadow-sm h-100">
                        <h5 className="fw-semibold mb-3">
                            <FaChartBar className="me-1 text-success" />
                            Assessment Status Distribution
                        </h5>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={assessmentData.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {assessmentData.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Industry Performance */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-semibold ">
                                <FaCog className="me-1 text-warning" />
                                Industry Performance Overview
                            </h5>
                            <select
                                className="form-select form-select-sm w-auto"
                                value={selectedIndustry}
                                onChange={(e) => setSelectedIndustry(e.target.value)}
                            >
                                <option value="all">All Industries</option>
                                <option value="manufacturing">Manufacturing</option>
                                <option value="services">Services</option>
                                <option value="retail">Retail</option>
                                <option value="technology">Technology</option>
                            </select>
                        </div>
                        <div className="">
                            <table className="table  table-hover">
                                <thead>
                                    <tr>
                                        <th>Industry</th>
                                        <th>MSMEs</th>
                                        <th>Avg Score</th>
                                        <th>Completion %</th>
                                        <th>Trend</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessmentData.industryPerformance.map((industry, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <FaHome className="me-1 text-muted" />
                                                {industry.industry}
                                            </td>
                                            <td>
                                                <span className="fw-semibold">{industry.count}</span>
                                            </td>
                                            <td>
                                                <span className={`fw-semibold ${getScoreColor(industry.avgScore)}`}>
                                                    {industry.avgScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className="fw-semibold">{industry.completion}%</span>
                                            </td>
                                            <td>
                                                {getTrendIcon(industry.trend)}
                                            </td>
                                            <td>
                                                <span className={`badge ${getScoreBadge(industry.avgScore)}`}>
                                                    {getScoreStatus(industry.avgScore)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Assessments */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-semibold ">
                                <FaCalendarAlt className="me-1 text-primary" />
                                Recent Assessments
                            </h5>
                            <div className="d-flex gap-2">
                                <select
                                    className="form-select form-select-sm w-auto"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="not_started">Not Started</option>
                                </select>
                                <button className="btn btn-outline-primary btn-sm">
                                    <FaEye className="me-1" />
                                    View All
                                </button>
                            </div>
                        </div>
                        <div className="">
                            <table className="table  table-hover">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Industry</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessmentData.recentAssessments.map((assessment, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div className="fw-semibold">{assessment.company}</div>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">{assessment.industry}</span>
                                            </td>
                                            <td>
                                                <span className={`fw-bold ${getScoreColor(assessment.score)}`}>
                                                    {assessment.score}%
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(assessment.status)}`}>
                                                    {getStatusText(assessment.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-muted">{assessment.date}</span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button 
                                                        className="btn btn-outline-primary"
                                                        onClick={() => navigate(`/admin/assessment-details-v2/${userId || assessment.id}/${assessment.date.split('-')[0]}`)}
                                                        title="View Assessment Details"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button 
                                                        className="btn btn-outline-success"
                                                        onClick={() => navigate(`/admin/assessment-v2/${userId || assessment.id}`)}
                                                        title="Edit Assessment"
                                                    >
                                                        <FaDownload />
                                                    </button>
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

            {/* Quick Actions */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="bg-white p-4 rounded shadow-sm">
                        <h5 className="fw-semibold mb-3">
                            <FaCog className="me-1 text-primary" />
                            Assessment Management
                        </h5>
                        <div className="row">
                            <div className="col-md-3 mb-2">
                                <button className="btn btn-outline-primary w-100">
                                    <FaEye className="me-1" />
                                    View All Assessments
                                </button>
                            </div>
                            <div className="col-md-3 mb-2">
                                <button className="btn btn-outline-success w-100">
                                    <FaDownload className="me-1" />
                                    Export Data
                                </button>
                            </div>
                            <div className="col-md-3 mb-2">
                                <button className="btn btn-outline-warning w-100">
                                    <FaExclamationTriangle className="me-1" />
                                    Review Pending
                                </button>
                            </div>
                            <div className="col-md-3 mb-2">
                                <button className="btn btn-outline-info w-100">
                                    <FaFileAlt className="me-1" />
                                    Generate Reports
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Assessment;