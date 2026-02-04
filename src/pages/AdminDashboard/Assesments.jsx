import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import Swal from 'sweetalert2';
import MsmeAnalysis from '../UserDashboard/MsmeAnalysis';
import api from '../../utils/api';
import { getScoreColor } from '../../utils/scoreUtils';
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
import { Line, Bar, Scatter } from 'react-chartjs-2';

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

function Assesments({userId, userDetails, onDataUpdate}) {
    const [data, setData] = useState([]);
    const [yearlyAssessment, setYearlyAssessment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'scatter'
    const [showTooltip, setShowTooltip] = useState(false);
    const user_email = localStorage.getItem('user_email');
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const dataSentRef = useRef(false);

    const toggleTooltip = () => {
        setShowTooltip(prev => !prev);
    };

    useEffect(() => {
        if (!userId) {
            console.error('User ID not found. Please log in again.');
            setLoading(false);
            return;
        }
        api.get(`/assessment/user/v2/get-responses-2?user_id=${userId}`)
            .then(res => {
                const data = res.data;
                setData(data);
                //console.log("🔍 FETCHED DATA DEBUG:", data);
                // Handle new data structure - data is an array with years property
                if (Array.isArray(data) && data.length > 0) {
                    const years = data[0]?.years || [];
                    // Transform year objects into individual assessment objects
                    // Each year object has: { year, data: [assessments], score, ... }
                    // We need to extract individual assessments from the data array
                    // For each year, if multiple assessments exist, pick the latest one (is_selected === true or latest submitted_at)
                    // This matches the Excel export logic: filter to is_selected === true when multiple exist
                    const flattenedAssessments = [];
                    years.forEach(yearObj => {
                        if (yearObj.data && Array.isArray(yearObj.data) && yearObj.data.length > 0) {
                            // Count assessments for this year to match Excel export logic
                            const assessmentCount = yearObj.data.length;
                            
                            // Extract assessments from data array
                            let selectedAssessment = null;
                            
                            // Match Excel export logic: if multiple assessments exist, only use the one with is_selected === true
                            // If only one assessment exists, always use it
                            if (assessmentCount > 1) {
                                // Multiple assessments: only use the one with is_selected === true
                                selectedAssessment = yearObj.data.find(a => a.is_selected === true);
                                // If no selected one found (shouldn't happen), pick the latest by submitted_at
                                if (!selectedAssessment) {
                                    selectedAssessment = yearObj.data.reduce((latest, current) => {
                                        const currentDate = current.submitted_at || current.created_at || '';
                                        const latestDate = latest.submitted_at || latest.created_at || '';
                                        return currentDate > latestDate ? current : latest;
                                    }, yearObj.data[0]);
                                }
                            } else {
                                // Only one assessment: always use it
                                selectedAssessment = yearObj.data[0];
                            }
                            
                            // Use the selected/latest assessment, ensuring all required fields are present
                            flattenedAssessments.push({
                                ...selectedAssessment,
                                year: yearObj.year || selectedAssessment.assessment_year,
                                // Ensure we have the score from the assessment itself
                                score: selectedAssessment.score || yearObj.score,
                                // Ensure we have is_selected and submitted_at from the assessment
                                is_selected: selectedAssessment.is_selected !== undefined ? selectedAssessment.is_selected : (assessmentCount === 1),
                                submitted_at: selectedAssessment.submitted_at || yearObj.last_updated,
                                assessment_year: selectedAssessment.assessment_year || yearObj.year
                            });
                        } else {
                            // Fallback: if no data array, use the year object itself as an assessment
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
                console.error("Error fetching questions:", err);
                setLoading(false);
            });
    }, []);

    // Send data to parent component when it changes
    useEffect(() => {
        if (onDataUpdate && !dataSentRef.current && !loading) {
            onDataUpdate({
                userId: userId,
                yearlyAssessment: yearlyAssessment,
                data: data
            });
            dataSentRef.current = true;
        }
    }, [yearlyAssessment, data, userId, onDataUpdate, loading]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getLatestYear = () => {
        if (yearlyAssessment.length === 0) return 'N/A';

        // Find the maximum year value
        const years = yearlyAssessment.map(item => parseInt(item.year)).filter(year => !isNaN(year));
        if (years.length === 0) return 'N/A';

        return Math.max(...years).toString();
    };

    const getLatestAssessment = () => {
        if (yearlyAssessment.length === 0) return null;

        // Sort by year in descending order and take the first one
        const sortedAssessments = [...yearlyAssessment].sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearB - yearA; // Descending order
        });

        return sortedAssessments[0];
    };

    const getOverallScore = (assessment) => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        // Check if it's the new format with total_score and max_score
        if (assessment.score.total_score !== undefined && assessment.score.max_score !== undefined) {
            return ((assessment.score.total_score / assessment.score.max_score) * 100).toFixed(0);
        }

        // Check if it's the old format with Environment, Social, Governance
        if (assessment.score.Environment !== undefined) {
            const scores = Object.values(assessment.score).filter(val => typeof val === 'number');
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return Math.round(average);
        }

        return null;
    };

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
                    return Math.round((totalScore / totalMax) * 100).toString();
                }
            }
        }

        // Fallback: Use the raw scores and category_max
        if (assessment.score.category_max && assessment.score.category_max[category] !== undefined) {
            const categoryScore = assessment.score[category] || 0;
            const categoryMax = assessment.score.category_max[category] || 1;

            // Convert from raw score to percentage
            return ((categoryScore / categoryMax) * 100).toFixed(0);
        }

        // Handle old format
        if (assessment.score[category] !== undefined) {
            return assessment.score[category];
        }

        return null;
    };


    const getScoreBadge = (score) => {
        if (!score) return 'bg-secondary';
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'bg-secondary';
        if (numScore >= 80) return 'bg-success';
        if (numScore >= 60) return 'bg-warning';
        if (numScore >= 40) return 'bg-orange';
        return 'bg-danger';
    };

    const getScoreStatus = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'N/A';
        if (numScore === 0) return 'YET TO START';
        if (numScore <= 30) return 'BASIC';
        if (numScore <= 50) return 'DEVELOPING';
        if (numScore <= 80) return 'INTERMEDIATE';
        return 'ADVANCED';
    };

    // Prepare data for ESG vs Year line chart
    const prepareESGYearlyData = () => {
        if (!yearlyAssessment || yearlyAssessment.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }

        // Sort assessments by year
        const sortedAssessments = [...yearlyAssessment].sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearA - yearB;
        });

        const years = sortedAssessments.map(item => item.year.toString());
        const environmentScores = [];
        const socialScores = [];
        const governanceScores = [];

        sortedAssessments.forEach(assessment => {
            // Calculate scores for each category
            const envScore = getCategoryScore(assessment, 'Environment');
            const socialScore = getCategoryScore(assessment, 'Social');
            const govScore = getCategoryScore(assessment, 'Governance');

            environmentScores.push(parseFloat(envScore) || 0);
            socialScores.push(parseFloat(socialScore) || 0);
            governanceScores.push(parseFloat(govScore) || 0);
        });

        return {
            labels: years,
            datasets: [
                {
                    label: 'Environment',
                    data: environmentScores,
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Social',
                    data: socialScores,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Governance',
                    data: governanceScores,
                    borderColor: 'rgba(168, 85, 247, 1)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }
            ]
        };
    };

    const esgYearlyData = prepareESGYearlyData();

    // Prepare scatter data (convert to x,y coordinates)
    const prepareScatterData = () => {
        if (!yearlyAssessment || yearlyAssessment.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }

        const sortedAssessments = [...yearlyAssessment].sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearA - yearB;
        });

        const environmentPoints = [];
        const socialPoints = [];
        const governancePoints = [];

        sortedAssessments.forEach((assessment, index) => {
            const envScore = getCategoryScore(assessment, 'Environment');
            const socialScore = getCategoryScore(assessment, 'Social');
            const govScore = getCategoryScore(assessment, 'Governance');

            environmentPoints.push({ x: index, y: parseFloat(envScore) || 0 });
            socialPoints.push({ x: index, y: parseFloat(socialScore) || 0 });
            governancePoints.push({ x: index, y: parseFloat(govScore) || 0 });
        });

        return {
            labels: sortedAssessments.map(item => item.year.toString()),
            datasets: [
                {
                    label: 'Environment',
                    data: environmentPoints,
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                },
                {
                    label: 'Social',
                    data: socialPoints,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                },
                {
                    label: 'Governance',
                    data: governancePoints,
                    borderColor: 'rgba(168, 85, 247, 1)',
                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                    pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }
            ]
        };
    };

    const scatterData = prepareScatterData();

    const getChartOptions = () => {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Poppins, sans-serif',
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                title: {
                    display: true,
                    text: `ESG Performance Over Years - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
                    font: {
                        family: 'Poppins, sans-serif',
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    titleFont: {
                        family: 'Poppins, sans-serif',
                        size: 12,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Poppins, sans-serif',
                        size: 11
                    },
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            if (chartType === 'scatter') {
                                const year = esgYearlyData.labels[context.parsed.x];
                                return `${context.dataset.label} (${year}): ${context.parsed.y}%`;
                            }
                            return `${context.dataset.label}: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Year',
                        font: {
                            family: 'Poppins, sans-serif',
                            size: 12,
                            weight: '500'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Poppins, sans-serif',
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Score (%)',
                        font: {
                            family: 'Poppins, sans-serif',
                            size: 12,
                            weight: '500'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Poppins, sans-serif',
                            size: 11
                        },
                        callback: function (value) {
                            return value + '%';
                        }
                    },
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };

        // Chart-specific options
        if (chartType === 'scatter') {
            return {
                ...baseOptions,
                scales: {
                    ...baseOptions.scales,
                    x: {
                        ...baseOptions.scales.x,
                        type: 'linear',
                        title: {
                            ...baseOptions.scales.x.title,
                            text: 'Assessment Index'
                        }
                    }
                }
            };
        }

        return baseOptions;
    };

    const esgYearlyOptions = getChartOptions();

    // Calculate overall accumulated ESG scores over the years
    const calculateAccumulatedScores = () => {
        if (!yearlyAssessment || yearlyAssessment.length === 0) {
            return {
                environment: 0,
                social: 0,
                governance: 0,
                total: 0,
                average: 0
            };
        }

        let totalEnv = 0;
        let totalSocial = 0;
        let totalGov = 0;
        let validAssessments = 0;

        yearlyAssessment.forEach(assessment => {
            const envScore = parseFloat(getCategoryScore(assessment, 'Environment')) || 0;
            const socialScore = parseFloat(getCategoryScore(assessment, 'Social')) || 0;
            const govScore = parseFloat(getCategoryScore(assessment, 'Governance')) || 0;

            totalEnv += envScore;
            totalSocial += socialScore;
            totalGov += govScore;
            validAssessments++;
        });

        const total = totalEnv + totalSocial + totalGov;
        const average = validAssessments > 0 ? total / (validAssessments * 3) : 0;

        return {
            environment: Math.round(totalEnv / validAssessments) || 0,
            social: Math.round(totalSocial / validAssessments) || 0,
            governance: Math.round(totalGov / validAssessments) || 0,
            total: Math.round(total),
            average: Math.round(average)
        };
    };

    const accumulatedScores = calculateAccumulatedScores();

    const handleViewDetails = (assessment) => {
        navigate(`/admin/assessment-details-v2/${userId}/${assessment.year}`);
    };

    const handleDownloadReport = (assessment) => {
        console.log('Downloading report for assessment:', assessment);
        alert('Download functionality will be implemented soon!');
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="My Assessments" breadcrumb={[["My Assessments", "/my-assessments"], "My Assessments"]} />
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading your assessments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-4">
            {/* Statistics Cards */}
            <div className="row">
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-calendar-check"></i>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-number">{yearlyAssessment.length}</h3>
                            <p className="stat-label">Total Assessments</p>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className="stat-content">
                            <h3 className="stat-number">
                                {getLatestYear()}
                            </h3>
                            <p className="stat-label">Latest Assessment Year</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ESG Performance Chart */}
            {yearlyAssessment.length > 0 && (
                <div className="row">
                    <div className="col-12">
                        <div className="chart-section">
                            <div className="chart-header">
                                <h4 className="section-title">
                                    <i className="fas fa-chart-line me-1"></i>
                                    ESG Performance Trends
                                </h4>
                                <div className="chart-controls">
                                    <div className="chart-info-button" onClick={toggleTooltip}>
                                        <i className="fas fa-info-circle"></i>
                                    </div>
                                    {showTooltip && (
                                        <div className="chart-tooltip">
                                            <div className="tooltip-content">
                                                <h6>ESG Performance Trends</h6>
                                                <p>This chart shows the  ESG performance progression over multiple years. You can switch between Line, Bar, and Scatter views to analyze trends in Environment, Social, and Governance scores. Use this to track your sustainability journey and identify areas for improvement.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="chart-type-selector">
                                        <button
                                            className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
                                            onClick={() => setChartType('line')}
                                            title="Line Chart"
                                        >
                                            <i className="fas fa-chart-line"></i>
                                            Line
                                        </button>
                                        <button
                                            className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                                            onClick={() => setChartType('bar')}
                                            title="Bar Chart"
                                        >
                                            <i className="fas fa-chart-bar"></i>
                                            Bar
                                        </button>
                                        <button
                                            className={`chart-type-btn ${chartType === 'scatter' ? 'active' : ''}`}
                                            onClick={() => setChartType('scatter')}
                                            title="Scatter Chart"
                                        >
                                            <i className="fas fa-chart-scatter"></i>
                                            Scatter
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ESG Summary Cards */}
                            <div className="esg-summary-cards">
                                <div className="row">
                                    <div className="col-lg-3 col-md-6 mb-3">
                                        <div className="esg-summary-card environment">
                                            <div className="esg-summary-icon">
                                                <i className="fas fa-leaf"></i>
                                            </div>
                                            <div className="esg-summary-content">
                                                <h5 className="esg-summary-title">Environment</h5>
                                                <h3 className="esg-summary-score">{accumulatedScores.environment}%</h3>
                                                <p className="esg-summary-label">Average Score</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 mb-3">
                                        <div className="esg-summary-card social">
                                            <div className="esg-summary-icon">
                                                <i className="fas fa-users"></i>
                                            </div>
                                            <div className="esg-summary-content">
                                                <h5 className="esg-summary-title">Social</h5>
                                                <h3 className="esg-summary-score">{accumulatedScores.social}%</h3>
                                                <p className="esg-summary-label">Average Score</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 mb-3">
                                        <div className="esg-summary-card governance">
                                            <div className="esg-summary-icon">
                                                <i className="fas fa-shield-alt"></i>
                                            </div>
                                            <div className="esg-summary-content">
                                                <h5 className="esg-summary-title">Governance</h5>
                                                <h3 className="esg-summary-score">{accumulatedScores.governance}%</h3>
                                                <p className="esg-summary-label">Average Score</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-md-6 mb-3">
                                        <div className="esg-summary-card overall">
                                            <div className="esg-summary-icon">
                                                <i className="fas fa-trophy"></i>
                                            </div>
                                            <div className="esg-summary-content">
                                                <h5 className="esg-summary-title">Overall</h5>
                                                <h3 className="esg-summary-score">{accumulatedScores.average}%</h3>
                                                <p className="esg-summary-label">Average ESG Score</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="chart-card">
                                <div className="chart-container" style={{ height: '400px' }}>
                                    {chartType === 'line' && <Line data={esgYearlyData} options={esgYearlyOptions} />}
                                    {chartType === 'bar' && <Bar data={esgYearlyData} options={esgYearlyOptions} />}
                                    {chartType === 'scatter' && <Scatter data={scatterData} options={esgYearlyOptions} />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <MsmeAnalysis />

            {/* Assessment Cards */}
            <div className="row">
                <div className="col-12">
                    <div className="assessment-section">
                        <h4 className="section-title">
                            <i className="fas fa-history me-1"></i>
                            Assessment History
                        </h4>

                        {yearlyAssessment.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <i className="fas fa-clipboard-list"></i>
                                </div>
                                <h5>No Assessments Found</h5>
                                <p className="text-muted">This firm haven't completed any assessments yet.</p>
                            </div>
                        ) : (
                            <div className="row">
                                {yearlyAssessment.map((item, index) => {
                                    const overallScore = getOverallScore(item);
                                    return (
                                        <div key={index} className="col-lg-4 col-md-6 mb-4">
                                            <div className="assessment-card">
                                                <div className="card-header">
                                                    <div className="year-badge">
                                                        <i className="fas fa-calendar-alt me-1"></i>
                                                        {item.year}
                                                    </div>
                                                    <div className="status-badge completed">
                                                        <i className="fas fa-check-circle me-1"></i>
                                                        Completed
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    <div className="assessment-info">
                                                        <div className="info-item">
                                                            <i className="fas fa-calendar-day"></i>
                                                            <span>Date: {formatDate(item.last_updated)}</span>
                                                        </div>

                                                        {/* Overall Score Display */}
                                                        <div className="info-item">
                                                            <i className="fas fa-star"></i>
                                                            <span>Overall Score:
                                                                <span className={`score-value ${getScoreColor(overallScore)}`}>
                                                                    {overallScore || 'N/A'}%
                                                                </span>
                                                            </span>
                                                        </div>

                                                        {/* ESG Scores Display */}
                                                        {item.score && typeof item.score === 'object' && (
                                                            <div className="esg-scores-preview">
                                                                <div className="esg-score-item">
                                                                    <span className="esg-label">E</span>
                                                                    <span className={`esg-score ${getScoreColor(getCategoryScore(item, 'Environment'))}`}>
                                                                        {getCategoryScore(item, 'Environment') || 'N/A'}%
                                                                    </span>
                                                                </div>
                                                                <div className="esg-score-item">
                                                                    <span className="esg-label">S</span>
                                                                    <span className={`esg-score ${getScoreColor(getCategoryScore(item, 'Social'))}`}>
                                                                        {getCategoryScore(item, 'Social') || 'N/A'}%
                                                                    </span>
                                                                </div>
                                                                <div className="esg-score-item">
                                                                    <span className="esg-label">G</span>
                                                                    <span className={`esg-score ${getScoreColor(getCategoryScore(item, 'Governance'))}`}>
                                                                        {getCategoryScore(item, 'Governance') || 'N/A'}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Score Status */}
                                                        {overallScore && (
                                                            <div className="info-item">
                                                                <i className="fas fa-chart-pie"></i>
                                                                <span className={`badge ${getScoreBadge(overallScore)}`}>
                                                                    {getScoreStatus(overallScore)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="card-footer">
                                                    <button className="btn btn-outline-primary btn-sm me-1" onClick={() => handleViewDetails(item)}>
                                                        <i className="fas fa-eye me-1"></i>
                                                        View Details
                                                    </button>
                                                    <button className="btn btn-outline-secondary btn-sm d-none" onClick={() => handleDownloadReport(item)}>
                                                        <i className="fas fa-download me-1"></i>
                                                        Download Report
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* BUTTON HERE DUMMY UPLOAD NEW SUBMISSION */}
            <button className="btn btn-primary mt-4 d-none" onClick={async () => {
                try {
                    await api.post('/assessment/user/submit-response', {
                            "user_id": "eddysaidin8@gmail.com",
                            "assessment_year": 2024,
                            "responses": [
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "N/A"
                                        },
                                        "category": "Year Selection",
                                        "subCategory": "N/A",
                                        "text": "Assessment Year",
                                        "mark": 0,
                                        "index": 0,
                                        "createdAt": {
                                            "$date": "2026-06-20T02:50:16.337Z"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-20T02:50:16.337Z"
                                        }
                                    },
                                    "answer": "2024"
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538b61f50a323b821792ad"
                                        },
                                        "category": "Prerequisites",
                                        "subCategory": "N/A",
                                        "text": "Please state your firm's average electricity consumption (in kilowatt hours, kWh) per month",
                                        "mark": 0,
                                        "index": 1,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:00:33.294000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:00:33.294000"
                                        }
                                    },
                                    "answer": "1"
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538b61f50a323b821792ae"
                                        },
                                        "category": "Prerequisites",
                                        "subCategory": "N/A",
                                        "text": "Please state your firm's average water consumption (in litres, L) per month",
                                        "mark": 0,
                                        "index": 2,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:00:33.304000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:00:33.304000"
                                        }
                                    },
                                    "answer": "99"
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538b61f50a323b821792af"
                                        },
                                        "category": "Prerequisites",
                                        "subCategory": "N/A",
                                        "text": "Please state the average petrol consumption (in litres, L) per month of your firms' vehicle",
                                        "mark": 0,
                                        "index": 3,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:00:33.315000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:00:33.315000"
                                        }
                                    },
                                    "answer": "34"
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538b61f50a323b821792b0"
                                        },
                                        "category": "Prerequisites",
                                        "subCategory": "N/A",
                                        "text": "Please state the average diesel consumption (in litres, L) per month of your firms' vehicle",
                                        "mark": 0,
                                        "index": 4,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:00:33.339000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:00:33.339000"
                                        }
                                    },
                                    "answer": "95"
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538bb9f50a323b821792b1"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Emission Management",
                                        "text": "My firm's operation (productions, packaging, storage, supply & use) has no adverse impact on biodiversity - including deforestation, ecosystem integrity, natural resource conservation and land degradation ",
                                        "mark": 6,
                                        "index": 1,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:02:01.043000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:02:01.043000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538bb9f50a323b821792b2"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Emission Management",
                                        "text": "My firm is implementing measures to reduce green house gas (GHG emissions) and its carbon footprint (e.g. prioritise digital copies, use hybrid cars, energy-efficient light bulb, paperless operation and others) ",
                                        "mark": 8,
                                        "index": 2,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:02:01.054000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:02:01.054000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538bb9f50a323b821792b3"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Emission Management",
                                        "text": "My firm has a baseline assessment of its carbon/GHG footprint",
                                        "mark": 8,
                                        "index": 3,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:02:01.059000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:02:01.059000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538bb9f50a323b821792b4"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Emission Management",
                                        "text": "My firm is compliant with mandated regulatory requirements such as EU ETS, UK ETS and China National ETS.",
                                        "mark": 9,
                                        "index": 4,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:02:01.070000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:02:01.070000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792b5"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Energy Management",
                                        "text": "My firm is implementing measures to reduce energy consumption (using less energy such as turning off lights and electric appliances when not in use, using programmable thermostats, etc.)",
                                        "mark": 7,
                                        "index": 5,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.601000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.601000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792b6"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Energy Management",
                                        "text": "My firm is implementing measures to improve energy efficiency (using technology that requires less energy such as LED installed lightings, solar panel installation, energy-saving airconds and others)",
                                        "mark": 8,
                                        "index": 6,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.650000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.650000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792b7"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Energy Management",
                                        "text": "My firm's primary energy sources are from renewable resources",
                                        "mark": 9,
                                        "index": 7,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.676000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.676000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792b8"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Water Management",
                                        "text": "My firm is implementing measures to reduce water consumption (e.g. rain harvesting and others)",
                                        "mark": 7,
                                        "index": 8,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.688000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.688000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792b9"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Water Management",
                                        "text": "My firm is implementing initiatives on water efficiencies (e.g. use water saving taps, low-flow showerhead, water heater insulation, high efficiency toilets and others)",
                                        "mark": 8,
                                        "index": 9,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.705000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.705000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792ba"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Waste Management",
                                        "text": "My firm has no significant discharges to land or water as a direct result of the business operations ",
                                        "mark": 6,
                                        "index": 10,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.720000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.720000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792bb"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Waste Management",
                                        "text": "My firm does not generate significant quantities of waste or hazardous waste (e.g. packaging, food, electronics, metal, plastics, wood, cartridges, light tubes, hazardous waste and others)",
                                        "mark": 7,
                                        "index": 11,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.729000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.729000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792bc"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Waste Management",
                                        "text": "My firm has no environmental regulatory issues, breaches, non-compliances, enforcement actions, prosecutions or fines in the last 2 years",
                                        "mark": 8,
                                        "index": 12,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.738000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.738000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538cfbf50a323b821792bd"
                                        },
                                        "category": "Environment",
                                        "subCategory": "Waste Management",
                                        "text": "My firm uses eco-friendly raw materials in my business operation (e.g. recycled rubber, biodegradable plastics, compostable straws and others)",
                                        "mark": 9,
                                        "index": 13,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:07:23.744000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:07:23.744000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538d7ff50a323b821792be"
                                        },
                                        "category": "Social",
                                        "subCategory": "Labour Practices & Standards ",
                                        "text": "My firm meets the current Minimum Wage rate for all employees",
                                        "mark": 5,
                                        "index": 1,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:09:35.693000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:09:35.693000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538d7ff50a323b821792bf"
                                        },
                                        "category": "Social",
                                        "subCategory": "Labour Practices & Standards",
                                        "text": "My firm meets minimum age of 18 years old for all full-time employees",
                                        "mark": 5,
                                        "index": 2,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:09:35.700000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:09:35.700000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538d7ff50a323b821792c0"
                                        },
                                        "category": "Social",
                                        "subCategory": "Labour Practices & Standards",
                                        "text": "My firm adheres to minimum standards of human rights for all employees ",
                                        "mark": 5,
                                        "index": 3,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:09:35.706000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:09:35.706000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538d7ff50a323b821792c1"
                                        },
                                        "category": "Social",
                                        "subCategory": "Labour Practices & Standards",
                                        "text": "My firm has a policy which sets out clear commitments and targets to support gender equality, racial diversity & equal opportunity and remuneration ",
                                        "mark": 7,
                                        "index": 4,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:09:35.714000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:09:35.714000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538d7ff50a323b821792c2"
                                        },
                                        "category": "Social",
                                        "subCategory": "Labour Practices & Standards",
                                        "text": "My firm is not involved in any issues in relation to unfair labour practices, human rights abuses or other malpractices and there have been no such issues in the past 2 years",
                                        "mark": 6,
                                        "index": 5,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:09:35.721000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:09:35.721000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e13f50a323b821792c3"
                                        },
                                        "category": "Social",
                                        "subCategory": "Safety & Health",
                                        "text": "My firm has an occupational health & safety (OHS) policy which sets out clear commitments and targets ",
                                        "mark": 5,
                                        "index": 6,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:12:03.617000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:12:03.617000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e13f50a323b821792c4"
                                        },
                                        "category": "Social",
                                        "subCategory": "Safety & Health",
                                        "text": "My firm has insurance policies in place for employees and industrial injury claims",
                                        "mark": 5,
                                        "index": 7,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:12:03.624000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:12:03.624000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e13f50a323b821792c5"
                                        },
                                        "category": "Social",
                                        "subCategory": "Safety & Health",
                                        "text": "My firm implements OHS management system",
                                        "mark": 6,
                                        "index": 8,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:12:03.631000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:12:03.631000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e13f50a323b821792c6"
                                        },
                                        "category": "Social",
                                        "subCategory": "Safety & Health",
                                        "text": "My firm monitors and reports to relevant parties on any workplace incidents, accidents and near misses",
                                        "mark": 7,
                                        "index": 9,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:12:03.643000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:12:03.643000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e13f50a323b821792c7"
                                        },
                                        "category": "Social",
                                        "subCategory": "Safety & Health",
                                        "text": "My firm has none or very miminal workplace incidents, accidents and near misses",
                                        "mark": 7,
                                        "index": 10,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:12:03.651000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:12:03.651000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e87f50a323b821792c8"
                                        },
                                        "category": "Social",
                                        "subCategory": "Employee Benefits",
                                        "text": "All my employees have formal contracts of employment",
                                        "mark": 5,
                                        "index": 11,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:13:59.541000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:13:59.541000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e87f50a323b821792c9"
                                        },
                                        "category": "Social",
                                        "subCategory": "Employee Benefits",
                                        "text": "My employees are able to share their views and concerns and are responded to",
                                        "mark": 5,
                                        "index": 12,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:13:59.551000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:13:59.551000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e87f50a323b821792ca"
                                        },
                                        "category": "Social",
                                        "subCategory": "Employee Benefits",
                                        "text": "My firm has policy which supports freedom of association, the right to organise and collective bargaining in its operations and throughout its supply chain",
                                        "mark": 5,
                                        "index": 13,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:13:59.587000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:13:59.587000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e87f50a323b821792cb"
                                        },
                                        "category": "Social",
                                        "subCategory": "Employee Benefits",
                                        "text": "My firm has a formal and functional grievance mechanism for employees",
                                        "mark": 7,
                                        "index": 14,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:13:59.596000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:13:59.596000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e87f50a323b821792cc"
                                        },
                                        "category": "Social",
                                        "subCategory": "Employee Benefits",
                                        "text": "My firm offers employee benefits programmes such as training, child care, etc.",
                                        "mark": 7,
                                        "index": 15,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:13:59.629000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:13:59.629000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e87f50a323b821792cd"
                                        },
                                        "category": "Social",
                                        "subCategory": "Employee Benefits",
                                        "text": "My firm offers employee health benefits and preventive care",
                                        "mark": 7,
                                        "index": 16,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:13:59.646000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:13:59.646000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538e87f50a323b821792ce"
                                        },
                                        "category": "Social",
                                        "subCategory": "Corporate Social Responsibility",
                                        "text": "My firm provides sponsorships / donations or have formal community development programmes",
                                        "mark": 6,
                                        "index": 17,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:13:59.677000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:13:59.677000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538ef6f50a323b821792cf"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Culture & Commitments",
                                        "text": "My firm has documented vision, mission, values and principles",
                                        "mark": 4,
                                        "index": 1,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:15:50.655000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:15:50.655000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538ef6f50a323b821792d0"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Culture & Commitments",
                                        "text": "My  firm has a clear organisational structure with defined roles, responsibilities, reporting lines and authorities",
                                        "mark": 5,
                                        "index": 2,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:15:50.668000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:15:50.668000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538ef6f50a323b821792d1"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Culture & Commitments",
                                        "text": "My firm has a clear shareholder participation policy including roles and responsibilities",
                                        "mark": 5,
                                        "index": 3,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:15:50.677000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:15:50.677000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538ef6f50a323b821792d2"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Culture & Commitments",
                                        "text": "My firm abides by code of ethics / conduct or values statement to guide firm conduct with honesty and integrity",
                                        "mark": 6,
                                        "index": 4,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:15:50.706000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:15:50.706000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538ef6f50a323b821792d3"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Culture & Commitments",
                                        "text": "My firm has no present or potential lawsuits that could compromise the firm's adherence to its code of ethics / conduct or values statements ",
                                        "mark": 6,
                                        "index": 5,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:15:50.740000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:15:50.740000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538f25f50a323b821792d4"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Integrity / Anti- Corruption",
                                        "text": "My firm has a policy on gifts / corporate entertaining / anti-corruption that is consistent with its code of ethics / conduct or values statement",
                                        "mark": 4,
                                        "index": 6,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:16:37.317000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:16:37.317000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538f25f50a323b821792d5"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Integrity / Anti- Corruption",
                                        "text": "My firm has a whistle-blowing policy that is accessible, independently managed and anonymous",
                                        "mark": 4,
                                        "index": 7,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:16:37.329000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:16:37.329000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538f25f50a323b821792d6"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Integrity / Anti- Corruption",
                                        "text": "My firm has incorporated Anti-Bribery Management Systems (e.g. ISO 37001)",
                                        "mark": 6,
                                        "index": 8,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:16:37.338000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:16:37.338000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538f25f50a323b821792d7"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Integrity / Anti- Corruption",
                                        "text": "My firm has no present or potential lawsuits that could compromise the company's adherence to its anti-corruption practice",
                                        "mark": 5,
                                        "index": 9,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:16:37.348000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:16:37.348000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792d8"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Risk Governance & Internal Controls",
                                        "text": "My firm has internal control processes to examine issues related to business practices and risks as well as how to control it",
                                        "mark": 4,
                                        "index": 10,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.225000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.225000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792d9"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Risk Governance & Internal Controls",
                                        "text": "My firm undergoes external audit to examine financial records",
                                        "mark": 6,
                                        "index": 11,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.234000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.234000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792da"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Decision Making & Strategic Oversight",
                                        "text": "My firm has advisor / advisers comprising mentors / trusted fellow entrepreneurs",
                                        "mark": 4,
                                        "index": 12,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.246000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.246000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792db"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Decision Making & Strategic Oversight",
                                        "text": "My firm has a succession plan to develop people within the firm to fill key positions in the future ",
                                        "mark": 5,
                                        "index": 13,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.254000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.254000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792dc"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Decision Making & Strategic Oversight",
                                        "text": "My firm has undertaken innovation in the last 2 years to adopt innovative solutions to achieve business efficiency and competitiveness",
                                        "mark": 6,
                                        "index": 14,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.261000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.261000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792dd"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Decision Making & Strategic Oversight",
                                        "text": "My firm has a Business Continuity Plan to address future uncertainties ",
                                        "mark": 6,
                                        "index": 15,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.269000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.269000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792de"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Decision Making & Strategic Oversight",
                                        "text": "My firm has an ESG policy which sets out clear commitments and targets to improve ESG performance and management ",
                                        "mark": 7,
                                        "index": 16,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.276000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.276000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792df"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Disclosure, Transparency & Data Protection",
                                        "text": "My firm uses accurate and transparent accounting methods ",
                                        "mark": 4,
                                        "index": 17,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.283000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.283000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792e0"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Disclosure, Transparency & Data Protection",
                                        "text": "My firm practices responsible financial and non-financial disclosure consistent with the company's code of ethics / conduct or value statements",
                                        "mark": 5,
                                        "index": 18,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.291000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.291000"
                                        }
                                    },
                                    "answer": false
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792e1"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Disclosure, Transparency & Data Protection",
                                        "text": "My firm has policies which set out clear commitments and targets to improve data protection, privacy and security",
                                        "mark": 4,
                                        "index": 19,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.299000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.299000"
                                        }
                                    },
                                    "answer": true
                                },
                                {
                                    "question": {
                                        "_id": {
                                            "$oid": "68538fb3f50a323b821792e2"
                                        },
                                        "category": "Governance",
                                        "subCategory": "Disclosure, Transparency & Data Protection",
                                        "text": "My firm has not experienced any breaches in cyber security within the last 2 years ",
                                        "mark": 4,
                                        "index": 20,
                                        "createdAt": {
                                            "$date": "2026-06-19T04:18:59.306000"
                                        },
                                        "updatedAt": {
                                            "$date": "2026-06-19T04:18:59.306000"
                                        }
                                    },
                                    "answer": false
                                }
                            ]
                        });

                    Swal.fire({
                        icon: 'success',
                        title: 'Assessment Submitted',
                        text: 'Your responses have been saved successfully.',
                        timer: 1200,
                        showConfirmButton: false
                    });
                } catch (err) {
                    console.error("Save error:", err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'There was an error saving your responses. Please try again.',
                        timer: 1200,
                        showConfirmButton: false
                    });
                }
            }}>TEST SUBMIT ASSESSMENT</button>
        </div>
    );
}

export default Assesments;