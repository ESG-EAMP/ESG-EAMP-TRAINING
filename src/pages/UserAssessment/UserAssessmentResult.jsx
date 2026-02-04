import React from 'react';
import Title from '../../layouts/Title/Title';
import ESGScoreChart from './ESGScoreChart';

function UserAssessmentResult() {
    const userName = "John Smith";
    const assessmentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const scores = {
        overall: 45, // Calculated average
        environmental: {
            score: 50,
            level: "DEVELOPING",
            indicators: [
                { name: "Emission Management", score: 45, level: "DEVELOPING" },
                { name: "Energy Management", score: 63, level: "INTERMEDIATE" },
                { name: "Water Management", score: 0, level: "NOT STARTED" },
                { name: "Waste Management", score: 70, level: "INTERMEDIATE" }
            ]
        },
        social: {
            score: 38,
            level: "DEVELOPING",
            indicators: [
                { name: "Labour Practices & Standards", score: 75, level: "INTERMEDIATE" },
                { name: "Safety & Health", score: 23, level: "BASIC" },
                { name: "Employee Benefits", score: 28, level: "BASIC" },
                { name: "Corporate Social Responsibility", score: 0, level: "NOT STARTED" }
            ]
        },
        governance: {
            score: 49,
            level: "DEVELOPING",
            indicators: [
                { name: "Culture & Commitments", score: 81, level: "ADVANCED" },
                { name: "Integrity / Anti-Corruption", score: 26, level: "BASIC" },
                { name: "Risk Governance & Internal Controls", score: 0, level: "NOT STARTED" },
                { name: "Decision Making & Strategic Oversight", score: 36, level: "DEVELOPING" },
                { name: "Disclosure, Transparency & Data Protection", score: 76, level: "INTERMEDIATE" }
            ]
        }
    };

    const getLevelColor = (level) => {
        switch(level) {
            case "ADVANCED": return "success";
            case "INTERMEDIATE": return "primary";
            case "DEVELOPING": return "info";
            case "BASIC": return "warning";
            case "NOT STARTED": return "danger";
            default: return "secondary";
        }
    };

    return (
        <div className="container-fluid">
            <Title title="Assessment Results" breadcrumb={[["Assessment", "/assessment"], "Assessment Results"]} />
            
            <div className="rounded-3 p-4">
                <div className="mb-5">
                    <p className="text-muted mb-2">Dear {userName},</p>
                    <p className="lead">
                        Congratulations! You have taken the first step towards understanding your firm's ESG performance level. 
                        This assessment, completed on {assessmentDate}, provides valuable insights into your company's 
                        environmental, social, and governance practices.
                    </p>
                    <p>
                        Below is a detailed breakdown of your ESG performance across key indicators. 
                        Use these insights to identify areas of strength and opportunities for improvement 
                        in your sustainability journey.
                    </p>
                </div>

                <div className="mb-4">
                    <h5 className="text-secondary mb-4">ESG Score by Indicators (Year {year}) dsds</h5>
                    <ESGScoreChart />
                </div>

                {/* Detailed Results Section - Matching your image */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <h5 className="text-secondary mb-3">Detailed ESG Performance Breakdown</h5>
                        
                        {/* Environmental Section */}
                        <div className="mb-4">
                            <h6 className="d-flex justify-content-between align-items-center">
                                <span className="text-success">Environmental (E)</span>
                                <span className="badge bg-light text-dark">
                                    Score: {scores.environmental.score}% - {scores.environmental.level}
                                </span>
                            </h6>
                            <p className="mb-3">
                                Your firm scored {scores.environmental.score}% in Environmental (E), 
                                the practice in that area is gradually {scores.environmental.level}.
                            </p>
                            <ul className="list-unstyled">
                                {scores.environmental.indicators.map((indicator, index) => (
                                    <li key={index} className="mb-2 d-flex justify-content-between">
                                        <span className={indicator.score === 0 ? "text-danger" : ""}>
                                            - {indicator.score}% in {indicator.name}, 
                                            {indicator.level === "NOT STARTED" 
                                                ? " your firm HAS NOT STARTED practicing yet." 
                                                : ` which is considered ${indicator.level} practice.`}
                                        </span>
                                        {indicator.score === 0 && (
                                            <span className="badge bg-danger bg-opacity-10 text-danger">Needs Improvement</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Social Section */}
                        <div className="mb-4">
                            <h6 className="d-flex justify-content-between align-items-center">
                                <span className="text-info">Social (S)</span>
                                <span className="badge bg-light text-dark">
                                    Score: {scores.social.score}% - {scores.social.level}
                                </span>
                            </h6>
                            <p className="mb-3">
                                Your firm scored {scores.social.score}% in Social (S), 
                                the practice in that area is gradually {scores.social.level}.
                            </p>
                            <ul className="list-unstyled">
                                {scores.social.indicators.map((indicator, index) => (
                                    <li key={index} className="mb-2 d-flex justify-content-between">
                                        <span className={indicator.score === 0 ? "text-danger" : ""}>
                                            - {indicator.score}% in {indicator.name}, 
                                            {indicator.level === "NOT STARTED" 
                                                ? " your firm HAS NOT STARTED practicing yet." 
                                                : ` which is considered ${indicator.level} practice.`}
                                        </span>
                                        {indicator.score === 0 && (
                                            <span className="badge bg-danger bg-opacity-10 text-danger">Needs Improvement</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Governance Section */}
                        <div>
                            <h6 className="d-flex justify-content-between align-items-center">
                                <span className="text-primary">Governance (G)</span>
                                <span className="badge bg-light text-dark">
                                    Score: {scores.governance.score}% - {scores.governance.level}
                                </span>
                            </h6>
                            <p className="mb-3">
                                Your firm scored {scores.governance.score}% in Governance (G), 
                                the practice in that area is gradually {scores.governance.level}.
                            </p>
                            <ul className="list-unstyled">
                                {scores.governance.indicators.map((indicator, index) => (
                                    <li key={index} className="mb-2 d-flex justify-content-between">
                                        <span className={indicator.score === 0 ? "text-danger" : ""}>
                                            - {indicator.score}% in {indicator.name}, 
                                            {indicator.level === "NOT STARTED" 
                                                ? " your firm HAS NOT STARTED practicing yet." 
                                                : ` which is considered ${indicator.level} practice.`}
                                        </span>
                                        {indicator.score === 0 && (
                                            <span className="badge bg-danger bg-opacity-10 text-danger">Needs Improvement</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="mt-3 p-3 bg-light rounded">
                            <p className="text-danger">
                                <strong>Note:</strong> Indicators highlighted in red font reflect the areas that need further improvement.
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Overall ESG Score Card */}
                <div className="card mb-4 border-0 shadow-sm">
                    <div className="card-body">
                        <h5 className="card-title text-secondary">Overall ESG Performance</h5>
                        <div className="d-flex align-items-center">
                            <div className="bg-light rounded-3 p-3 me-4">
                                <h2 className="">{scores.overall}%</h2>
                            </div>
                            <div>
                                <p className="">Your firm's overall ESG performance score</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div >
                    <h5 className="text-secondary mb-3">What's Next?</h5>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title text-primary">Review Your Results</h6>
                                    <p className="card-text">
                                        Analyze your performance across different ESG indicators and identify areas 
                                        that need attention.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title text-primary">Set Improvement Goals</h6>
                                    <p className="card-text">
                                        Based on your results, establish specific targets for improving your 
                                        ESG performance in key areas.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title text-primary">Access Resources</h6>
                                    <p className="card-text">
                                        Explore our ESG Learning Centre for guides, best practices, and tools 
                                        to improve your sustainability practices.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserAssessmentResult;