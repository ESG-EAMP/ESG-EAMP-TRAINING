import React from 'react';

// Helper to get level from score
function getLevel(score) {
    if (score === 0) return "NOT STARTED";
    if (score <= 30) return "BASIC";
    if (score <= 50) return "DEVELOPING";
    if (score <= 80) return "INTERMEDIATE";
    return "ADVANCED";
}

function ESGScoreChart({ score }) {
    // Defensive: handle missing score or breakdown
    const breakdown = score?.breakdown || {};

    // Helper to get indicator list for a category
    const getIndicators = (cat) => {
        if (!breakdown[cat] || typeof breakdown[cat] !== 'object') return [];
        return Object.entries(breakdown[cat]).map(([name, val]) => ({
            name,
            score: parseFloat(val) || 0,
            level: getLevel(parseFloat(val) || 0)
        }));
    };

    // Main category scores (from score prop)
    const scores = {
        environmental: {
            indicators: getIndicators('Environment'),
            score: typeof score?.Environment === 'number' ? score.Environment : 0,
            level: getLevel(typeof score?.Environment === 'number' ? score.Environment : 0)
        },
        social: {
            indicators: getIndicators('Social'),
            score: typeof score?.Social === 'number' ? score.Social : 0,
            level: getLevel(typeof score?.Social === 'number' ? score.Social : 0)
        },
        governance: {
            indicators: getIndicators('Governance'),
            score: typeof score?.Governance === 'number' ? score.Governance : 0,
            level: getLevel(typeof score?.Governance === 'number' ? score.Governance : 0)
        }
    };

    const indicators = [
        ...scores.environmental.indicators.map(i => ({ ...i, category: 'Environmental' })),
        ...scores.social.indicators.map(i => ({ ...i, category: 'Social' })),
        ...scores.governance.indicators.map(i => ({ ...i, category: 'Governance' })),
    ];

    if (!score || !breakdown || indicators.length === 0) {
        return (
            <div className="chart-container esg-chart-empty">
                <div className="text-center">
                    <i className="fas fa-chart-bar text-muted mb-3 esg-chart-empty-icon"></i>
                    <h5 className="text-muted">No ESG breakdown data available</h5>
                    <p className="text-muted">ESG indicator scores will be displayed here when available.</p>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="chart-container esg-chart-container border">
            {/* Category Legends */}
            <div className="esg-chart-legend">
                <div className="esg-chart-legend-item">
                    <div className="bg-success rounded-1 esg-chart-legend-color"></div>
                    <span className="text-muted">Environmental</span>
                </div>
                <div className="esg-chart-legend-item">
                    <div className="bg-warning rounded-1 esg-chart-legend-color"></div>
                    <span className="text-muted">Social</span>
                </div>
                <div className="esg-chart-legend-item">
                    <div className="bg-info rounded-1 esg-chart-legend-color"></div>
                    <span className="text-muted">Governance</span>
                </div>
            </div>
            <div className="chart-grid esg-chart-grid">
                {/* Grid lines */}
                <div className="esg-chart-grid-lines">
                    {[0, 20, 40, 60, 80, 100].map((value) => (
                        <div
                            key={value}
                            className="esg-chart-grid-line"
                            style={{ left: `${value}%` }}
                        />
                    ))}
                </div>
                {/* Bars */}
                <div className="esg-chart-bars">
                    {indicators.map((indicator, index) => (
                        <div key={index} className="esg-chart-bar-item">
                            <div className="esg-chart-label-container">
                                <span className="esg-chart-label">
                                    {indicator.name}
                                </span>
                            </div>
                            <div className="esg-chart-progress-container">
                                <div className="progress esg-chart-progress">
                                    <div
                                        className={`progress-bar progress-bar-striped progress-bar-animated bg-${
                                            indicator.category === 'Environmental' ? 'success' :
                                            indicator.category === 'Social' ? 'warning' : 'info'
                                        } esg-chart-progress-bar`}
                                        role="progressbar"
                                        style={{ width: `${indicator.score}%` }}
                                        aria-valuenow={indicator.score}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                    >
                                        {indicator.score}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <h5 className="text-secondary my-3 page-break-before">Detailed ESG Performance Breakdown</h5>
        {/*Agolix Breakdown Card */}
        <div className="chart-container esg-chart-container border">
                
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
                                <span className={indicator.score <= 50 ? "text-danger" : ""}> 
                                    - {indicator.score}% in {indicator.name},
                                    {indicator.level === "NOT STARTED"
                                        ? " your firm HAS NOT STARTED practicing yet."
                                        : ` which is considered ${indicator.level} practice.`}
                                </span>
                                {indicator.score <= 50 && ( 
                                    <span className="badge bg-danger ">Needs Improvement</span>
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
                                <span className={indicator.score <= 50 ? "text-danger" : ""}>
                                    - {indicator.score}% in {indicator.name},
                                    {indicator.level === "NOT STARTED"
                                        ? " your firm HAS NOT STARTED practicing yet."
                                        : ` which is considered ${indicator.level} practice.`}
                                </span>
                                {indicator.score <= 50 && (
                                    <span className="badge bg-danger ">Needs Improvement</span>
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
                                <span className={indicator.score <= 50 ? "text-danger" : ""}>
                                    - {indicator.score}% in {indicator.name},
                                    {indicator.level === "NOT STARTED"
                                        ? " your firm HAS NOT STARTED practicing yet."
                                        : ` which is considered ${indicator.level} practice.`}
                                </span>
                                {indicator.score <= 50 && (
                                    <span className="badge bg-danger ">Needs Improvement</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-3 p-2 px-3 bg-light rounded">
                    <p className="text-danger">
                        <strong>Note:</strong> Indicators highlighted in red font reflect the areas that need further improvement.
                    </p>
                </div>
            
        </div>
        </>
    );
}

export default ESGScoreChart;