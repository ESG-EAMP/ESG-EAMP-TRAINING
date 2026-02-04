import React, { useState, useEffect, useCallback } from 'react';
import ReactApexChart from 'react-apexcharts';
import api from '../../utils/api';

const CHART_COLORS = {
    environment: '#53A654',
    social: '#3376F0',
    governance: '#6743B7'
};

const CHART_HEIGHT = 350;

const createChartOptions = (yearlyESGData) => ({
    chart: {
        type: 'line',
        height: CHART_HEIGHT,
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true
            }
        }
    },
    series: [
        {
            name: 'Environment',
            data: yearlyESGData.Environment || []
        },
        {
            name: 'Social',
            data: yearlyESGData.Social || []
        },
        {
            name: 'Governance',
            data: yearlyESGData.Governance || []
        }
    ],
    xaxis: {
        categories: yearlyESGData.years || [],
        title: {
            text: 'Year',
            style: {
                fontSize: '14px',
                fontWeight: 600
            }
        }
    },
    yaxis: {
        title: {
            text: 'Score',
            style: {
                fontSize: '14px',
                fontWeight: 600
            }
        },
        min: 0,
        max: 100
    },
    colors: [CHART_COLORS.environment, CHART_COLORS.social, CHART_COLORS.governance],
    stroke: {
        curve: 'smooth',
        width: 3
    },
    markers: {
        size: 6,
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
            size: 8
        }
    },
    grid: {
        borderColor: '#e7e7e7',
        row: {
            colors: ['#f3f3f3', 'transparent'],
            opacity: 0.5
        }
    },
    title: {
        text: 'MSME ESG Analysis Over Years',
        align: 'center',
        style: {
            fontSize: '18px',
            fontWeight: 600
        }
    },
    subtitle: {
        text: 'ESG scores for different categories from 2020-2024',
        align: 'center',
        style: {
            fontSize: '12px',
            color: '#666'
        }
    },
    legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '14px',
        fontWeight: 600
    }
});

const createEnvironmentChartOptions = (yearlyEnvironment, chartType = 'line') => {
    const categories = Object.keys(yearlyEnvironment.categories || {});
    const colors = [
        '#53A654', '#3376F0', '#6743B7', '#FF6B6B', '#4ECDC4',
        '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC', '#26A69A'
    ];

    // Ensure we have valid data
    if (categories.length === 0 || !yearlyEnvironment.years || yearlyEnvironment.years.length === 0) {
        return null;
    }

    const baseConfig = {
        chart: {
            height: CHART_HEIGHT,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        xaxis: {
            categories: yearlyEnvironment.years,
            title: {
                text: 'Year',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            }
        },
        yaxis: {
            title: {
                text: 'Score',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            },
            min: 0,
            max: 100
        },
        colors: categories.map((_, index) => colors[index % colors.length]),
        grid: {
            borderColor: '#e7e7e7',
            row: {
                colors: ['#f3f3f3', 'transparent'],
                opacity: 0.5
            }
        },
        title: {
            text: 'Environment Breakdown Analysis',
            align: 'center',
            style: {
                fontSize: '18px',
                fontWeight: 600
            }
        },
        subtitle: {
            text: `Environment categories: ${categories.join(', ')}`,
            align: 'center',
            style: {
                fontSize: '12px',
                color: '#666'
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '14px',
            fontWeight: 600
        }
    };

    if (chartType === 'line') {
        return {
            ...baseConfig,
            chart: {
                ...baseConfig.chart,
                type: 'line'
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            markers: {
                size: 6,
                strokeColors: '#fff',
                strokeWidth: 2,
                hover: {
                    size: 8
                }
            }
        };
    } else if (chartType === 'bar') {
        return {
            ...baseConfig,
            chart: {
                ...baseConfig.chart,
                type: 'bar'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4
                }
            }
        };
    }

    return baseConfig;
};

// Create dynamic social breakdown chart options
const createSocialChartOptions = (yearlySocial, chartType = 'line') => {
    const categories = Object.keys(yearlySocial.categories || {});
    const colors = [
        '#3376F0', '#53A654', '#6743B7', '#FF6B6B', '#4ECDC4',
        '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC', '#26A69A'
    ];

    // Ensure we have valid data
    if (categories.length === 0 || !yearlySocial.years || yearlySocial.years.length === 0) {
        return null;
    }

    const baseConfig = {
        chart: {
            height: CHART_HEIGHT,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        xaxis: {
            categories: yearlySocial.years,
            title: {
                text: 'Year',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            }
        },
        yaxis: {
            title: {
                text: 'Score',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            },
            min: 0,
            max: 100
        },
        colors: categories.map((_, index) => colors[index % colors.length]),
        grid: {
            borderColor: '#e7e7e7',
            row: {
                colors: ['#f3f3f3', 'transparent'],
                opacity: 0.5
            }
        },
        title: {
            text: 'Social Breakdown Analysis',
            align: 'center',
            style: {
                fontSize: '18px',
                fontWeight: 600
            }
        },
        subtitle: {
            text: `Social categories: ${categories.join(', ')}`,
            align: 'center',
            style: {
                fontSize: '12px',
                color: '#666'
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '14px',
            fontWeight: 600
        }
    };

    if (chartType === 'line') {
        return {
            ...baseConfig,
            chart: {
                ...baseConfig.chart,
                type: 'line'
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            markers: {
                size: 6,
                strokeColors: '#fff',
                strokeWidth: 2,
                hover: {
                    size: 8
                }
            }
        };
    } else if (chartType === 'bar') {
        return {
            ...baseConfig,
            chart: {
                ...baseConfig.chart,
                type: 'bar'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4
                }
            }
        };
    }

    return baseConfig;
};

// Create dynamic governance breakdown chart options
const createGovernanceChartOptions = (yearlyGovernance, chartType = 'line') => {
    const categories = Object.keys(yearlyGovernance.categories || {});
    const colors = [
        '#6743B7', '#3376F0', '#53A654', '#FF6B6B', '#4ECDC4',
        '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC', '#26A69A'
    ];

    // Ensure we have valid data
    if (categories.length === 0 || !yearlyGovernance.years || yearlyGovernance.years.length === 0) {
        return null;
    }

    const baseConfig = {
        chart: {
            height: CHART_HEIGHT,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        xaxis: {
            categories: yearlyGovernance.years,
            title: {
                text: 'Year',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            }
        },
        yaxis: {
            title: {
                text: 'Score',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            },
            min: 0,
            max: 100
        },
        colors: categories.map((_, index) => colors[index % colors.length]),
        grid: {
            borderColor: '#e7e7e7',
            row: {
                colors: ['#f3f3f3', 'transparent'],
                opacity: 0.5
            }
        },
        title: {
            text: 'Governance Breakdown Analysis',
            align: 'center',
            style: {
                fontSize: '18px',
                fontWeight: 600
            }
        },
        subtitle: {
            text: `Governance categories: ${categories.join(', ')}`,
            align: 'center',
            style: {
                fontSize: '12px',
                color: '#666'
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '14px',
            fontWeight: 600
        }
    };

    if (chartType === 'line') {
        return {
            ...baseConfig,
            chart: {
                ...baseConfig.chart,
                type: 'line'
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            markers: {
                size: 6,
                strokeColors: '#fff',
                strokeWidth: 2,
                hover: {
                    size: 8
                }
            }
        };
    } else if (chartType === 'bar') {
        return {
            ...baseConfig,
            chart: {
                ...baseConfig.chart,
                type: 'bar'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 4
                }
            }
        };
    }

    return baseConfig;
};

const createConsumptionChartOptions = (yearlyConsumption) => {
    const categories = ["Electricity Consumption", "Water Consumption", "Petrol Consumption", "Diesel Consumption"];
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726'
    ];

    // Ensure we have valid data
    if (!yearlyConsumption.years || yearlyConsumption.years.length === 0) {
        return null;
    }

    return {
        chart: {
            type: 'line',
            height: CHART_HEIGHT,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        series: categories.map(category => ({
            name: category,
            data: yearlyConsumption[category] || []
        })),
        xaxis: {
            categories: yearlyConsumption.years,
            title: {
                text: 'Year',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            }
        },
        yaxis: {
            title: {
                text: 'Consumption',
                style: {
                    fontSize: '14px',
                    fontWeight: 600
                }
            }
        },
        colors: colors,
        stroke: {
            curve: 'smooth',
            width: 3
        },
        markers: {
            size: 6,
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: {
                size: 8
            }
        },
        grid: {
            borderColor: '#e7e7e7',
            row: {
                colors: ['#f3f3f3', 'transparent'],
                opacity: 0.5
            }
        },
        title: {
            text: 'Resource Consumption Analysis',
            align: 'center',
            style: {
                fontSize: '18px',
                fontWeight: 600
            }
        },
        subtitle: {
            text: 'Consumption trends over the years',
            align: 'center',
            style: {
                fontSize: '12px',
                color: '#666'
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'center',
            fontSize: '14px',
            fontWeight: 600
        }
    };
};

const ChartTypeSwitcher = ({ chartType, onChartTypeChange }) => (
    <div style={{
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px'
    }}>
        <button
            onClick={() => onChartTypeChange('line')}
            style={{
                padding: '8px 16px',
                backgroundColor: chartType === 'line' ? '#1976d2' : '#f5f5f5',
                color: chartType === 'line' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: chartType === 'line' ? '600' : '400',
                transition: 'all 0.2s ease'
            }}
        >
            📈 Line Chart
        </button>
        <button
            onClick={() => onChartTypeChange('bar')}
            style={{
                padding: '8px 16px',
                backgroundColor: chartType === 'bar' ? '#1976d2' : '#f5f5f5',
                color: chartType === 'bar' ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: chartType === 'bar' ? '600' : '400',
                transition: 'all 0.2s ease'
            }}
        >
            📊 Bar Chart
        </button>
    </div>
);

const LoadingSpinner = () => (
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1976d2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
        }}></div>
        <p>Loading chart data...</p>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

const ChartInformation = () => (
    <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px'
    }}>
        <h4>Chart Information:</h4>
        <p><strong>X-axis:</strong> Years (2020-2024)</p>
        <p><strong>Y-axis:</strong> Weight Score (0-100 scale)</p>
        <p><strong>Data Series:</strong></p>
        <ul style={{ marginLeft: '20px' }}>
            <li>
                <span style={{ color: CHART_COLORS.environment, fontWeight: 'bold' }}>● Environment</span> - Red line
            </li>
            <li>
                <span style={{ color: CHART_COLORS.social, fontWeight: 'bold' }}>● Social</span> - Blue line
            </li>
            <li>
                <span style={{ color: CHART_COLORS.governance, fontWeight: 'bold' }}>● Governance</span> - Green line
            </li>
        </ul>
    </div>
);

const ChartErrorBoundary = ({ children, fallback, chartName = 'Chart' }) => {
    try {
        return children;
    } catch (error) {
        console.error(`${chartName} rendering error:`, error);
        return fallback || (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#d32f2f',
                backgroundColor: '#ffebee',
                borderRadius: '4px',
                border: '1px solid #ffcdd2'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#c62828' }}>⚠️ Chart Error</h4>
                <p style={{ margin: '0 0 15px 0' }}>{chartName} failed to load. This might be due to invalid data or a rendering issue.</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Refresh Page
                </button>
            </div>
        );
    }
};

const SafeChart = ({ options, series, type, height, chartName = 'Chart' }) => {
    // Check if we have valid options and series data
    if (!options || !series || series.length === 0) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#424242' }}>📊 No Data Available</h4>
                <p style={{ margin: '0' }}>No data available for {chartName.toLowerCase()}.</p>
            </div>
        );
    }

    // Validate that series data has valid arrays
    const hasValidData = series.every(s => Array.isArray(s.data) && s.data.length > 0);
    if (!hasValidData) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#424242' }}>📈 Insufficient Data</h4>
                <p style={{ margin: '0' }}>Insufficient data to display {chartName.toLowerCase()}.</p>
            </div>
        );
    }

    // Additional validation for chart options
    try {
        if (!options.xaxis || !options.xaxis.categories || options.xaxis.categories.length === 0) {
            throw new Error('Invalid x-axis configuration');
        }
    } catch (validationError) {
        console.error(`${chartName} validation error:`, validationError);
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#d32f2f',
                backgroundColor: '#ffebee',
                borderRadius: '4px',
                border: '1px solid #ffcdd2'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#c62828' }}>⚠️ Configuration Error</h4>
                <p style={{ margin: '0' }}>{chartName} has invalid configuration. Please check the data format.</p>
            </div>
        );
    }

    return (
        <ChartErrorBoundary chartName={chartName}>
            <ReactApexChart
                options={options}
                series={series}
                type={type}
                height={height}
            />
        </ChartErrorBoundary>
    );
};

const MsmeAnalysis = () => {
    const [yearlyESGData, setYearlyESGData] = useState({
        years: [],
        Environment: [],
        Social: [],
        Governance: []
    });
    const [yearlyEnvironment, setYearlyEnvironment] = useState({
        years: [],
        categories: {}
    });
    const [yearlySocial, setYearlySocial] = useState({
        years: [],
        categories: {}
    });
    const [yearlyGovernance, setYearlyGovernance] = useState({
        years: [],
        categories: {}
    });
    const [yearlyConsumption, setYearlyConsumption] = useState({
        years: [],
        "Electricity Consumption": [],
        "Water Consumption": [],
        "Petrol Consumption": [],
        "Diesel Consumption": []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorType, setErrorType] = useState(null); // 'network', 'auth', 'data', 'unknown'
    const [retryCount, setRetryCount] = useState(0);
    const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

    // Process yearly data from API response
    const processYearlyData = (apiData) => {
        try {
            if (!apiData || !Array.isArray(apiData)) {
                console.warn('processYearlyData: Invalid API data received', apiData);
                setYearlyESGData({
                    years: [],
                    Environment: [],
                    Social: [],
                    Governance: []
                });
                setYearlyEnvironment({
                    years: [],
                    categories: {}
                });
                setYearlySocial({
                    years: [],
                    categories: {}
                });
                setYearlyGovernance({
                    years: [],
                    categories: {}
                });
                return;
            }

        // Sort the data by year in ascending order
        const sortedData = [...apiData].sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearA - yearB;
        });

        const processedESGData = {
            years: [],
            Environment: [],
            Social: [],
            Governance: []
        };

        const processedConsumptionData = {
            years: [],
            "Electricity Consumption": [],
            "Water Consumption": [],
            "Petrol Consumption": [],
            "Diesel Consumption": [],
        };

        const environmentData = {
            years: [],
            categories: {}
        };

        const socialData = {
            years: [],
            categories: {}
        };

        const governanceData = {
            years: [],
            categories: {}
        };

        // Track all unique categories across all data points for each pillar
        const allEnvironmentCategories = new Set();
        const allSocialCategories = new Set();
        const allGovernanceCategories = new Set();

        // First pass: collect all possible categories for each pillar
        sortedData.forEach(item => {
            if (item.year && item.score && item.score.breakdown) {
                const breakdown = item.score.breakdown;

                // Collect Environment categories
                if (breakdown.Environment) {
                    Object.keys(breakdown.Environment).forEach(category => {
                        allEnvironmentCategories.add(category);
                    });
                }

                // Collect Social categories
                if (breakdown.Social) {
                    Object.keys(breakdown.Social).forEach(category => {
                        allSocialCategories.add(category);
                    });
                }

                // Collect Governance categories
                if (breakdown.Governance) {
                    Object.keys(breakdown.Governance).forEach(category => {
                        allGovernanceCategories.add(category);
                    });
                }
            }
        });

        // Initialize categories with empty arrays
        allEnvironmentCategories.forEach(category => {
            environmentData.categories[category] = [];
        });
        allSocialCategories.forEach(category => {
            socialData.categories[category] = [];
        });
        allGovernanceCategories.forEach(category => {
            governanceData.categories[category] = [];
        });

        // Second pass: populate data
        sortedData.forEach(item => {
            if (item.year && item.score) {
                processedESGData.years.push(item.year);
                processedESGData.Environment.push(item.score.Environment || 0);
                processedESGData.Social.push(item.score.Social || 0);
                processedESGData.Governance.push(item.score.Governance || 0);

                processedConsumptionData.years.push(item.year);

                // Safely access consumption data with null checks
                if (item.consumption) {
                    processedConsumptionData["Electricity Consumption"].push(
                        parseFloat(item.consumption["Electricity Consumption"]) || 0
                    );
                    processedConsumptionData["Water Consumption"].push(
                        parseFloat(item.consumption["Water Consumption"]) || 0
                    );
                    processedConsumptionData["Petrol Consumption"].push(
                        parseFloat(item.consumption["Petrol Consumption"]) || 0
                    );
                    processedConsumptionData["Diesel Consumption"].push(
                        parseFloat(item.consumption["Diesel Consumption"]) || 0
                    );
                } else {
                    // Default values if consumption data is missing
                    processedConsumptionData["Electricity Consumption"].push(0);
                    processedConsumptionData["Water Consumption"].push(0);
                    processedConsumptionData["Petrol Consumption"].push(0);
                    processedConsumptionData["Diesel Consumption"].push(0);
                }

                // Safely access breakdown data with null checks
                const breakdown = item.score.breakdown;
                environmentData.years.push(item.year);
                socialData.years.push(item.year);
                governanceData.years.push(item.year);

                console.log(breakdown);

                // Check if breakdown exists before accessing nested properties
                if (breakdown) {
                    // Populate Environment categories
                    if (breakdown.Environment) {
                        allEnvironmentCategories.forEach(category => {
                            environmentData.categories[category].push(
                                breakdown.Environment[category] || 0
                            );
                        });
                    } else {
                        allEnvironmentCategories.forEach(category => {
                            environmentData.categories[category].push(0);
                        });
                    }

                    // Populate Social categories
                    if (breakdown.Social) {
                        allSocialCategories.forEach(category => {
                            socialData.categories[category].push(
                                breakdown.Social[category] || 0
                            );
                        });
                    } else {
                        allSocialCategories.forEach(category => {
                            socialData.categories[category].push(0);
                        });
                    }

                    // Populate Governance categories
                    if (breakdown.Governance) {
                        allGovernanceCategories.forEach(category => {
                            governanceData.categories[category].push(
                                breakdown.Governance[category] || 0
                            );
                        });
                    } else {
                        allGovernanceCategories.forEach(category => {
                            governanceData.categories[category].push(0);
                        });
                    }
                } else {
                    // Default values if breakdown data is missing
                    allEnvironmentCategories.forEach(category => {
                        environmentData.categories[category].push(0);
                    });
                    allSocialCategories.forEach(category => {
                        socialData.categories[category].push(0);
                    });
                    allGovernanceCategories.forEach(category => {
                        governanceData.categories[category].push(0);
                    });
                }
            }
        });

            console.log("processedConsumptionData", processedConsumptionData);

            setYearlyESGData(processedESGData);
            setYearlyEnvironment(environmentData);
            setYearlySocial(socialData);
            setYearlyGovernance(governanceData);
            setYearlyConsumption(processedConsumptionData);
        } catch (error) {
            console.error('Error processing yearly data:', error);
            setError('Failed to process assessment data. Please try again.');
            setErrorType('data');
        }
    };

    // Fetch assessment data
    const fetchAssessmentData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setErrorType(null);

            const userId = localStorage.getItem('user_id');
            
            // Validate authentication
            if (!userId) {
                throw new Error('User ID not found. Please log in again.');
            }

            console.log(`Fetching assessment data for user ${userId}...`);

            const response = await api.get(
                `/assessment/user/get-responses?user_id=${userId}&selected_only=true`
            );

            // Handle different HTTP status codes
            if (response.status !== 200) {
                const status = response.status;
                if (status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                } else if (status === 403) {
                    throw new Error('Access denied. You do not have permission to view this data.');
                } else if (status === 404) {
                    throw new Error('Assessment data not found. Please complete an assessment first.');
                } else if (status >= 500) {
                    throw new Error('Server error. Please try again later or contact support.');
                } else {
                    throw new Error(`Request failed with status ${status}. Please try again.`);
                }
            }

            const data = response.data;

            // Validate response data structure
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid data format received from server.');
            }

            if (data.length === 0) {
                throw new Error('No assessment data found. Please complete an assessment first.');
            }

            // Process the data
            if (data[0] && data[0].years) {
                processYearlyData(data[0].years);
            } else {
                throw new Error('Assessment data is incomplete. Please try again.');
            }

            // Reset retry count on successful fetch
            setRetryCount(0);

        } catch (err) {
            //console.error("Error fetching assessment data:", err);
            
            // Determine error type for better user experience
            let errorMessage = err.message || 'Failed to load assessment data. Please try again later.';
            let errorType = 'unknown';

            if (err.message.includes('Authentication') || err.message.includes('token')) {
                errorType = 'auth';
            } else if (err.message.includes('network') || err.message.includes('fetch')) {
                errorType = 'network';
            } else if (err.message.includes('data') || err.message.includes('format')) {
                errorType = 'data';
            }

            setError(errorMessage);
            setErrorType(errorType);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssessmentData();
    }, [fetchAssessmentData]);

    // Generate chart options with current data
    const chartOptions = createChartOptions(yearlyESGData);

    // Only create breakdown chart options if there are categories
    const hasEnvironmentCategories = Object.keys(yearlyEnvironment.categories || {}).length > 0;
    const hasSocialCategories = Object.keys(yearlySocial.categories || {}).length > 0;
    const hasGovernanceCategories = Object.keys(yearlyGovernance.categories || {}).length > 0;

    const environmentChartOptions = hasEnvironmentCategories
        ? createEnvironmentChartOptions(yearlyEnvironment, chartType)
        : null;
    const socialChartOptions = hasSocialCategories
        ? createSocialChartOptions(yearlySocial, chartType)
        : null;
    const governanceChartOptions = hasGovernanceCategories
        ? createGovernanceChartOptions(yearlyGovernance, chartType)
        : null;

    // Create series data for each chart
    const createSeriesData = (data, categories) => {
        if (!categories || categories.length === 0) return [];
        return categories.map(category => ({
            name: category,
            data: data.categories[category] || []
        }));
    };

    const environmentSeries = hasEnvironmentCategories
        ? createSeriesData(yearlyEnvironment, Object.keys(yearlyEnvironment.categories))
        : [];
    const socialSeries = hasSocialCategories
        ? createSeriesData(yearlySocial, Object.keys(yearlySocial.categories))
        : [];
    const governanceSeries = hasGovernanceCategories
        ? createSeriesData(yearlyGovernance, Object.keys(yearlyGovernance.categories))
        : [];

    // Consumption chart
    const hasConsumptionData = yearlyConsumption.years && yearlyConsumption.years.length > 0;
    const consumptionChartOptions = hasConsumptionData
        ? createConsumptionChartOptions(yearlyConsumption)
        : null;
    const consumptionSeries = hasConsumptionData
        ? ["Electricity Consumption", "Water Consumption", "Petrol Consumption", "Diesel Consumption"].map(category => ({
            name: category,
            data: yearlyConsumption[category] || []
        }))
        : [];

    // Handle chart type change
    const handleChartTypeChange = (newChartType) => {
        setChartType(newChartType);
    };

    // Handle retry with exponential backoff
    const handleRetry = () => {
        if (retryCount >= 3) {
            setError('Maximum retry attempts reached. Please refresh the page or contact support.');
            return;
        }
        
        setRetryCount(prev => prev + 1);
        
        // Add delay for retry attempts
        setTimeout(() => {
            fetchAssessmentData();
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff: 1s, 2s, 4s
    };

    // Handle authentication error
    const handleAuthError = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
    };

    // Error component with different states
    const ErrorComponent = () => {
        const getErrorIcon = () => {
            switch (errorType) {
                case 'auth': return '🔐';
                case 'network': return '🌐';
                case 'data': return '📊';
                default: return '⚠️';
            }
        };

        const getErrorColor = () => {
            switch (errorType) {
                case 'auth': return '#d32f2f';
                case 'network': return '#f57c00';
                case 'data': return '#7b1fa2';
                default: return '#d32f2f';
            }
        };

        const getErrorTitle = () => {
            switch (errorType) {
                case 'auth': return 'Authentication Error';
                case 'network': return 'Connection Error';
                case 'data': return 'Data Error';
                default: return 'Error';
            }
        };

        return (
            <div className="mb-3">
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '30px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    border: `2px solid ${getErrorColor()}20`
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '20px'
                    }}>
                        {getErrorIcon()}
                    </div>
                    
                    <h3 style={{
                        color: getErrorColor(),
                        margin: '0 0 15px 0',
                        fontSize: '24px',
                        fontWeight: '600'
                    }}>
                        {getErrorTitle()}
                    </h3>
                    
                    <p style={{
                        color: '#666',
                        margin: '0 0 25px 0',
                        fontSize: '16px',
                        lineHeight: '1.5'
                    }}>
                        {error}
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {errorType === 'auth' ? (
                            <button
                                onClick={handleAuthError}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: getErrorColor(),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#b71c1c'}
                                onMouseOut={(e) => e.target.style.backgroundColor = getErrorColor()}
                            >
                                🔑 Go to Login
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleRetry}
                                    disabled={retryCount >= 3}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: retryCount >= 3 ? '#ccc' : '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: retryCount >= 3 ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease',
                                        opacity: retryCount >= 3 ? 0.6 : 1
                                    }}
                                    onMouseOver={(e) => {
                                        if (retryCount < 3) {
                                            e.target.style.backgroundColor = '#1565c0';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (retryCount < 3) {
                                            e.target.style.backgroundColor = '#1976d2';
                                        }
                                    }}
                                >
                                    🔄 Retry {retryCount > 0 && `(${retryCount}/3)`}
                                </button>
                                
                                <button
                                    onClick={() => window.location.reload()}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#f5f5f5',
                                        color: '#333',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                >
                                    🔄 Refresh Page
                                </button>
                            </>
                        )}
                    </div>

                    {retryCount > 0 && retryCount < 3 && (
                        <p style={{
                            color: '#666',
                            fontSize: '12px',
                            margin: '15px 0 0 0',
                            fontStyle: 'italic'
                        }}>
                            Retrying in {Math.pow(2, retryCount)} seconds...
                        </p>
                    )}

                    {retryCount >= 3 && (
                        <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            color: '#856404'
                        }}>
                            <p style={{ margin: '0', fontSize: '14px' }}>
                                💡 <strong>Need help?</strong> Contact support or try refreshing the page.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Show error component if there's an error
    if (error) {
        // return <ErrorComponent />;\
        return <div></div>;
    }

    return (
        <div>
            {loading ? (
                <LoadingSpinner />
            ) : (
                <div
                    className="mb-3"
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}>
                    <div className="row">
                        <div className="col-6">
                            <SafeChart
                                options={chartOptions}
                                series={chartOptions.series}
                                type="line"
                                height={CHART_HEIGHT}
                                chartName="ESG Overview Chart"
                            />
                        </div>
                        {/* Consumption Chart */}
                        {hasConsumptionData && (
                            <div className="col-6">
                                <SafeChart
                                    options={consumptionChartOptions}
                                    series={consumptionSeries}
                                    type="line"
                                    height={CHART_HEIGHT}
                                    chartName="Resource Consumption Chart"
                                />
                            </div>
                        )}
                    </div>
                    {/* ESG Overview Chart */}


                    {/* Chart Type Switcher */}
                    <ChartTypeSwitcher
                        chartType={chartType}
                        onChartTypeChange={handleChartTypeChange}
                    />

                    <div className="row">
                        {/* Environment Breakdown Chart */}
                        {hasEnvironmentCategories && (
                            <div className="col-6" style={{ marginTop: '40px' }}>
                                <SafeChart
                                    options={environmentChartOptions}
                                    series={environmentSeries}
                                    type={chartType}
                                    height={CHART_HEIGHT}
                                    chartName="Environment Breakdown Chart"
                                />
                            </div>
                        )}

                        {/* Social Breakdown Chart */}
                        {hasSocialCategories && (
                            <div className="col-6" style={{ marginTop: '40px' }}>
                                <SafeChart
                                    options={socialChartOptions}
                                    series={socialSeries}
                                    type={chartType}
                                    height={CHART_HEIGHT}
                                    chartName="Social Breakdown Chart"
                                />
                            </div>
                        )}

                        {/* Governance Breakdown Chart */}
                        {hasGovernanceCategories && (
                            <div className="col-12" style={{ marginTop: '40px' }}>
                                <SafeChart
                                    options={governanceChartOptions}
                                    series={governanceSeries}
                                    type={chartType}
                                    height={CHART_HEIGHT}
                                    chartName="Governance Breakdown Chart"
                                />
                            </div>
                        )}
                    </div>
                    {/* <ChartInformation /> */}
                </div>
            )}
        </div>
    );
};

export default MsmeAnalysis;