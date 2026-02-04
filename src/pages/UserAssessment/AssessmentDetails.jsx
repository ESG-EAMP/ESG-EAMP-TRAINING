import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Title from '../../layouts/Title/Title';
import ESGScoreChart from './ESGScoreChart';
import './AssessmentDetails.css';
import api from '../../utils/api';
import { getScoreColor } from '../../utils/scoreUtils';

function AssessmentDetails() {
    const { year } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [assessmentResponses, setAssessmentResponses] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('agolix-summary');
    const [activeCategory, setActiveCategory] = useState('');
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const agolixRef = useRef(null);
    const user_email = localStorage.getItem('user_email');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            console.error('User ID not found. Please log in again.');
            setLoading(false);
            return;
        }
        // Fetch assessment details
        api.get(`/assessment/user/get-responses?user_id=${userId}&selected_only=true&assessment_year=${year}`)
            .then(res => {
                const data = res.data;
                setAssessment(data[0]);
                setAssessmentResponses(data[0]?.years[0]?.data[0]?.responses);

                // Set initial active category
                if (data[0]?.years[0]?.data[0]?.responses) {
                    const categories = [...new Set(data[0].years[0].data[0].responses.map(response => response.question.category))];
                    setActiveCategory(categories[0] || '');
                }

                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching assessment details:", err);
                setLoading(false);
            });
    }, [year]);

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

    const formatDuration = (duration) => {
        if (!duration) return 'N/A';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}m ${seconds}s`;
    };

    const getScoreStatus = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'N/A';
        if (numScore === 0) return 'Yet to Start';
        if (numScore <= 30) return 'Basic';
        if (numScore <= 50) return 'Developing';
        if (numScore <= 80) return 'Intermediate';
        return 'Advanced';
    };

    const getScoreDescription = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'No data available';
        if (numScore === 0) return 'Does not practise or implement any ESG indicators. Needs significant guidance / assistance on ESG from experts.';
        if (numScore <= 30) return 'Limited practise or implementation of ESG indicators. Aware on ESG but needs more indepth knowledge on the importance of ESG practices.';
        if (numScore <= 50) return 'Has some experience in practising or implementing ESG. Understand the importance of ESG practices and gradually ramping up efforts on ESG.';
        if (numScore <= 80) return 'Has ample experience in practising or implementing ESG. Has big opportunity to be an ESG champion among MSMEs.';
        return 'Has proficient experience in practising or implementing ESG. ESG champion among MSMEs. Can be recommended to supply products / services to large firms.';
    };


    const getScoreBadge = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'bg-secondary';
        if (numScore === 0) return 'bg-danger';
        if (numScore <= 30) return 'bg-warning';
        if (numScore <= 50) return 'bg-info';
        if (numScore <= 80) return 'bg-primary';
        return 'bg-success';
    };

    const getGroupedResponses = () => {
        if (!assessmentResponses) return {};

        return assessmentResponses.reduce((acc, response, index) => {
            const category = response.question.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({ ...response, originalIndex: index + 1 });
            return acc;
        }, {});
    };

    const getBestPerformingArea = () => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        const scores = {
            Environment: assessment.score.Environment,
            Social: assessment.score.Social,
            Governance: assessment.score.Governance
        };

        const bestArea = Object.entries(scores).reduce((best, [area, score]) => {
            return score > best.score ? { area, score } : best;
        }, { area: null, score: -1 });

        return bestArea.area ? { area: bestArea.area, score: bestArea.score } : null;
    };

    const getWorstPerformingArea = () => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        const scores = {
            Environment: assessment.score.Environment,
            Social: assessment.score.Social,
            Governance: assessment.score.Governance
        };

        const worstArea = Object.entries(scores).reduce((worst, [area, score]) => {
            return score < worst.score ? { area, score } : worst;
        }, { area: null, score: 101 });

        return worstArea.area ? { area: worstArea.area, score: worstArea.score } : null;
    };

    const groupedResponses = getGroupedResponses();
    const categories = Object.keys(groupedResponses);
    const overallScore = ((assessment?.score?.total_score / assessment?.score?.max_score) * 100).toFixed(0);
    const bestArea = getBestPerformingArea();
    const worstArea = getWorstPerformingArea();

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Assessment Details" breadcrumb={[["My Assessments", "/my-assessments"], "Assessment Details"]} />
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading assessment details...</p>
                </div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="container-fluid">
                <Title title="Assessment Details" breadcrumb={[["My Assessments", "/my-assessments"], "Assessment Details"]} />
                <div className="error-state">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h5>Assessment Not Found</h5>
                    <p className="text-muted">The requested assessment could not be found.</p>
                    <button className="btn" onClick={() => navigate('/my-assessments')}>
                        <i className="fas fa-arrow-left me-1"></i>
                        Back to Assessments
                    </button>
                </div>
            </div>
        );
    }

    const downloadReport = async () => {
        setIsGeneratingPDF(true);
        const previousTab = activeTab;
        try {
            // Ensure Report tab content is rendered
            if (previousTab !== 'agolix-summary') {
                setActiveTab('agolix-summary');
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            const element = agolixRef.current || document.querySelector('.agolix-summary-tab');
            if (!element) {
                console.error('Report section not found');
                return;
            }

            // Wait for dynamic content (charts/fonts) to settle in the live DOM
            await new Promise(resolve => setTimeout(resolve, 800));

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const marginX = 10; // side margins
            const headerHeight = 20; // space for header text

            // Function to add header to each page
            const addHeader = () => {
                pdf.setFontSize(16);
                pdf.text('ESG Assessment Report', pageWidth / 2, 12, { align: 'center' });
                pdf.setFontSize(11);
                pdf.text(`${user?.firm_name || 'Company Name'} - ${year} Assessment`, pageWidth / 2, 18, { align: 'center' });
            };

            // Function to add a section to PDF
            const addSectionToPDF = async (sectionElement, sectionTitle = '') => {
                if (!sectionElement) return;

                const canvas = await html2canvas(sectionElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    height: sectionElement.scrollHeight,
                    width: sectionElement.scrollWidth
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - marginX * 2;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = headerHeight + 10;

                // Add header with section title if provided
                addHeader();
                if (sectionTitle) {
                    pdf.setFontSize(14);
                    pdf.text(sectionTitle, marginX, position - 5);
                    position += 10;
                }

                pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
                heightLeft -= (pageHeight - headerHeight - 20);

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight + headerHeight + 10;
                    pdf.addPage();
                    addHeader();
                    pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
                    heightLeft -= (pageHeight - headerHeight - 10);
                }
            };

            // Add cover page
            pdf.setFontSize(20);
            pdf.text('ESG Assessment Report', pageWidth / 2, 100, { align: 'center' });
            pdf.setFontSize(16);
            pdf.text(`${user?.firm_name || 'Company Name'}`, pageWidth / 2, 120, { align: 'center' });
            pdf.setFontSize(14);
            pdf.text(`Assessment Year: ${year}`, pageWidth / 2, 140, { align: 'center' });
            pdf.setFontSize(12);

            // Find different sections with more specific selectors
            const chartSection = element.querySelector('.esg-chart-container');
            const breakdownSection = element.querySelector('.card.border-0.shadow-sm.mb-4');

            console.log('Chart section found:', !!chartSection);
            console.log('Breakdown section found:', !!breakdownSection);

            // Add chart section (ESG Score Chart) - only once
            if (chartSection) {
                pdf.addPage();
                await addSectionToPDF(chartSection, 'ESG Score by Indicators');
            } else {
                console.warn('Chart section not found, trying alternative selector');
                const altChartSection = element.querySelector('.chart-container');
                if (altChartSection) {
                    pdf.addPage();
                    await addSectionToPDF(altChartSection, 'ESG Score by Indicators');
                }
            }

            // Add breakdown section - only once
            if (breakdownSection) {
                pdf.addPage();
                await addSectionToPDF(breakdownSection);
            } else {
                console.warn('Breakdown section not found, trying alternative selector');
                const altBreakdownSection = element.querySelector('.card');
                if (altBreakdownSection) {
                    pdf.addPage();
                    await addSectionToPDF(altBreakdownSection);
                }
            }

            const fileName = `ESG_Assessment_Report_${user?.firm_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company'}_${year}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            // Restore previous tab if changed
            if (previousTab !== 'agolix-summary') {
                setActiveTab(previousTab);
            }
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className={`container-fluid ${isGeneratingPDF ? 'pdf-generating' : ''}`}>
            <Title title={`${year} Assessment Details`} breadcrumb={[["My Assessments", "/my-assessments"], "Assessment Details"]} />

            {/* Header Section */}
            <div className="assessment-details-header">
                <div className="header-background">
                    <div className="header-pattern"></div>
                </div>
                <div className="header-content ps-3">

                    <div className="mb-2">
                        <button
                            className="btn text-white btn-sm"
                            onClick={() => window.history.back()}
                        >
                            <i className="fas fa-arrow-left me-1"></i>
                            Back to Assessments
                        </button>
                    </div>
                    <div className="row align-items-center">
                        <div className="col-lg-8">
                            <div className="header-main">
                                {/* Back Button */}

                                <div className="header-badge">
                                    <i className="fas fa-chart-line"></i>
                                    <span>ESG Assessment Report</span>
                                </div>
                                <h1 className="assessment-title">
                                    {year} Assessment Results
                                </h1>
                                <p className="header-description">
                                    Comprehensive analysis of your Environmental, Social, and Governance performance metrics
                                </p>
                                <div className="header-meta">
                                    <div className="meta-item">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span>Completed: {formatDate(assessment.last_updated)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="fas fa-building"></i>
                                        <span>{user.firm_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="header-score-section">
                                <div className="score-card">
                                    <div className="score-header">
                                        <h3>Overall Performance</h3>
                                        <div className="score-trend d-none">
                                            <i className="fas fa-arrow-up"></i>
                                            <span>+5.2%</span>
                                        </div>
                                    </div>
                                    <div className="score-main">
                                        <div className="score-circle">
                                            <div className={`score-ring ${getScoreStatus(overallScore).toLowerCase()}`}>
                                                <svg className="score-progress" viewBox="0 0 100 100">
                                                    <circle
                                                        className="score-progress-bg"
                                                        cx="50"
                                                        cy="50"
                                                        r="45"
                                                        strokeWidth="8"
                                                        fill="none"
                                                    />
                                                    <circle
                                                        className="score-progress-fill"
                                                        cx="50"
                                                        cy="50"
                                                        r="45"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        style={{
                                                            strokeDasharray: `${2 * Math.PI * 45}`,
                                                            strokeDashoffset: `${2 * Math.PI * 45 * (1 - (overallScore || 0) / 100)}`
                                                        }}
                                                    />
                                                </svg>
                                                <div className="score-center">
                                                    <span className="score-number">{overallScore || '0'}</span>
                                                    <span className="score-percent">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="score-status mt-3">
                                            <span className={`status-badge ${getScoreBadge(overallScore)}`}>
                                                {getScoreStatus(overallScore)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="score-footer d-none">
                                        <div className="score-comparison">
                                            <span className="comparison-label">vs Industry Avg</span>
                                            <span className="comparison-value">+12.3%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="assessment-tabs">
                <div className="nav nav-tabs" role="tablist">
                    <button
                            className={`nav-link ${activeTab === 'agolix-summary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('agolix-summary')}
                        >
                        <i className="fas fa-file-alt me-1"></i>
                        Report
                    </button>
                    <button
                        className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        <i className="fas fa-file-alt me-1"></i>
                        Summary
                    </button>
                    <button
                        className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-chart-pie me-1"></i>
                        Overview
                    </button>
                    <button
                        className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        <i className="fas fa-list-alt me-1"></i>
                        Details
                    </button>
                    <button
                        className={`nav-link ${activeTab === 'responses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('responses')}
                    >
                        <i className="fas fa-comments me-1"></i>
                        Responses
                    </button>
                    <button
                        className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <i className="fas fa-chart-line me-1"></i>
                        Analytics
                    </button>
                </div>
            </div>
            

            {/* Tab Content */}
            <div className="tab-content">
                {/* Report Tab */}
                {activeTab === 'agolix-summary' && (
                    <div className="agolix-summary-tab" ref={agolixRef}>
                        <div className="row">
                            {/* Letter Section */}
                            <div className="col-12">
                                <div className="mb-5">
                                    <p className="text-muted mb-2">Dear {user?.firm_name || 'Valued Customer'},</p>
                                    <p className="lead">
                                        Congratulations! You have taken the first step towards understanding your firm's ESG performance level. 
                                        This assessment, completed on {formatDate(assessment?.last_updated)}, provides valuable insights into your company's 
                                        environmental, social, and governance practices.
                                    </p>
                                    <p>
                                        Below is a detailed breakdown of your ESG performance across key indicators. 
                                        Use these insights to identify areas of strength and opportunities for improvement 
                                        in your sustainability journey.
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <h5 className="text-secondary mb-4">ESG Score by Indicators (Year {year})</h5>
                                    <ESGScoreChart score={assessment?.score} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                    <div className="summary-tab">
                        <div className="row">
                            {/* Methodology Section */}
                            <div className="col-12">
                                <div className="methodology-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-graduation-cap me-1"></i>
                                        ESG Scoring Methodology
                                    </h4>
                                    <div className="methodology-content">
                                        <p className="methodology-intro">
                                            For the Overall ESG scoring, scoring by element E, S & G as well as scoring by Indicators,
                                            the range being used to classify the level of ESG practise is as described below:
                                        </p>
                                        <div className="methodology-grid">
                                            <div className="methodology-item yet-to-start">
                                                <div className="score-range">0%</div>
                                                <div className="score-level">Yet to Start</div>
                                                <div className="score-desc">Does not practise or implement any ESG indicators</div>
                                            </div>
                                            <div className="methodology-item basic">
                                                <div className="score-range">1 - 30%</div>
                                                <div className="score-level">Basic</div>
                                                <div className="score-desc">Limited practise or implementation of ESG indicators</div>
                                            </div>
                                            <div className="methodology-item developing">
                                                <div className="score-range">31 - 50%</div>
                                                <div className="score-level">Developing</div>
                                                <div className="score-desc">Has some experience in practising or implementing ESG</div>
                                            </div>
                                            <div className="methodology-item intermediate">
                                                <div className="score-range">51 - 80%</div>
                                                <div className="score-level">Intermediate</div>
                                                <div className="score-desc">Has ample experience in practising or implementing ESG</div>
                                            </div>
                                            <div className="methodology-item advanced">
                                                <div className="score-range">81 - 100%</div>
                                                <div className="score-level">Advanced</div>
                                                <div className="score-desc">Has proficient experience in practising or implementing ESG</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prerequisites Section */}
                            <div className="col-lg-6">
                                <div className="prerequisites-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-clipboard-list me-1"></i>
                                        Prerequisites & Resource Consumption
                                    </h4>
                                    <div className="prerequisites-content">
                                        {assessmentResponses ? (
                                            <div className="prerequisites-grid">
                                                {/* Electricity Consumption */}
                                                <div className="prerequisite-item">
                                                    <div className="prerequisite-header">
                                                        <div className="prerequisite-icon">
                                                            <i className="fas fa-bolt"></i>
                                                        </div>
                                                        <div className="prerequisite-title">Electricity Consumption</div>
                                                    </div>
                                                    <div className="prerequisite-value">
                                                        {assessment.consumption["Electricity Consumption"] ? (
                                                            <span className="consumption-value">
                                                                {assessment.consumption["Electricity Consumption"]} kWh/month
                                                            </span>
                                                        ) : (
                                                            <span className="no-data">Not provided</span>
                                                        )
                                                        }
                                                    </div>
                                                </div>

                                                {/* Water Consumption */}
                                                <div className="prerequisite-item">
                                                    <div className="prerequisite-header">
                                                        <div className="prerequisite-icon">
                                                            <i className="fas fa-tint"></i>
                                                        </div>
                                                        <div className="prerequisite-title">Water Consumption</div>
                                                    </div>
                                                    <div className="prerequisite-value">
                                                        {assessment.consumption["Water Consumption"] ? (
                                                            <span className="consumption-value">
                                                                {assessment.consumption["Water Consumption"]} L/month
                                                            </span>
                                                        ) : (
                                                            <span className="no-data">Not provided</span>
                                                        )
                                                        }
                                                    </div>
                                                </div>

                                                {/* Petrol Consumption */}
                                                <div className="prerequisite-item">
                                                    <div className="prerequisite-header">
                                                        <div className="prerequisite-icon">
                                                            <i className="fas fa-gas-pump"></i>
                                                        </div>
                                                        <div className="prerequisite-title">Petrol Consumption</div>
                                                    </div>
                                                    <div className="prerequisite-value">
                                                        {assessment.consumption["Petrol Consumption"] ? (
                                                            <span className="consumption-value">
                                                                {assessment.consumption["Petrol Consumption"]} L/month
                                                            </span>
                                                        ) : (
                                                            <span className="no-data">Not provided</span>
                                                        )
                                                        }
                                                    </div>
                                                </div>

                                                {/* Diesel Consumption */}
                                                <div className="prerequisite-item">
                                                    <div className="prerequisite-header">
                                                        <div className="prerequisite-icon">
                                                            <i className="fas fa-truck"></i>
                                                        </div>
                                                        <div className="prerequisite-title">Diesel Consumption</div>
                                                    </div>
                                                    <div className="prerequisite-value">
                                                        {assessment.consumption["Diesel Consumption"] ? (
                                                            <span className="consumption-value">
                                                                {assessment.consumption["Diesel Consumption"]} L/month
                                                            </span>
                                                        ) : (
                                                            <span className="no-data">Not provided</span>
                                                        )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="no-prerequisites">
                                                <i className="fas fa-clipboard-list"></i>
                                                <p>No prerequisite data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ESG Performance Section */}
                            <div className="col-lg-6">
                                <div className="esg-summary-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-chart-pie me-1"></i>
                                        ESG Performance Summary
                                    </h4>
                                    <div className="esg-summary-content">
                                        {assessment.score && typeof assessment.score === 'object' ? (
                                            <>
                                                {/* Overall Score Card */}
                                                <div className="summary-overall-score">
                                                    <div className="summary-score-header">
                                                        <div className="summary-score-icon">
                                                            <i className="fas fa-trophy"></i>
                                                        </div>
                                                        <div className="summary-score-info">
                                                            <h5>Overall ESG Score</h5>
                                                            <div className="summary-score-display">
                                                                <span className="summary-score-number">{overallScore}</span>
                                                                <span className="summary-score-percent">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="summary-score-status d-none">
                                                        <span className={`status-badge ${getScoreBadge(overallScore)}`}>
                                                            {getScoreStatus(overallScore)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* ESG Breakdown */}
                                                <div className="summary-esg-breakdown">
                                                    <div className="summary-esg-item environment">
                                                        <div className=" d-flex justify-content-between">
                                                            <div className="summary-esg-header"> <div className="summary-esg-icon">
                                                                <i className="fas fa-leaf"></i>
                                                            </div>
                                                                <div className="summary-esg-info">
                                                                    <span className="summary-esg-title">Environment</span>
                                                                    <span className="summary-esg-score">{assessment.score.Environment}%</span>
                                                                </div></div>
                                                            <div>
                                                                <span className={`status-badge ${getScoreBadge(overallScore)}`}>
                                                                    {getScoreStatus(overallScore)}
                                                                </span>
                                                            </div>

                                                        </div>
                                                        <div className="summary-esg-bar">
                                                            <div className="summary-bar-bg">
                                                                <div
                                                                    className="summary-bar-fill environment"
                                                                    style={{ width: `${assessment.score.Environment}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="summary-esg-item social">
                                                        <div className=" d-flex justify-content-between">
                                                            <div className="summary-esg-header"> <div className="summary-esg-icon">
                                                                <i className="fas fa-users"></i>
                                                            </div>
                                                                <div className="summary-esg-info">
                                                                    <span className="summary-esg-title">Social</span>
                                                                    <span className="summary-esg-score">{assessment.score.Social}%</span>
                                                                </div></div>
                                                            <div>
                                                                <span className={`status-badge ${getScoreBadge(overallScore)}`}>
                                                                    {getScoreStatus(overallScore)}
                                                                </span>
                                                            </div>

                                                        </div>
                                                        <div className="summary-esg-bar">
                                                            <div className="summary-bar-bg">
                                                                <div
                                                                    className="summary-bar-fill social"
                                                                    style={{ width: `${assessment.score.Social}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="summary-esg-item governance">
                                                        <div className=" d-flex justify-content-between">
                                                            <div className="summary-esg-header"> <div className="summary-esg-icon">
                                                                <i className="fas fa-shield-alt"></i>
                                                            </div>
                                                                <div className="summary-esg-info">
                                                                    <span className="summary-esg-title">Governance</span>
                                                                    <span className="summary-esg-score">{assessment.score.Governance}%</span>
                                                                </div></div>
                                                            <div>
                                                                <span className={`status-badge ${getScoreBadge(overallScore)}`}>
                                                                    {getScoreStatus(overallScore)}
                                                                </span>
                                                            </div>

                                                        </div>
                                                        <div className="summary-esg-bar">
                                                            <div className="summary-bar-bg">
                                                                <div
                                                                    className="summary-bar-fill governance"
                                                                    style={{ width: `${assessment.score.Governance}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Performance Insights */}
                                                <div className="summary-insights">
                                                    <h6 className="insights-title">
                                                        <i className="fas fa-lightbulb me-1"></i>
                                                        Key Insights
                                                    </h6>
                                                    <div className="insights-content">
                                                        <div className="insight-item">
                                                            <i className="fas fa-star text-warning"></i>
                                                            <span>Best performing area: <strong>{bestArea ? `${bestArea.area} (${bestArea.score}%)` : 'N/A'}</strong></span>
                                                        </div>
                                                        <div className="insight-item">
                                                            <i className="fas fa-exclamation-triangle text-warning"></i>
                                                            <span>Needs attention: <strong>{worstArea ? `${worstArea.area} (${worstArea.score}%)` : 'N/A'}</strong></span>
                                                        </div>
                                                        <div className="insight-item">
                                                            <i className="fas fa-chart-line text-info"></i>
                                                            <span>Overall performance: <strong>{getScoreStatus(overallScore)}</strong></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="no-esg-data">
                                                <i className="fas fa-chart-pie"></i>
                                                <p>No ESG performance data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="row">
                            {/* Key Metrics */}
                            <div className="col-12">
                                <div className="metrics-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-tachometer-alt me-1"></i>
                                        Key Metrics
                                    </h4>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <div className="metric-card">
                                                <div className="metric-icon">
                                                    <i className="fas fa-building"></i>
                                                </div>
                                                <div className="metric-content">
                                                    <h5>Firm Name</h5>
                                                    <p className="metric-value">
                                                        {user.firm_name || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <div className="metric-card">
                                                <div className="metric-icon">
                                                    <i className="fas fa-calendar-alt"></i>
                                                </div>
                                                <div className="metric-content">
                                                    <h5>Assessment Year</h5>
                                                    <p className="metric-value">{year}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <div className="metric-card">
                                                <div className="metric-icon">
                                                    <i className="fas fa-calendar-day"></i>
                                                </div>
                                                <div className="metric-content">
                                                    <h5>Completion Date</h5>
                                                    <p className="metric-value">{formatDate(assessment.last_updated)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <div className="metric-card">
                                                <div className="metric-icon">
                                                    <i className="fas fa-star"></i>
                                                </div>
                                                <div className="metric-content">
                                                    <h5>Overall Score</h5>
                                                    <p className={`metric-value ${getScoreColor(overallScore)}`}>
                                                        {overallScore || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ESG Score Breakdown */}
                            <div className="col-12">
                                <div className="score-breakdown">
                                    <h4 className="section-title">
                                        <i className="fas fa-chart-pie me-1"></i>
                                        ESG Performance
                                    </h4>
                                    <div className="esg-dashboard">
                                        {assessment.score && typeof assessment.score === 'object' && (
                                            <>
                                                {/* ESG Grid - Horizontal Layout */}
                                                <div className="esg-grid-horizontal">
                                                    {/* Environment */}
                                                    <div className="esg-card environment">
                                                        <div className="esg-card-header">
                                                            <div className="esg-icon-wrapper">
                                                                <i className="fas fa-leaf"></i>
                                                            </div>
                                                            <div className="esg-card-title">Environment</div>
                                                        </div>
                                                        <div className="esg-card-content">
                                                            <div className="esg-score-display">
                                                                <span className="esg-score-number">{assessment.score.Environment}</span>
                                                                <span className="esg-score-unit">%</span>
                                                            </div>
                                                            <div className="esg-score-bar">
                                                                <div className="esg-bar-bg">
                                                                    <div
                                                                        className="esg-bar-fill"
                                                                        style={{ width: `${assessment.score.Environment}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <div className="esg-score-label">
                                                                {getScoreStatus(assessment.score.Environment)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Social */}
                                                    <div className="esg-card social">
                                                        <div className="esg-card-header">
                                                            <div className="esg-icon-wrapper">
                                                                <i className="fas fa-users"></i>
                                                            </div>
                                                            <div className="esg-card-title">Social</div>
                                                        </div>
                                                        <div className="esg-card-content">
                                                            <div className="esg-score-display">
                                                                <span className="esg-score-number">{assessment.score.Social}</span>
                                                                <span className="esg-score-unit">%</span>
                                                            </div>
                                                            <div className="esg-score-bar">
                                                                <div className="esg-bar-bg">
                                                                    <div
                                                                        className="esg-bar-fill"
                                                                        style={{ width: `${assessment.score.Social}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <div className="esg-score-label">
                                                                {getScoreStatus(assessment.score.Social)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Governance */}
                                                    <div className="esg-card governance">
                                                        <div className="esg-card-header">
                                                            <div className="esg-icon-wrapper">
                                                                <i className="fas fa-shield-alt"></i>
                                                            </div>
                                                            <div className="esg-card-title">Governance</div>
                                                        </div>
                                                        <div className="esg-card-content">
                                                            <div className="esg-score-display">
                                                                <span className="esg-score-number">{assessment.score.Governance}</span>
                                                                <span className="esg-score-unit">%</span>
                                                            </div>
                                                            <div className="esg-score-bar">
                                                                <div className="esg-bar-bg">
                                                                    <div
                                                                        className="esg-bar-fill"
                                                                        style={{ width: `${assessment.score.Governance}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                            <div className="esg-score-label">
                                                                {getScoreStatus(assessment.score.Governance)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Overall Score Card - Below Grid */}
                                                <div className="overall-score-card">
                                                    <div className="overall-score-header">
                                                        <div className="overall-icon">
                                                            <i className="fas fa-trophy"></i>
                                                        </div>
                                                        <div className="overall-info">
                                                            <h5>Overall Performance</h5>
                                                            <div className="overall-score-display">
                                                                <span className="overall-number">{overallScore}</span>
                                                                <span className="overall-percent">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="overall-status">
                                                        <span className={`status-badge ${getScoreBadge(overallScore)}`}>
                                                            {getScoreStatus(overallScore)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Performance Summary - Side by Side */}
                                                <div className="performance-summary-horizontal">
                                                    <div className="summary-stat-item">
                                                        <div className="summary-stat-icon">
                                                            <i className="fas fa-star"></i>
                                                        </div>
                                                        <div className="summary-stat-content">
                                                            <span className="stat-label">Best Area</span>
                                                            <span className="stat-value">{bestArea ? `${bestArea.area} (${bestArea.score}%)` : 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="summary-stat-item">
                                                        <div className="summary-stat-icon">
                                                            <div className="summary-stat-icon">
                                                                <i className="fas fa-exclamation-triangle"></i>
                                                            </div>
                                                        </div>
                                                        <div className="summary-stat-content">
                                                            <span className="stat-label">Needs Focus</span>
                                                            <span className="stat-value">{worstArea ? `${worstArea.area} (${worstArea.score}%)` : 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Detailed Breakdown */}
                                                <div className="esg-breakdown-section">
                                                    <h5 className="breakdown-title">
                                                        <i className="fas fa-chart-bar me-1"></i>
                                                        Detailed Breakdown
                                                    </h5>

                                                    {/* Environment Breakdown */}
                                                    <div className="breakdown-category">
                                                        <div className="breakdown-category-header">
                                                            <div className="breakdown-category-icon environment">
                                                                <i className="fas fa-leaf"></i>
                                                            </div>
                                                            <div className="breakdown-category-info">
                                                                <h6>Environment</h6>
                                                                <span className="breakdown-category-score">{assessment.score.Environment}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="breakdown-items">
                                                            {assessment.score.breakdown?.Environment &&
                                                                Object.entries(assessment.score.breakdown.Environment).map(([key, value]) => (
                                                                    <div key={key} className="breakdown-item">
                                                                        <div className="breakdown-item-header">
                                                                            <span className="breakdown-item-name">{key}</span>
                                                                            <span className="breakdown-item-score">{value}%</span>
                                                                        </div>
                                                                        <div className="breakdown-item-bar">
                                                                            <div className="breakdown-bar-bg">
                                                                                <div
                                                                                    className="breakdown-bar-fill environment"
                                                                                    style={{ width: `${value}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Social Breakdown */}
                                                    <div className="breakdown-category">
                                                        <div className="breakdown-category-header">
                                                            <div className="breakdown-category-icon social">
                                                                <i className="fas fa-users"></i>
                                                            </div>
                                                            <div className="breakdown-category-info">
                                                                <h6>Social</h6>
                                                                <span className="breakdown-category-score">{assessment.score.Social}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="breakdown-items">
                                                            {assessment.score.breakdown?.Social &&
                                                                Object.entries(assessment.score.breakdown.Social).map(([key, value]) => (
                                                                    <div key={key} className="breakdown-item">
                                                                        <div className="breakdown-item-header">
                                                                            <span className="breakdown-item-name">{key}</span>
                                                                            <span className="breakdown-item-score">{value}%</span>
                                                                        </div>
                                                                        <div className="breakdown-item-bar">
                                                                            <div className="breakdown-bar-bg">
                                                                                <div
                                                                                    className="breakdown-bar-fill social"
                                                                                    style={{ width: `${value}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Governance Breakdown */}
                                                    <div className="breakdown-category">
                                                        <div className="breakdown-category-header">
                                                            <div className="breakdown-category-icon governance">
                                                                <i className="fas fa-shield-alt"></i>
                                                            </div>
                                                            <div className="breakdown-category-info">
                                                                <h6>Governance</h6>
                                                                <span className="breakdown-category-score">{assessment.score.Governance}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="breakdown-items">
                                                            {assessment.score.breakdown?.Governance &&
                                                                Object.entries(assessment.score.breakdown.Governance).map(([key, value]) => (
                                                                    <div key={key} className="breakdown-item">
                                                                        <div className="breakdown-item-header">
                                                                            <span className="breakdown-item-name">{key}</span>
                                                                            <span className="breakdown-item-score">{value}%</span>
                                                                        </div>
                                                                        <div className="breakdown-item-bar">
                                                                            <div className="breakdown-bar-bg">
                                                                                <div
                                                                                    className="breakdown-bar-fill governance"
                                                                                    style={{ width: `${value}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="details-tab">
                        <div className="row">
                            <div className="col-12">
                                <div className="details-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-building me-1"></i>
                                        Firm Information
                                    </h4>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <label>Firm Name</label>
                                            <span>{user?.firm_name || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Email</label>
                                            <span>{user_email}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Contact Number</label>
                                            <span>{user?.contact_no || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Industry</label>
                                            <span>{user?.industry || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Business Size</label>
                                            <span className="badge bg-info text-white">{user?.business_size || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>State</label>
                                            <span>{user?.location || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Verification Status</label>
                                            <span className={`badge ${user?.status?.is_verified ? 'bg-success' : 'bg-warning'} text-white`}>
                                                {user?.status?.is_verified ? 'Verified' : 'Pending Verification'}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Account Status</label>
                                            <span className={`badge ${user?.status?.is_active ? 'bg-success' : 'bg-danger'} text-white`}>
                                                {user?.status?.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 mt-4">
                                <div className="details-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-info-circle me-1"></i>
                                        Assessment Information
                                    </h4>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <label>Assessment Year</label>
                                            <span>{year}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Status</label>
                                            <span className="badge bg-success text-white">Completed</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Completion Date</label>
                                            <span>{formatDate(assessment?.last_updated)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Overall Score</label>
                                            <span className={getScoreColor(overallScore)}>{overallScore || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Account Created</label>
                                            <span>{formatDate(user?.created_at)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Last Updated</label>
                                            <span>{formatDate(user?.updated_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Responses Tab */}
                {activeTab === 'responses' && (
                    <div className="responses-tab">
                        <div className="row">
                            <div className="col-12">
                                <div className="responses-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-comments me-1"></i>
                                        Question Responses by Category
                                    </h4>
                                    {assessmentResponses ? (
                                        (() => {
                                            return (
                                                <div className="category-tabs-container">
                                                    {/* Category Navigation Tabs */}
                                                    <div className="category-tabs">
                                                        <div className="nav nav-tabs" role="tablist">
                                                            {categories.map((category, index) => (
                                                                <button
                                                                    key={category}
                                                                    className={`nav-link ${activeCategory === category ? 'active' : ''}`}
                                                                    onClick={() => setActiveCategory(category)}
                                                                >
                                                                    <i className="fas fa-folder me-1"></i>
                                                                    {category}
                                                                    <span className="category-badge">
                                                                        {groupedResponses[category].length}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Category Content */}
                                                    <div className="category-content">
                                                        {activeCategory && groupedResponses[activeCategory] && (
                                                            <div className="active-category-section">
                                                                <div className="category-header">
                                                                    <h5 className="category-title">
                                                                        <i className="fas fa-folder-open me-1"></i>
                                                                        {activeCategory}
                                                                    </h5>
                                                                    <span className="category-count">
                                                                        {groupedResponses[activeCategory].length} Question{groupedResponses[activeCategory].length !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>

                                                                <div className="category-responses">
                                                                    {groupedResponses[activeCategory].map((response, index) => (
                                                                        <div key={index} className="response-item">
                                                                            <div className="response-header">
                                                                                <div className="response-meta">
                                                                                    <span className="question-number">Q{response.originalIndex}</span>
                                                                                    <span className="question-category">{response.question.category}</span>
                                                                                </div>
                                                                                <div className="response-status">
                                                                                    <span className={`answer-badge ${response.answer === true ? 'positive' : response.answer === false ? 'negative' : 'neutral'}`}>
                                                                                        <i className={`fas ${response.answer === true ? 'fa-check-circle' : response.answer === false ? 'fa-times-circle' : 'fa-minus-circle'} me-1`}></i>
                                                                                        {response.answer === true ? 'Yes' : response.answer === false ? 'No' : response.answer}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="response-content">
                                                                                <p className="question-text">{response.question.text}</p>
                                                                                <div className="answer-details">
                                                                                    <div className="answer-summary">
                                                                                        <strong>Response:</strong>
                                                                                        <span className={`answer-value ${response.answer === true ? 'text-success' : response.answer === false ? 'text-danger' : 'text-muted'}`}>
                                                                                            {response.answer === true ? 'Yes' : response.answer === false ? 'No' : response.answer}
                                                                                        </span>
                                                                                    </div>
                                                                                    {response.question.category && (
                                                                                        <div className="question-category-badge">
                                                                                            <i className="fas fa-tag me-1"></i>
                                                                                            {response.question.category}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="no-responses">
                                            <i className="fas fa-comments"></i>
                                            <p>No detailed responses available for this assessment.</p>
                                            <p className="text-muted">Response data will be displayed here when available.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="analytics-tab">
                        <div className="row">
                            <div className="col-12">
                                <div className="analytics-section">
                                    <h4 className="section-title">
                                        <i className="fas fa-chart-line me-1"></i>
                                        Performance Analytics
                                    </h4>
                                    <div className="analytics-content">
                                        <div className="analytics-placeholder">
                                            <i className="fas fa-chart-bar"></i>
                                            <h5>Analytics Dashboard</h5>
                                            <p>Detailed analytics and performance insights will be displayed here.</p>
                                            <p className="text-muted">This feature is coming soon!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <div className="row">
                    <div className="col-12 text-center">
                        <button className="btn btn-outline-primary me-3" onClick={downloadReport} disabled={isGeneratingPDF}>
                            <i className="fas fa-download me-1"></i>
                            {isGeneratingPDF ? 'Generating...' : 'Download Result'}
                        </button>
                        <button className="btn btn-outline-secondary me-3">
                            <i className="fas fa-share me-1"></i>
                            Share Results
                        </button>
                        <button className="btn btn-primary">
                            <i className="fas fa-redo me-1"></i>
                            Retake Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssessmentDetails; 