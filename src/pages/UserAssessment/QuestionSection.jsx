import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import Swal from 'sweetalert2';
import './QuestionSection.css';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const TAB_ORDER = ['Year Selection', 'Prerequisites', 'Environment', 'Social', 'Governance', 'Finish'];

function QuestionSection() {
    const [activeTab, setActiveTab] = useState('Year Selection');
    const [questions, setQuestions] = useState({ Prerequisites: [], Environment: [], Social: [], Governance: [] });
    const [page, setPage] = useState(1);
    const [answers, setAnswers] = useState({ Prerequisites: {}, Environment: {}, Social: {}, Governance: {} });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [assessmentCompleted, setAssessmentCompleted] = useState(false);

    const questionsPerPage = 3; // Reduced for better wizard experience

    const navigate = useNavigate();
    useEffect(() => {
        api.get('/assessment/user/get-questions')
            .then(res => {
                const data = res.data;
                const grouped = { Prerequisites: [], Environment: [], Social: [], Governance: [] };
                if (Array.isArray(data)) {
                    data.forEach(q => {
                        if (grouped[q.category]) {
                            grouped[q.category].push(q);
                        }
                    });
                } else {
                    console.error('Expected array of questions but received:', data);
                }
                console.log("🔍 FETCHED QUESTIONS DEBUG:");
                console.log("Total questions:", data.length);
                console.log("Sample Environment question:", data.find(q => q.category === 'Environment'));
                console.log("Sample Social question:", data.find(q => q.category === 'Social'));
                console.log("Sample Governance question:", data.find(q => q.category === 'Governance'));
                setQuestions(grouped);
            })
            .catch(err => {
                console.error("Error fetching questions:", err);
                setQuestions({ Prerequisites: [], Environment: [], Social: [], Governance: [] });
            });
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(1);
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [questionId]: value
            }
        }));
    };

    const handleSubmitResponses = async () => {
        const userId = localStorage.getItem("user_id");
        
        if (!userId) return Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'User not identified. Please log in.',
            timer: 1200,
            showConfirmButton: false
        });

        setIsSubmitting(true);

        const allResponses = [];



        TAB_ORDER.slice(1, -1).forEach(category => {
            questions[category].forEach(q => {
                const answer = answers[category][q._id];
                if (answer) {
                    const processedAnswer = q.category === 'Prerequisites' ? answer : answer === 'yes';
                    console.log(`🔍 Question ${q._id}: Category=${q.category}, Mark=${q.mark}, Original Answer=${answer}, Processed Answer=${processedAnswer}`);
                    console.log(`🔍 Full question object:`, q);
                    
                    allResponses.push({
                        question: {
                            _id: q._id,
                            category: q.category,
                            subCategory: q.subCategory,
                            text: q.text,
                            mark: q.mark,
                            index: q.index
                        },
                        answer: processedAnswer
                    });
                }
            });
        });
        console.log("Submitting assessment:", {
            user_id: userId,
            assessment_year: selectedYear,
            responses: allResponses
        });
        try {
            const res = await api.post('/assessment/user/submit-response', {
                user_id: userId,
                assessment_year: selectedYear,
                responses: allResponses
            });

            Swal.fire({
                icon: 'success',
                title: 'Assessment Submitted',
                text: 'Your responses have been saved successfully.',
                timer: 1200,
                showConfirmButton: false
            });
            setActiveTab('Finish');
            setAssessmentCompleted(true);
        } catch (err) {
            console.error("Save error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error saving your responses. Please try again.',
                timer: 1200,
                showConfirmButton: false
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const startIndex = (page - 1) * questionsPerPage;
    const currentQuestions = questions[activeTab] ? questions[activeTab].slice(startIndex, startIndex + questionsPerPage) : [];
    const totalPages = questions[activeTab] ? Math.ceil(questions[activeTab].length / questionsPerPage) : 1;

    const globalIndexMap = {};
    if (questions[activeTab]) {
        questions[activeTab].forEach((q, index) => {
            globalIndexMap[q._id] = index + 1;
        });
    }

    const getProgressPercentage = () => {
        if (activeTab === 'Year Selection') return 0;
        if (activeTab === 'Finish') return 100;

        const totalQuestions = TAB_ORDER.slice(1, -1).reduce((sum, tab) => sum + questions[tab].length, 0);
        const answeredQuestions = TAB_ORDER.slice(1, -1).reduce((sum, tab) => sum + Object.keys(answers[tab] || {}).length, 0);
        const baseProgress = (TAB_ORDER.indexOf(activeTab) - 1) * 20; // 20% per section
        const sectionProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 20 : 0;
        return Math.round(baseProgress + sectionProgress);
    };

    const getTabProgress = (tab) => {
        if (tab === 'Year Selection') return selectedYear ? 100 : 0;
        if (tab === 'Finish') return 0;
        if (questions[tab].length === 0) return 0;
        return Math.round((Object.keys(answers[tab] || {}).length / questions[tab].length) * 100);
    };

    const canGoNext = () => {
        if (activeTab === 'Year Selection') return selectedYear;
        if (activeTab === 'Finish') return false;

        const currentTabQuestions = currentQuestions.map(q => q._id);
        const answeredCurrentPage = currentTabQuestions.filter(id => answers[activeTab][id]);
        return answeredCurrentPage.length === currentTabQuestions.length;
    };

    const handleNext = () => {
        if (activeTab === 'Year Selection') {
            setActiveTab('Prerequisites');
            setPage(1);
        } else if (page < totalPages) {
            setPage(page + 1);
        } else if (TAB_ORDER.indexOf(activeTab) < TAB_ORDER.length - 1) {
            const nextTabIndex = TAB_ORDER.indexOf(activeTab) + 1;
            setActiveTab(TAB_ORDER[nextTabIndex]);
            setPage(1);
        }
    };

    const handlePrevious = () => {
        if (activeTab === 'Year Selection') return;

        if (page > 1) {
            setPage(page - 1);
        } else if (TAB_ORDER.indexOf(activeTab) > 1) {
            const prevTabIndex = TAB_ORDER.indexOf(activeTab) - 1;
            setActiveTab(TAB_ORDER[prevTabIndex]);
            setPage(Math.ceil(questions[TAB_ORDER[prevTabIndex]].length / questionsPerPage));
        } else if (TAB_ORDER.indexOf(activeTab) === 1) {
            setActiveTab('Year Selection');
        }
    };

    const isLastStep = () => {
        return activeTab === 'Governance' && page === totalPages;
    };

    const renderYearSelection = () => (
        <div className="year-selection-container">
            <div>
                <div className="text-center mb-4">
                    <i className="fas fa-calendar-alt fa-3x text-primary mb-3"></i>
                    <h3 className="text-primary">Select Assessment Year</h3>
                    <p className="text-muted">Choose the year for which you want to complete this ESG assessment.</p>
                </div>

                <div className="year-options">
                    <div className="row justify-content-center">
                        {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                            <div key={year} className="col-md-4 mb-3">
                                <div
                                    className={`year-option ${selectedYear === year ? 'selected' : ''}`}
                                    onClick={() => setSelectedYear(year)}
                                >
                                    <div className="year-number">{year}</div>
                                    <div className="year-label">
                                        {year === new Date().getFullYear() ? 'Current Year' :
                                            year === new Date().getFullYear() - 1 ? 'Previous Year' : 'Two Years Ago'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="year-info mt-4">
                    <div className="alert alert-info">
                        <i className="fas fa-info-circle me-1"></i>
                        <strong>Note:</strong> You can only complete one assessment per year.
                        Make sure to select the correct year for your assessment.
                    </div>
                </div>
            </div>
        </div>
    );

    const renderFinishPage = () => (
        <div className="finish-container">
            <div className="finish-card">
                <div className="text-center mb-4">
                    {assessmentCompleted ? (
                        <>
                            <div className="success-icon mb-3">
                                <i className="fas fa-check-circle fa-4x text-success"></i>
                            </div>
                            <h3 className="text-success">Assessment Completed!</h3>
                            <p className="text-muted">Your ESG assessment for {selectedYear} has been successfully submitted.</p>
                        </>
                    ) : (
                        <>
                            <div className="review-icon mb-3">
                                <i className="fas fa-clipboard-check fa-4x text-primary"></i>
                            </div>
                            <h3 className="text-primary">Review Your Assessment</h3>
                            <p className="text-muted">Please review your responses before final submission.</p>
                        </>
                    )}
                </div>

                {!assessmentCompleted && (
                    <div className="assessment-summary mb-4">
                        <h5 className="mb-3">Assessment Summary</h5>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="summary-item">
                                    <strong>Assessment Year:</strong> {selectedYear}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="summary-item">
                                    <strong>Total Questions:</strong> {TAB_ORDER.slice(1, -1).reduce((sum, tab) => sum + questions[tab].length, 0)}
                                </div>
                            </div>
                        </div>

                        <div className="section-summary mt-3">
                            {TAB_ORDER.slice(1, -1).map(tab => (
                                <div key={tab} className="summary-section">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>{tab}</span>
                                        <span className="badge bg-primary">
                                            {Object.keys(answers[tab] || {}).length}/{questions[tab].length}
                                        </span>
                                    </div>
                                    <div className="progress mt-1" style={{ height: '4px' }}>
                                        <div
                                            className="progress-bar bg-primary"
                                            style={{ width: `${getTabProgress(tab)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {assessmentCompleted && (
                    <div className="next-steps mt-4">
                        <h5 className="mb-3">What's Next?</h5>
                        <div className="row">
                            <div className="col-md-4 text-center mb-3">
                                <div className="next-step-item" onClick={() => navigate(`/assessment-details/${selectedYear}`)}>
                                    <i className="fas fa-chart-line fa-2x text-primary mb-2"></i>
                                    <h6>View Results</h6>
                                    <p className="small text-muted">Check your ESG score and detailed analysis</p>
                                </div>
                            </div>
                            <div className="col-md-4 text-center mb-3">
                                <div className="next-step-item" onClick={() => navigate("/dashboard")}>
                                    <i className="fas fa-history fa-2x text-primary mb-2"></i>
                                    <h6>View Assessment History</h6>
                                    <p className="small text-muted">Check your previous assessments</p>
                                </div>
                            </div>
                            <div className="col-md-4 text-center mb-3">
                                <div className="next-step-item" onClick={() => navigate(`/learning-centre`)}>
                                    <i className="fas fa-book fa-2x text-success mb-2"></i>
                                    <h6>Learning Centre</h6>
                                    <p className="small text-muted">Access educational materials and resources</p>
                                </div>
                            </div>
                            <div className="col-md-4 text-center mb-3 d-none">
                                <div className="next-step-item">
                                    <i className="fas fa-download fa-2x text-info mb-2"></i>
                                    <h6>Download Report</h6>
                                    <p className="small text-muted">Get a PDF copy of your assessment</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="">
            {/* Overall Progress Bar */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="">Overall Progress</h6>
                    <span className="text-muted">{getProgressPercentage()}% Complete</span>
                </div>
                <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div
                        className="progress-bar bg-success"
                        style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                </div>
            </div>

            {/* Wizard Steps */}
            <div className="wizard-steps mb-4">
                <div className="row">
                    {TAB_ORDER.map((tab, index) => (
                        <div key={tab} className="col-2">
                            <div
                                className={`wizard-step ${activeTab === tab ? 'active' : ''} ${TAB_ORDER.indexOf(activeTab) > index ? 'completed' : ''}`}
                                onClick={() => handleTabChange(tab)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="step-number">
                                    {TAB_ORDER.indexOf(activeTab) > index ? (
                                        <i className="fas fa-check"></i>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <div className="step-content">
                                    <h6 className="step-title">{tab}</h6>
                                    <div className="step-progress">
                                        <div className="progress" style={{ height: '4px' }}>
                                            <div
                                                className="progress-bar bg-primary"
                                                style={{ width: `${getTabProgress(tab)}%` }}
                                            ></div>
                                        </div>
                                        {tab !== 'Year Selection' && tab !== 'Finish' && (
                                            <small className="text-muted">
                                                {Object.keys(answers[tab] || {}).length}/{questions[tab].length}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'Year Selection' ? (
                renderYearSelection()
            ) : activeTab === 'Finish' ? (
                renderFinishPage()
            ) : (
                <>
                    {/* Current Section Header */}
                    <div className="section-header mb-4">
                        <h4 className="text-white mb-2">{activeTab}</h4>
                        <p className="text-white ">
                            Step {TAB_ORDER.indexOf(activeTab) + 1} of {TAB_ORDER.length} •
                            Page {page} of {totalPages} •
                            {currentQuestions.length} questions on this page
                        </p>
                    </div>

                    {/* Questions */}
                    <div className="questions-container">
                        {currentQuestions.map((q, qIndex) => (
                            <div key={q._id} className="question-card mb-4">
                                <div className="question-header">
                                    <span className="question-number">Q{globalIndexMap[q._id]}</span>
                                    <div className="question-progress">
                                        <small className="text-muted">
                                            {qIndex + 1} of {currentQuestions.length}
                                        </small>
                                    </div>
                                </div>

                                <div className="question-content">
                                    <h5 className="question-text mb-3">{q.text}</h5>

                                    {activeTab === 'Prerequisites' ? (
                                        <div className="answer-input">
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Enter a number..."
                                                value={answers[activeTab][q._id] || ''}
                                                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                                min="0"
                                                step="1"
                                            />
                                        </div>
                                    ) : (
                                        <div className="answer-options">
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <label htmlFor={`yes_${q._id}`} className={`answer-option ${answers[activeTab][q._id] === 'yes' ? 'selected' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            id={`yes_${q._id}`}
                                                            name={`answer_${q._id}`}
                                                            className="form-check-input"
                                                            checked={answers[activeTab][q._id] === 'yes'}
                                                            onChange={() => handleAnswerChange(q._id, 'yes')}
                                                        />
                                                        <label className="form-check-label" htmlFor={`yes_${q._id}`}>
                                                            <i className="fas fa-check-circle text-success me-1"></i>
                                                            Yes
                                                        </label>
                                                    </label>
                                                </div>
                                                <div className="col-md-6">
                                                    <label htmlFor={`no_${q._id}`} className={`answer-option ${answers[activeTab][q._id] === 'no' ? 'selected' : ''}`}>
                                                        <input
                                                            type="radio"
                                                            id={`no_${q._id}`}
                                                            name={`answer_${q._id}`}
                                                            className="form-check-input"
                                                            checked={answers[activeTab][q._id] === 'no'}
                                                            onChange={() => handleAnswerChange(q._id, 'no')}
                                                        />
                                                        <label className="form-check-label" htmlFor={`no_${q._id}`}>
                                                            <i className="fas fa-times-circle text-danger me-1"></i>
                                                            No
                                                        </label>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Navigation Buttons */}
            {activeTab !== 'Finish' && (
                <div className={`mt-5 ${activeTab === 'Year Selection' ? 'pb-3' : ''}`}>
                    <div className="row">
                        <div className="col-md-6">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={handlePrevious}
                                disabled={TAB_ORDER.indexOf(activeTab) === 0}
                            >
                                <i className="fas fa-arrow-left me-1"></i>
                                Previous
                            </button>
                        </div>
                        <div className="col-md-6 text-end">
                            {isLastStep() ? (
                                <button
                                    className="btn btn-success"
                                    onClick={handleSubmitResponses}
                                    disabled={isSubmitting || !canGoNext()}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check me-1"></i>
                                            Complete Assessment
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleNext}
                                    disabled={!canGoNext()}
                                >
                                    Next
                                    <i className="fas fa-arrow-right ms-2"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Page Indicators */}
            {activeTab !== 'Year Selection' && activeTab !== 'Finish' && (
                <div className="page-indicators mt-3 text-center">
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <span
                            key={index}
                            className={`page-dot ${page === index + 1 ? 'active' : ''}`}
                            onClick={() => setPage(index + 1)}
                        ></span>
                    ))}
                </div>
            )}

        </div>
    );
}

export default QuestionSection;