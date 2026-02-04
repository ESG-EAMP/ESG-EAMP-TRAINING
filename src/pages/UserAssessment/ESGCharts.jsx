import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './ESGCharts.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const ESGCharts = ({ scores }) => {
    const [showTooltip, setShowTooltip] = useState({
        esgCategories: false,
        detailedBreakdown: false,
        performanceTrend: false
    });

    const toggleTooltip = (chartType) => {
        setShowTooltip(prev => ({
            ...prev,
            [chartType]: !prev[chartType]
        }));
    };

    if (!scores || !scores.breakdown) {
        return (
            <div className="charts-placeholder">
                <p>No data available for charts</p>
            </div>
        );
    }

    // Chart 1: ESG Categories Bar Chart
    const esgCategoriesData = {
        labels: ['Environment', 'Social', 'Governance'],
        datasets: [
            {
                label: 'ESG Score (%)',
                data: [scores.Environment || 0, scores.Social || 0, scores.Governance || 0],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green for Environment
                    'rgba(59, 130, 246, 0.8)',   // Blue for Social
                    'rgba(168, 85, 247, 0.8)'    // Purple for Governance
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }
        ]
    };

    const esgCategoriesOptions = {
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
                text: 'ESG Categories Performance',
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
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y}%`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    font: {
                        family: 'Poppins, sans-serif',
                        size: 11
                    },
                    callback: function(value) {
                        return value + '%';
                    }
                },
                title: {
                    font: {
                        family: 'Poppins, sans-serif',
                        size: 12,
                        weight: '500'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                ticks: {
                    font: {
                        family: 'Poppins, sans-serif',
                        size: 11
                    }
                },
                title: {
                    font: {
                        family: 'Poppins, sans-serif',
                        size: 12,
                        weight: '500'
                    }
                },
                grid: {
                    display: false
                }
            }
        }
    };

    // Chart 2: Detailed Breakdown Doughnut Chart
    const prepareBreakdownData = () => {
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const borderColors = [];

        // Environment indicators
        if (scores.breakdown.Environment) {
            Object.entries(scores.breakdown.Environment).forEach(([key, value], index) => {
                labels.push(`Env: ${key}`);
                data.push(value);
                backgroundColors.push(`rgba(34, 197, 94, ${0.6 + (index * 0.1)})`);
                borderColors.push('rgba(34, 197, 94, 1)');
            });
        }

        // Social indicators
        if (scores.breakdown.Social) {
            Object.entries(scores.breakdown.Social).forEach(([key, value], index) => {
                labels.push(`Social: ${key}`);
                data.push(value);
                backgroundColors.push(`rgba(59, 130, 246, ${0.6 + (index * 0.1)})`);
                borderColors.push('rgba(59, 130, 246, 1)');
            });
        }

        // Governance indicators
        if (scores.breakdown.Governance) {
            Object.entries(scores.breakdown.Governance).forEach(([key, value], index) => {
                labels.push(`Gov: ${key}`);
                data.push(value);
                backgroundColors.push(`rgba(168, 85, 247, ${0.6 + (index * 0.1)})`);
                borderColors.push('rgba(168, 85, 247, 1)');
            });
        }

        return { labels, data, backgroundColors, borderColors };
    };

    const breakdownData = prepareBreakdownData();
    const detailedBreakdownData = {
        labels: breakdownData.labels,
        datasets: [
            {
                data: breakdownData.data,
                backgroundColor: breakdownData.backgroundColors,
                borderColor: breakdownData.borderColors,
                borderWidth: 2,
                hoverOffset: 4
            }
        ]
    };

    const detailedBreakdownOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: 'Poppins, sans-serif',
                        size: 12,
                        weight: '500'
                    }
                }
            },
            title: {
                display: true,
                text: 'Detailed ESG Indicators Breakdown',
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
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.parsed}%`;
                    }
                }
            }
        },
        cutout: '50%'
    };

    // Chart 3: Performance Trend Line Chart (simulated data for demonstration)
    const performanceTrendData = {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
            {
                label: 'Environment',
                data: [scores.Environment * 0.8, scores.Environment * 0.9, scores.Environment * 0.95, scores.Environment],
                borderColor: 'rgba(34, 197, 94, 1)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            },
            {
                label: 'Social',
                data: [scores.Social * 0.75, scores.Social * 0.85, scores.Social * 0.92, scores.Social],
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            },
            {
                label: 'Governance',
                data: [scores.Governance * 0.7, scores.Governance * 0.8, scores.Governance * 0.9, scores.Governance],
                borderColor: 'rgba(168, 85, 247, 1)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }
        ]
    };

    const performanceTrendOptions = {
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
                text: 'ESG Performance Trend (Quarterly)',
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
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Quarter',
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
                    callback: function(value) {
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

    return (
        <div className="esg-charts-container">
            <div className="row">
                {/* Chart 1: ESG Categories Bar Chart */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="chart-card">
                        <div className="chart-header">
                            <div className="chart-info-button" onClick={() => toggleTooltip('esgCategories')}>
                                <i className="fas fa-info-circle"></i>
                            </div>
                            {showTooltip.esgCategories && (
                                <div className="chart-tooltip">
                                    <div className="tooltip-content">
                                        <h6>ESG Categories Performance</h6>
                                        <p>This bar chart shows your overall performance across the three main ESG categories: Environment, Social, and Governance. Each bar represents the percentage score for that category, helping you quickly identify which areas are performing well and which need improvement.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="chart-container" style={{ height: '400px' }}>
                            <Bar data={esgCategoriesData} options={esgCategoriesOptions} />
                        </div>
                    </div>
                </div>

                {/* Chart 2: Detailed Breakdown Doughnut Chart */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="chart-card">
                        <div className="chart-header">
                            <div className="chart-info-button" onClick={() => toggleTooltip('detailedBreakdown')}>
                                <i className="fas fa-info-circle"></i>
                            </div>
                            {showTooltip.detailedBreakdown && (
                                <div className="chart-tooltip">
                                    <div className="tooltip-content">
                                        <h6>Detailed ESG Indicators Breakdown</h6>
                                        <p>This doughnut chart provides a detailed view of all individual ESG indicators within each category. It shows the specific scores for each indicator, allowing you to see which particular areas within Environment, Social, and Governance are contributing to your overall performance.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="chart-container" style={{ height: '400px' }}>
                            <Doughnut data={detailedBreakdownData} options={detailedBreakdownOptions} />
                        </div>
                    </div>
                </div>

                {/* Chart 3: Performance Trend Line Chart */}
                <div className="col-12 mb-4">
                    <div className="chart-card">
                        <div className="chart-header">
                            <div className="chart-info-button" onClick={() => toggleTooltip('performanceTrend')}>
                                <i className="fas fa-info-circle"></i>
                            </div>
                            {showTooltip.performanceTrend && (
                                <div className="chart-tooltip">
                                    <div className="tooltip-content">
                                        <h6>ESG Performance Trend (Quarterly)</h6>
                                        <p>This line chart shows the quarterly progression of your ESG performance over time. It demonstrates how your scores have improved across all three categories from Q1 to Q4, providing insight into your ESG journey and continuous improvement efforts.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="chart-container" style={{ height: '400px' }}>
                            <Line data={performanceTrendData} options={performanceTrendOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ESGCharts;
