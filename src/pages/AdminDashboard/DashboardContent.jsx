import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Title from '../../layouts/Title/Title';
import './DashboardContent.css';
import Assesments from './Assesments';
import api from '../../utils/api';
import { getScoreColor } from '../../utils/scoreUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

function DashboardContent() {
    const [users, setUsers] = useState([]);
    const [userAssessmentData, setUserAssessmentData] = useState({});
    const [loading, setLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isGeneratingPNG, setIsGeneratingPNG] = useState(false);
    const dashboardRef = useRef(null);
    const [showCalculationData, setShowCalculationData] = useState(false);
    
    // Filter states
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    // Callback function to receive assessment data from child components
    const handleAssessmentData = useCallback((userId, assessmentData) => {
        setUserAssessmentData(prev => ({
            ...prev,
            [userId]: assessmentData
        }));
    }, []);


    // Helper function to get category score from assessment (for display - rounded)
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

    // Helper function to get category score with full precision (for calculations - not rounded)
    const getCategoryScorePrecise = (assessment, category) => {
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
                    return (totalScore / totalMax) * 100; // No rounding - keep full precision
                }
            }
        }

        // Fallback: Use the raw scores and category_max
        if (assessment.score.category_max && assessment.score.category_max[category] !== undefined) {
            const categoryScore = assessment.score[category] || 0;
            const categoryMax = assessment.score.category_max[category] || 1;
            return (categoryScore / categoryMax) * 100; // No rounding - keep full precision
        }

        // Handle old format
        if (assessment.score[category] !== undefined) {
            return assessment.score[category];
        }

        return null;
    };

    // Helper function to get overall score from assessment (for display - rounded)
    const getOverallScore = (assessment) => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        // Check if it's the new format with total_score - use actual max_score from assessment
        if (assessment.score.total_score !== undefined) {
            const maxScore = assessment.score.max_score || 300; // Fallback to 300 if max_score not available
            return Math.round((assessment.score.total_score / maxScore) * 100);
        }

        // Check if it's the old format with Environment, Social, Governance
        if (assessment.score.Environment !== undefined) {
            const scores = Object.values(assessment.score).filter(val => typeof val === 'number');
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return Math.round(average);
        }

        return null;
    };

    // Helper function to get overall score with full precision (for calculations - not rounded)
    const getOverallScorePrecise = (assessment) => {
        if (!assessment?.score || typeof assessment.score !== 'object') return null;

        // Check if it's the new format with total_score - use actual max_score from assessment
        if (assessment.score.total_score !== undefined) {
            const maxScore = assessment.score.max_score || 300; // Fallback to 300 if max_score not available
            return (assessment.score.total_score / maxScore) * 100; // No rounding - keep full precision
        }

        // Check if it's the old format with Environment, Social, Governance
        if (assessment.score.Environment !== undefined) {
            const scores = Object.values(assessment.score).filter(val => typeof val === 'number');
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return average; // No rounding - keep full precision
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

    // Helper functions to get unique filter values
    const getUniqueSectors = useMemo(() => {
        const sectors = new Set();
        users.forEach(user => {
            if (user.sector) sectors.add(user.sector);
        });
        return Array.from(sectors).sort();
    }, [users]);

    const getUniqueSizes = useMemo(() => {
        const sizes = new Set();
        users.forEach(user => {
            if (user.business_size) sizes.add(user.business_size);
        });
        return Array.from(sizes).sort();
    }, [users]);

    const getUniqueIndustries = useMemo(() => {
        const industries = new Set();
        users.forEach(user => {
            if (user.industry) industries.add(user.industry);
        });
        return Array.from(industries).sort();
    }, [users]);

    const getUniqueLocations = useMemo(() => {
        const locations = new Set();
        users.forEach(user => {
            const location = user.location || user.address?.location;
            if (location) locations.add(location);
        });
        return Array.from(locations).sort();
    }, [users]);

    const getUniqueYears = useMemo(() => {
        const years = new Set();
        users.forEach(user => {
            const userData = userAssessmentData[user.id];
            if (userData && userData.yearlyAssessment && Array.isArray(userData.yearlyAssessment)) {
                userData.yearlyAssessment.forEach(assessment => {
                    if (assessment.year) years.add(assessment.year.toString());
                });
            }
        });
        return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [users, userAssessmentData]);

    // Filter users based on selected filters
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Filter by sector
            if (selectedSector && user.sector !== selectedSector) return false;
            
            // Filter by size
            if (selectedSize && user.business_size !== selectedSize) return false;
            
            // Filter by industry
            if (selectedIndustry && user.industry !== selectedIndustry) return false;
            
            // Filter by location
            if (selectedLocation) {
                const location = user.location || user.address?.location;
                if (location !== selectedLocation) return false;
            }
            
            // Filter by year
            if (selectedYear) {
                const userData = userAssessmentData[user.id];
                if (!userData || !userData.yearlyAssessment || !Array.isArray(userData.yearlyAssessment)) {
                    return false;
                }
                const hasYear = userData.yearlyAssessment.some(assessment => 
                    assessment.year && assessment.year.toString() === selectedYear
                );
                if (!hasYear) return false;
            }
            
            return true;
        });
    }, [users, selectedSector, selectedSize, selectedIndustry, selectedLocation, selectedYear, userAssessmentData]);

    // Pre-calculate all user metrics to avoid recalculating on every render
    const userMetrics = useMemo(() => {
        const metrics = {};

        filteredUsers.forEach(user => {
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
    }, [filteredUsers, userAssessmentData]);

    // Single Source of Truth: Consolidated valid assessments list
    // This ensures all charts and metrics use the EXACT same set of "Latest per Year" assessments
    const validAssessments = useMemo(() => {
        const validList = [];

        filteredUsers.forEach(user => {
            const userData = userAssessmentData[user.id];
            
            if (userData && userData.yearlyAssessment && Array.isArray(userData.yearlyAssessment)) {
                // Group assessments by year and select only the latest one per year
                const assessmentsByYear = {};
                
                userData.yearlyAssessment.forEach(assessment => {
                    const year = assessment.year ? parseInt(assessment.year) : null;
                    if (isNaN(year)) return;
                    
                    const yearKey = year.toString();
                    
                    // Logic to prioritize selected, then latest date
                    if (!assessmentsByYear[yearKey] || assessment.is_selected === true) {
                        assessmentsByYear[yearKey] = assessment;
                    }
                    else if (assessment.is_selected !== true && assessmentsByYear[yearKey].is_selected !== true) {
                        const currentDate = assessment.submitted_at || assessment.created_at || '';
                        const existingDate = assessmentsByYear[yearKey].submitted_at || assessmentsByYear[yearKey].created_at || '';
                        if (currentDate > existingDate) {
                            assessmentsByYear[yearKey] = assessment;
                        }
                    }
                });

                Object.values(assessmentsByYear).forEach(assessment => {
                    validList.push({
                        assessment,
                        user
                    });
                });
            }
        });
        
        return validList;
    }, [filteredUsers, userAssessmentData]);

    // Calculate metrics and breakdown from validAssessments
    const dashboardData = useMemo(() => {
        const breakdown = {
            firms: [],
            totalAssessments: 0,
            scoreTotals: {
                overall: { sum: 0, roundedSum: 0, count: 0, scores: [] },
                environment: { sum: 0, roundedSum: 0, count: 0, scores: [] },
                social: { sum: 0, roundedSum: 0, count: 0, scores: [] },
                governance: { sum: 0, roundedSum: 0, count: 0, scores: [] }
            },
            assessmentDetails: []
        };
        
        const firmsSet = new Set();
        const years = [];
        
        // Helper to group by firm for the breakdown table
        const firmAssessmentsMap = {};

        validAssessments.forEach(({ assessment, user }) => {
            breakdown.totalAssessments++;
            firmsSet.add(user.id);

            // Use precise functions
            const overall = getOverallScorePrecise(assessment);
            const env = getCategoryScorePrecise(assessment, 'Environment');
            const social = getCategoryScorePrecise(assessment, 'Social');
            const gov = getCategoryScorePrecise(assessment, 'Governance');

            // Track scores
            if (overall !== null) {
                breakdown.scoreTotals.overall.sum += overall;
                breakdown.scoreTotals.overall.roundedSum += parseFloat(overall.toFixed(2));
                breakdown.scoreTotals.overall.count++;
                breakdown.scoreTotals.overall.scores.push(overall);
            }

            if (env !== null) {
                breakdown.scoreTotals.environment.sum += env;
                breakdown.scoreTotals.environment.roundedSum += parseFloat(env.toFixed(2));
                breakdown.scoreTotals.environment.count++;
                breakdown.scoreTotals.environment.scores.push(env);
            }

            if (social !== null) {
                breakdown.scoreTotals.social.sum += social;
                breakdown.scoreTotals.social.roundedSum += parseFloat(social.toFixed(2));
                breakdown.scoreTotals.social.count++;
                breakdown.scoreTotals.social.scores.push(social);
            }

            if (gov !== null) {
                breakdown.scoreTotals.governance.sum += gov;
                breakdown.scoreTotals.governance.roundedSum += parseFloat(gov.toFixed(2));
                breakdown.scoreTotals.governance.count++;
                breakdown.scoreTotals.governance.scores.push(gov);
            }
            
            if (assessment.year) {
                const year = parseInt(assessment.year);
                if (!isNaN(year)) years.push(year);
            }

            // Assessment Details for Table
            const assessmentDetail = {
                firmName: user.firm || 'N/A',
                year: assessment.year || 'N/A',
                isSelected: assessment.is_selected === true,
                submittedAt: assessment.submitted_at || assessment.created_at || 'N/A',
                overall: overall !== null ? parseFloat(overall.toFixed(2)) : null,
                environment: env !== null ? parseFloat(env.toFixed(2)) : null,
                social: social !== null ? parseFloat(social.toFixed(2)) : null,
                governance: gov !== null ? parseFloat(gov.toFixed(2)) : null
            };
            breakdown.assessmentDetails.push(assessmentDetail);

            // Group for Firm Breakdown
            if (!firmAssessmentsMap[user.id]) {
                firmAssessmentsMap[user.id] = {
                    firmName: user.firm || 'N/A',
                    assessments: []
                };
            }
            firmAssessmentsMap[user.id].assessments.push({
                year: assessment.year || 'N/A',
                isSelected: assessment.is_selected === true,
                overall: overall !== null ? parseFloat(overall.toFixed(2)) : null,
                environment: env !== null ? parseFloat(env.toFixed(2)) : null,
                social: social !== null ? parseFloat(social.toFixed(2)) : null,
                governance: gov !== null ? parseFloat(gov.toFixed(2)) : null
            });
        });

        // Convert map to array
        breakdown.firms = Object.values(firmAssessmentsMap);
        
        const latestYear = years.length > 0 ? Math.max(...years).toString() : 'N/A';
        
        const metrics = {
            totalAssessments: breakdown.totalAssessments,
            totalFirms: filteredUsers.length,
            firmsWithAssessments: firmsSet.size,
            averageESGScore: breakdown.scoreTotals.overall.count > 0 ? parseFloat((breakdown.scoreTotals.overall.sum / breakdown.scoreTotals.overall.count).toFixed(2)) : 0,
            environmentAverage: breakdown.scoreTotals.environment.count > 0 ? parseFloat((breakdown.scoreTotals.environment.sum / breakdown.scoreTotals.environment.count).toFixed(2)) : 0,
            socialAverage: breakdown.scoreTotals.social.count > 0 ? parseFloat((breakdown.scoreTotals.social.sum / breakdown.scoreTotals.social.count).toFixed(2)) : 0,
            governanceAverage: breakdown.scoreTotals.governance.count > 0 ? parseFloat((breakdown.scoreTotals.governance.sum / breakdown.scoreTotals.governance.count).toFixed(2)) : 0,
            latestYear
        };

        return { metrics, breakdown };
    }, [filteredUsers.length, validAssessments]);
    
    const overallMetrics = dashboardData.metrics;
    const calculationBreakdown = dashboardData.breakdown;

    // Prepare data for ESG distribution chart using pre-calculated metrics
    const esgDistributionData = useMemo(() => {
        const distribution = {
            'Advanced (80-100%)': 0,
            'Intermediate (50-80%)': 0,
            'Developing (30-50%)': 0,
            'Basic (0-30%)': 0,
            'Yet To Start (0%)': 0
        };

        Object.values(userMetrics).forEach(metrics => {
            if (metrics.overallScore >= 0) {
                if (metrics.overallScore === 0) distribution['Yet To Start (0%)']++;
                else if (metrics.overallScore <= 30) distribution['Basic (0-30%)']++;
                else if (metrics.overallScore <= 50) distribution['Developing (30-50%)']++;
                else if (metrics.overallScore <= 80) distribution['Intermediate (50-80%)']++;
                else distribution['Advanced (80-100%)']++;
            }
        });

        return {
            labels: Object.keys(distribution),
            datasets: [{
                data: Object.values(distribution),
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green for Advanced
                    'rgba(59, 130, 246, 0.8)',   // Blue for Intermediate
                    'rgba(245, 158, 11, 0.8)',   // Orange for Developing
                    'rgba(239, 68, 68, 0.8)',   // Red for Basic
                    'rgba(108, 117, 125, 0.8)'   // Gray for Yet To Start
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(108, 117, 125, 1)'
                ],
                borderWidth: 2
            }]
        };
    }, [userMetrics]);

    // Prepare data for ESG category comparison using pre-calculated metrics
    const esgCategoryData = useMemo(() => {
        return {
            labels: ['Environment', 'Social', 'Governance'],
            datasets: [{
                label: 'Average Score (%)',
                data: [
                    overallMetrics.environmentAverage,
                    overallMetrics.socialAverage,
                    overallMetrics.governanceAverage
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 2
            }]
        };
    }, [overallMetrics]);

    // Prepare data for ESG Score by Industry chart (Using validAssessments for consistency)
    const esgByIndustryData = useMemo(() => {
        const industryStats = {};

        validAssessments.forEach(({ assessment, user }) => {
            const industry = user.industry || 'Unknown';

            if (!industryStats[industry]) {
                industryStats[industry] = {
                    totalFirms: 0, // This will count assessments, but logic below groups by industry
                    totalScore: 0,
                    validAssessments: 0,
                    uniqueFirms: new Set()
                };
            }

            industryStats[industry].uniqueFirms.add(user.id);

            const overall = getOverallScore(assessment); // Keep using rounded for charts if preferred, or Precise?
            // Using getOverallScorePrecise for better accuracy in averages
            const overallPrecise = getOverallScorePrecise(assessment);
            
            if (overallPrecise !== null) {
                industryStats[industry].totalScore += overallPrecise;
                industryStats[industry].validAssessments++;
            }
        });

        // Calculate average scores and prepare chart data
        const industries = Object.keys(industryStats);
        const averageScores = industries.map(industry => {
            const stats = industryStats[industry];
            return stats.validAssessments > 0
                ? Math.round(stats.totalScore / stats.validAssessments)
                : 0;
        });

        // Sort industries by average score (descending)
        const sortedData = industries
            .map((industry, index) => ({
                industry: industry, 
                fullIndustry: industry,
                score: averageScores[index],
                firmCount: industryStats[industry].uniqueFirms.size
            }))
            .sort((a, b) => b.score - a.score);

        return {
            labels: sortedData.map(item => item.industry),
            datasets: [{
                label: 'Average ESG Score (%)',
                data: sortedData.map(item => item.score),
                backgroundColor: sortedData.map((_, index) => {
                    const colors = [
                        'rgba(34, 197, 94, 0.8)',   // Green
                        'rgba(59, 130, 246, 0.8)',   // Blue
                        'rgba(168, 85, 247, 0.8)',   // Purple
                        'rgba(245, 158, 11, 0.8)',   // Orange
                        'rgba(239, 68, 68, 0.8)',    // Red
                        'rgba(16, 185, 129, 0.8)',   // Emerald
                        'rgba(139, 92, 246, 0.8)',   // Violet
                        'rgba(236, 72, 153, 0.8)'    // Pink
                    ];
                    return colors[index % colors.length];
                }),
                borderColor: sortedData.map((_, index) => {
                    const colors = [
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)'
                    ];
                    return colors[index % colors.length];
                }),
                borderWidth: 2
            }]
        };
    }, [validAssessments]);

    // Prepare data for ESG Score by Business Size chart (Using validAssessments)
    const esgByBusinessSizeData = useMemo(() => {
        const businessSizeStats = {};

        validAssessments.forEach(({ assessment, user }) => {
            const businessSize = user.business_size || 'Unknown';

            if (!businessSizeStats[businessSize]) {
                businessSizeStats[businessSize] = {
                    totalFirms: 0,
                    totalScore: 0,
                    validAssessments: 0,
                    uniqueFirms: new Set()
                };
            }

            businessSizeStats[businessSize].uniqueFirms.add(user.id);

            const overallPrecise = getOverallScorePrecise(assessment);
            if (overallPrecise !== null) {
                businessSizeStats[businessSize].totalScore += overallPrecise;
                businessSizeStats[businessSize].validAssessments++;
            }
        });

        // Calculate average scores and prepare chart data
        const businessSizes = Object.keys(businessSizeStats);
        const averageScores = businessSizes.map(size => {
            const stats = businessSizeStats[size];
            return stats.validAssessments > 0
                ? Math.round(stats.totalScore / stats.validAssessments)
                : 0;
        });

        // Sort business sizes by average score (descending)
        const sortedData = businessSizes
            .map((size, index) => ({
                size,
                score: averageScores[index],
                firmCount: businessSizeStats[size].uniqueFirms.size
            }))
            .sort((a, b) => b.score - a.score);

        return {
            labels: sortedData.map(item => item.size),
            datasets: [{
                label: 'Average ESG Score (%)',
                data: sortedData.map(item => item.score),
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green for highest
                    'rgba(59, 130, 246, 0.8)',   // Blue
                    'rgba(168, 85, 247, 0.8)',   // Purple
                    'rgba(245, 158, 11, 0.8)',   // Orange
                    'rgba(239, 68, 68, 0.8)'     // Red for lowest
                ].slice(0, sortedData.length),
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)'
                ].slice(0, sortedData.length),
                borderWidth: 2
            }]
        };
    }, [validAssessments]);

    // Prepare data for ESG Score by Industry Category chart (Using validAssessments)
    const esgByIndustryCategoryData = useMemo(() => {
        const industryCategoryStats = {};

        validAssessments.forEach(({ assessment, user }) => {
            const fullIndustry = user.industry || 'Unknown';

            // Extract main category from industry name
            const mainCategory = fullIndustry.includes(':')
                ? fullIndustry.split(':')[0].trim()
                : fullIndustry;

            if (!industryCategoryStats[mainCategory]) {
                industryCategoryStats[mainCategory] = {
                    totalFirms: 0,
                    totalScore: 0,
                    validAssessments: 0,
                    subcategories: new Set(),
                    uniqueFirms: new Set()
                };
            }

            industryCategoryStats[mainCategory].uniqueFirms.add(user.id);
            industryCategoryStats[mainCategory].subcategories.add(fullIndustry);

            const overallPrecise = getOverallScorePrecise(assessment);
            if (overallPrecise !== null) {
                industryCategoryStats[mainCategory].totalScore += overallPrecise;
                industryCategoryStats[mainCategory].validAssessments++;
            }
        });

        // Calculate average scores and prepare chart data
        const categories = Object.keys(industryCategoryStats);
        const averageScores = categories.map(category => {
            const stats = industryCategoryStats[category];
            return stats.validAssessments > 0
                ? Math.round(stats.totalScore / stats.validAssessments)
                : 0;
        });

        // Sort categories by average score (descending)
        const sortedData = categories
            .map((category, index) => ({
                category,
                score: averageScores[index],
                firmCount: industryCategoryStats[category].uniqueFirms.size,
                subcategoryCount: industryCategoryStats[category].subcategories.size
            }))
            .sort((a, b) => b.score - a.score);

        return {
            labels: sortedData.map(item => item.category),
            datasets: [{
                label: 'Average ESG Score (%)',
                data: sortedData.map(item => item.score),
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green
                    'rgba(59, 130, 246, 0.8)',   // Blue
                    'rgba(168, 85, 247, 0.8)',   // Purple
                    'rgba(245, 158, 11, 0.8)',   // Orange
                    'rgba(239, 68, 68, 0.8)',    // Red
                    'rgba(16, 185, 129, 0.8)',   // Emerald
                    'rgba(139, 92, 246, 0.8)',   // Violet
                    'rgba(236, 72, 153, 0.8)'    // Pink
                ].slice(0, sortedData.length),
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(236, 72, 153, 1)'
                ].slice(0, sortedData.length),
                borderWidth: 2
            }]
        };
    }, [validAssessments]);

    // Prepare data for ESG Score by Sector chart
    const esgBySectorData = useMemo(() => {
        const sectorStats = {};

        validAssessments.forEach(({ assessment, user }) => {
            const sector = user.sector || 'Unknown';

            if (!sectorStats[sector]) {
                sectorStats[sector] = {
                    totalScore: 0,
                    validAssessments: 0,
                    uniqueFirms: new Set()
                };
            }

            sectorStats[sector].uniqueFirms.add(user.id);

            const overallPrecise = getOverallScorePrecise(assessment);
            
            if (overallPrecise !== null) {
                sectorStats[sector].totalScore += overallPrecise;
                sectorStats[sector].validAssessments++;
            }
        });

        // Calculate average scores and prepare chart data
        const sectors = Object.keys(sectorStats);
        const averageScores = sectors.map(sector => {
            const stats = sectorStats[sector];
            return stats.validAssessments > 0
                ? Math.round(stats.totalScore / stats.validAssessments)
                : 0;
        });

        // Sort sectors by average score (descending)
        const sortedData = sectors
            .map((sector, index) => ({
                sector,
                score: averageScores[index],
                firmCount: sectorStats[sector].uniqueFirms.size
            }))
            .sort((a, b) => b.score - a.score);

        return {
            labels: sortedData.map(item => item.sector),
            datasets: [{
                label: 'Average ESG Score (%)',
                data: sortedData.map(item => item.score),
                backgroundColor: sortedData.map((_, index) => {
                    const colors = [
                        'rgba(59, 130, 246, 0.8)',   // Blue
                        'rgba(16, 185, 129, 0.8)',   // Emerald
                        'rgba(245, 158, 11, 0.8)',   // Orange
                        'rgba(239, 68, 68, 0.8)',    // Red
                        'rgba(139, 92, 246, 0.8)',   // Violet
                    ];
                    return colors[index % colors.length];
                }),
                borderColor: sortedData.map((_, index) => {
                    const colors = [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                    ];
                    return colors[index % colors.length];
                }),
                borderWidth: 2
            }]
        };
    }, [validAssessments]);

    // Prepare data for ESG Score by State (Location) chart
    const esgByStateData = useMemo(() => {
        const stateStats = {};

        validAssessments.forEach(({ assessment, user }) => {
            // Get location from top-level or address object
            let state = user.location || (user.address && user.address.location) || 'Unknown';
            state = state.trim();

            if (!stateStats[state]) {
                stateStats[state] = {
                    totalScore: 0,
                    validAssessments: 0,
                    uniqueFirms: new Set()
                };
            }

            stateStats[state].uniqueFirms.add(user.id);

            const overallPrecise = getOverallScorePrecise(assessment);
            
            if (overallPrecise !== null) {
                stateStats[state].totalScore += overallPrecise;
                stateStats[state].validAssessments++;
            }
        });

        // Calculate average scores and prepare chart data
        const states = Object.keys(stateStats);
        const averageScores = states.map(state => {
            const stats = stateStats[state];
            return stats.validAssessments > 0
                ? Math.round(stats.totalScore / stats.validAssessments)
                : 0;
        });

        // Sort states by average score (descending)
        const sortedData = states
            .map((state, index) => ({
                state,
                score: averageScores[index],
                firmCount: stateStats[state].uniqueFirms.size
            }))
            .sort((a, b) => b.score - a.score);

        return {
            labels: sortedData.map(item => item.state),
            datasets: [{
                label: 'Average ESG Score (%)',
                data: sortedData.map(item => item.score),
                backgroundColor: sortedData.map((_, index) => {
                    const colors = [
                        'rgba(168, 85, 247, 0.8)',   // Purple
                        'rgba(236, 72, 153, 0.8)',   // Pink
                        'rgba(59, 130, 246, 0.8)',   // Blue
                        'rgba(34, 197, 94, 0.8)',    // Green
                        'rgba(245, 158, 11, 0.8)',   // Orange
                    ];
                    return colors[index % colors.length];
                }),
                borderColor: sortedData.map((_, index) => {
                    const colors = [
                        'rgba(168, 85, 247, 1)',
                        'rgba(236, 72, 153, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(245, 158, 11, 1)',
                    ];
                    return colors[index % colors.length];
                }),
                borderWidth: 2
            }]
        };
    }, [validAssessments]);

    const chartOptions = {
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
            tooltip: {
                titleFont: {
                    family: 'Poppins, sans-serif',
                    size: 12,
                    weight: '600'
                },
                bodyFont: {
                    family: 'Poppins, sans-serif',
                    size: 11
                }
            }
        }
    };

    const barChartOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function (value) {
                        return value + '%';
                    }
                }
            }
        }
    };

    // Enhanced options for industry chart with custom tooltips (Horizontal)
    const industryChartOptions = {
        ...chartOptions,
        indexAxis: 'y', // This makes it horizontal
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function (value) {
                        return value + '%';
                    }
                }
            },
            y: {
                ticks: {
                    font: {
                        size: 10 // Smaller font for better fit
                    }
                }
            }
        },
        plugins: {
            ...chartOptions.plugins,
            tooltip: {
                ...chartOptions.plugins.tooltip,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        const score = context.parsed.x; // For horizontal charts, x is the value
                        return `Average ESG Score: ${score}%`;
                    }
                }
            }
        }
    };

    // Enhanced options for business size chart with custom tooltips
    const businessSizeChartOptions = {
        ...barChartOptions,
        plugins: {
            ...barChartOptions.plugins,
            tooltip: {
                ...barChartOptions.plugins.tooltip,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        const score = context.parsed.y;
                        return `Average ESG Score: ${score}%`;
                    }
                }
            }
        }
    };

    // Enhanced options for industry category chart with custom tooltips
    const industryCategoryChartOptions = {
        ...barChartOptions,
        plugins: {
            ...barChartOptions.plugins,
            tooltip: {
                ...barChartOptions.plugins.tooltip,
                callbacks: {
                    title: function (context) {
                        return context[0].label;
                    },
                    label: function (context) {
                        const score = context.parsed.y;
                        return `Average ESG Score: ${score}%`;
                    },
                    afterLabel: function (context) {
                        // This would need access to the original data structure
                        // For now, we'll keep it simple
                        return '';
                    }
                }
            }
        }
    };

    const downloadReport = async () => {
        document.getElementById('showMoreGraphs').click();
        setIsGeneratingPDF(true);
        try {
            const element = dashboardRef.current || document.querySelector('.dashboard-content');
            if (!element) {
                console.error('Dashboard content element not found');
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
                pdf.text('ESG Dashboard Report', pageWidth / 2, 12, { align: 'center' });
                pdf.setFontSize(11);
                pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`, pageWidth / 2, 18, { align: 'center' });
            };

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = pageWidth - marginX * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = headerHeight;

            addHeader();
            pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + headerHeight;
                pdf.addPage();
                addHeader();
                pdf.addImage(imgData, 'PNG', marginX, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `ESG_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const downloadPNG = async () => {
        document.getElementById('showMoreGraphs').click();
        setIsGeneratingPNG(true);
        try {
            const element = dashboardRef.current || document.querySelector('.dashboard-content');
            if (!element) {
                console.error('Dashboard content element not found');
                return;
            }

            // Wait for dynamic content (charts/fonts) to settle in the live DOM
            await new Promise(resolve => setTimeout(resolve, 800));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: element.scrollWidth,
                height: element.scrollHeight
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `ESG_Dashboard_Report_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error generating PNG:', error);
        } finally {
            setIsGeneratingPNG(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Dashboard" breadcrumb={[["Dashboard", "/dashboard"], "Dashboard"]} />
                <div className="loading-container text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Dashboard" breadcrumb={[["Dashboard", "/dashboard"], "Dashboard"]} />
            <div className="dashboard-content" ref={dashboardRef}>
                {/* Overall ESG Performance Metrics */}
                <div className="row">
                    <div className="col-12">
                        <div className="">
                            <div className="d-flex justify-content-end align-items-center">
                                <div className="" role="group">
                                    <button
                                        className="btn btn-outline-primary btn-sm d-none"
                                        onClick={downloadReport}
                                        disabled={isGeneratingPDF || isGeneratingPNG}
                                    >
                                        <i className="fas fa-file-pdf me-1"></i>
                                        {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
                                    </button>
                                    <button
                                        className="btn btn-outline-primary active btn-sm mb-3"
                                        onClick={downloadPNG}
                                        disabled={isGeneratingPDF || isGeneratingPNG}
                                    >
                                        <i className="fas fa-image me-1"></i>
                                        {isGeneratingPNG ? 'Generating Report...' : 'Download Report'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="row">
                    <div className="col-lg-3 col-md-6 mb-3">
                        <label className="form-label">Filter by Sector [Sektor]</label>
                        <select
                            className="form-select"
                            value={selectedSector}
                            onChange={(e) => setSelectedSector(e.target.value)}
                        >
                            <option value="">All Sectors</option>
                            {getUniqueSectors.map((sector, index) => (
                                <option key={index} value={sector}>
                                    {sector}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-3">
                        <label className="form-label">Filter by Size</label>
                        <select
                            className="form-select"
                            value={selectedSize}
                            onChange={(e) => setSelectedSize(e.target.value)}
                        >
                            <option value="">All Sizes</option>
                            {getUniqueSizes.map((size, index) => (
                                <option key={index} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-3">
                        <label className="form-label">Filter by Industry</label>
                        <select
                            className="form-select"
                            value={selectedIndustry}
                            onChange={(e) => setSelectedIndustry(e.target.value)}
                        >
                            <option value="">All Industries</option>
                            {getUniqueIndustries.map((industry, index) => (
                                <option key={index} value={industry}>
                                    {industry}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-3">
                        <label className="form-label">Filter by Location [Lokasi]</label>
                        <select
                            className="form-select"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                        >
                            <option value="">All Locations</option>
                            {getUniqueLocations.map((location, index) => (
                                <option key={index} value={location}>
                                    {location}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="row">
                    <div className="col-lg-3 col-md-6 mb-3">
                        <label className="form-label">Filter by Year</label>
                        <select
                            className="form-select"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">All Years</option>
                            {getUniqueYears.map((year, index) => (
                                <option key={index} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-3 d-flex align-items-end">
                        {(selectedSector || selectedSize || selectedIndustry || selectedLocation || selectedYear) && (
                            <button
                                className="btn btn-light w-100"
                                onClick={() => {
                                    setSelectedSector('');
                                    setSelectedSize('');
                                    setSelectedIndustry('');
                                    setSelectedLocation('');
                                    setSelectedYear('');
                                }}
                            >
                                <i className="fas fa-times me-1"></i>
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="row">
                    <div className="col-lg-4 col-md-6 mb-3">
                        <div className="esg-summary-card pt-3">
                            <div className="stat-icon">
                                <i className="fas fa-building"></i>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{overallMetrics.firmsWithAssessments}</h3>
                                <p className="stat-label">Cumulative Firms</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-3">
                        <div className="esg-summary-card pt-3">
                            <div className="stat-icon">
                                <i className="fas fa-clipboard-list"></i>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{overallMetrics.totalAssessments}</h3>
                                <p className="stat-label">Cumulative Total Assessments</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4 col-md-6 mb-3">
                        <div className="esg-summary-card pt-3">
                            <div className="stat-icon">
                                <i className="fas fa-trophy"></i>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-number">{typeof overallMetrics.averageESGScore === 'number' ? overallMetrics.averageESGScore.toFixed(2) : '0.00'}%</h3>
                                <p className="stat-label">Average ESG Score</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ESG Category Breakdown */}
                <div className="row">
                    <div className="col-lg-4 col-md-6 mb-3">
                        <div className="esg-summary-card environment">
                            <div className="esg-summary-icon">
                                <i className="fas fa-leaf"></i>
                            </div>
                            <div className="esg-summary-content">
                                <h5 className="esg-summary-title">Environment</h5>
                                <h3 className="esg-summary-score">{typeof overallMetrics.environmentAverage === 'number' ? overallMetrics.environmentAverage.toFixed(2) : '0.00'}%</h3>
                                <p className="esg-summary-label">Average Score</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-3">
                        <div className="esg-summary-card social">
                            <div className="esg-summary-icon">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="esg-summary-content">
                                <h5 className="esg-summary-title">Social</h5>
                                <h3 className="esg-summary-score">{typeof overallMetrics.socialAverage === 'number' ? overallMetrics.socialAverage.toFixed(2) : '0.00'}%</h3>
                                <p className="esg-summary-label">Average Score</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6 mb-3">
                        <div className="esg-summary-card governance">
                            <div className="esg-summary-icon">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <div className="esg-summary-content">
                                <h5 className="esg-summary-title">Governance</h5>
                                <h3 className="esg-summary-score">{typeof overallMetrics.governanceAverage === 'number' ? overallMetrics.governanceAverage.toFixed(2) : '0.00'}%</h3>
                                <p className="esg-summary-label">Average Score</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Raw Calculation Data Section */}
                <div className="row d-none">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="">
                                    <i className="fas fa-calculator me-1"></i>
                                    Raw Calculation Process
                                </h5>
                                <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setShowCalculationData(!showCalculationData)}
                                >
                                    {showCalculationData ? (
                                        <>
                                            <i className="fas fa-eye-slash me-1"></i>
                                            Hide Details
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-eye me-1"></i>
                                            Show Details
                                        </>
                                    )}
                                </button>
                            </div>
                            {showCalculationData && (
                                <div className="card-body">
                                    {/* Summary Statistics */}
                                    <div className="row">
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center">
                                                <h6 className="text-muted mb-2">Total Firms</h6>
                                                <h4 className="">{calculationBreakdown.firms.length}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center">
                                                <h6 className="text-muted mb-2">Total Assessments</h6>
                                                <h4 className="">{calculationBreakdown.totalAssessments}</h4>
                                                <small className="text-muted">(Latest per year per firm)</small>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center">
                                                <h6 className="text-muted mb-2">Overall Score Count</h6>
                                                <h4 className="">{calculationBreakdown.scoreTotals.overall.count}</h4>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="border rounded p-3 text-center">
                                                <h6 className="text-muted mb-2">Average Calculation</h6>
                                                <h4 className="">
                                                    {calculationBreakdown.scoreTotals.overall.count > 0
                                                        ? (calculationBreakdown.scoreTotals.overall.sum / calculationBreakdown.scoreTotals.overall.count).toFixed(2)
                                                        : '0.00'}%
                                                </h4>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Breakdown */}
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6 className="mb-3">Score Calculation Breakdown</h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Category</th>
                                                            <th>Sum</th>
                                                            <th>Count</th>
                                                            <th>Average</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td><strong>Overall ESG</strong></td>
                                                            <td><strong>{calculationBreakdown.scoreTotals.overall.sum.toFixed(2)}</strong></td>
                                                            <td>{calculationBreakdown.scoreTotals.overall.count}</td>
                                                            <td>
                                                                <strong>
                                                                    {calculationBreakdown.scoreTotals.overall.count > 0
                                                                        ? (calculationBreakdown.scoreTotals.overall.sum / calculationBreakdown.scoreTotals.overall.count).toFixed(2)
                                                                        : '0.00'}%
                                                                </strong>
                                                            </td>
                                                        </tr>
                                                        <tr className="table-info">
                                                            <td><strong>Total Sum (for Excel verification)</strong></td>
                                                            <td><strong>{calculationBreakdown.scoreTotals.overall.roundedSum.toFixed(2)}</strong></td>
                                                            <td colSpan="2" className="text-muted">
                                                                <small>This should match the sum in Excel when you filter by "Show only latest assessments" (each score rounded to 2 decimals before summing)</small>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Environment</td>
                                                            <td>{calculationBreakdown.scoreTotals.environment.sum.toFixed(2)}</td>
                                                            <td>{calculationBreakdown.scoreTotals.environment.count}</td>
                                                            <td>
                                                                {calculationBreakdown.scoreTotals.environment.count > 0
                                                                    ? (calculationBreakdown.scoreTotals.environment.sum / calculationBreakdown.scoreTotals.environment.count).toFixed(2)
                                                                    : '0.00'}%
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Social</td>
                                                            <td>{calculationBreakdown.scoreTotals.social.sum.toFixed(2)}</td>
                                                            <td>{calculationBreakdown.scoreTotals.social.count}</td>
                                                            <td>
                                                                {calculationBreakdown.scoreTotals.social.count > 0
                                                                    ? (calculationBreakdown.scoreTotals.social.sum / calculationBreakdown.scoreTotals.social.count).toFixed(2)
                                                                    : '0.00'}%
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>Governance</td>
                                                            <td>{calculationBreakdown.scoreTotals.governance.sum.toFixed(2)}</td>
                                                            <td>{calculationBreakdown.scoreTotals.governance.count}</td>
                                                            <td>
                                                                {calculationBreakdown.scoreTotals.governance.count > 0
                                                                    ? (calculationBreakdown.scoreTotals.governance.sum / calculationBreakdown.scoreTotals.governance.count).toFixed(2)
                                                                    : '0.00'}%
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <h6 className="mb-3">Score Distribution</h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Category</th>
                                                            <th>Min</th>
                                                            <th>Max</th>
                                                            <th>Median</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>Overall ESG</td>
                                                            <td>
                                                                {calculationBreakdown.scoreTotals.overall.scores.length > 0
                                                                    ? Math.min(...calculationBreakdown.scoreTotals.overall.scores).toFixed(2)
                                                                    : 'N/A'}%
                                                            </td>
                                                            <td>
                                                                {calculationBreakdown.scoreTotals.overall.scores.length > 0
                                                                    ? Math.max(...calculationBreakdown.scoreTotals.overall.scores).toFixed(2)
                                                                    : 'N/A'}%
                                                            </td>
                                                            <td>
                                                                {calculationBreakdown.scoreTotals.overall.scores.length > 0
                                                                    ? (() => {
                                                                        const sorted = [...calculationBreakdown.scoreTotals.overall.scores].sort((a, b) => a - b);
                                                                        const mid = Math.floor(sorted.length / 2);
                                                                        return sorted.length % 2 !== 0
                                                                            ? sorted[mid].toFixed(2)
                                                                            : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
                                                                    })()
                                                                    : 'N/A'}%
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assessment Details Table */}
                                    <div className="mb-4">
                                        <h6 className="mb-3">Assessments Included in Calculation (Latest per Year per Firm)</h6>
                                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <table className="table table-sm table-bordered table-striped">
                                                <thead className="table-dark sticky-top">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Firm Name</th>
                                                        <th>Year</th>
                                                        <th>Is Latest</th>
                                                        <th>Submitted At</th>
                                                        <th>Overall</th>
                                                        <th>Environment</th>
                                                        <th>Social</th>
                                                        <th>Governance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {calculationBreakdown.assessmentDetails.map((assessment, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{assessment.firmName}</td>
                                                            <td>{assessment.year}</td>
                                                            <td>
                                                                {assessment.isSelected ? (
                                                                    <span className="badge bg-success">Yes</span>
                                                                ) : (
                                                                    <span className="badge bg-secondary">No</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {assessment.submittedAt !== 'N/A'
                                                                    ? new Date(assessment.submittedAt).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </td>
                                                            <td>{assessment.overall !== null ? `${assessment.overall}%` : 'N/A'}</td>
                                                            <td>{assessment.environment !== null ? `${assessment.environment}%` : 'N/A'}</td>
                                                            <td>{assessment.social !== null ? `${assessment.social}%` : 'N/A'}</td>
                                                            <td>{assessment.governance !== null ? `${assessment.governance}%` : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Firm Breakdown */}
                                    <div>
                                        <h6 className="mb-3">Breakdown by Firm</h6>
                                        <div className="accordion" id="firmBreakdownAccordion">
                                            {calculationBreakdown.firms.map((firm, firmIndex) => (
                                                <div className="accordion-item" key={firmIndex}>
                                                    <h2 className="accordion-header" id={`heading${firmIndex}`}>
                                                        <button
                                                            className="accordion-button collapsed"
                                                            type="button"
                                                            data-bs-toggle="collapse"
                                                            data-bs-target={`#collapse${firmIndex}`}
                                                            aria-expanded="false"
                                                            aria-controls={`collapse${firmIndex}`}
                                                        >
                                                            {firm.firmName} ({firm.assessments.length} assessment{firm.assessments.length !== 1 ? 's' : ''})
                                                        </button>
                                                    </h2>
                                                    <div
                                                        id={`collapse${firmIndex}`}
                                                        className="accordion-collapse collapse"
                                                        aria-labelledby={`heading${firmIndex}`}
                                                        data-bs-parent="#firmBreakdownAccordion"
                                                    >
                                                        <div className="accordion-body">
                                                            <table className="table table-sm table-bordered">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Year</th>
                                                                        <th>Is Latest</th>
                                                                        <th>Overall</th>
                                                                        <th>Environment</th>
                                                                        <th>Social</th>
                                                                        <th>Governance</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {firm.assessments.map((assessment, assIndex) => (
                                                                        <tr key={assIndex}>
                                                                            <td>{assessment.year}</td>
                                                                            <td>
                                                                                {assessment.isSelected ? (
                                                                                    <span className="badge bg-success">Yes</span>
                                                                                ) : (
                                                                                    <span className="badge bg-secondary">No</span>
                                                                                )}
                                                                            </td>
                                                                            <td>{assessment.overall !== null ? `${assessment.overall}%` : 'N/A'}</td>
                                                                            <td>{assessment.environment !== null ? `${assessment.environment}%` : 'N/A'}</td>
                                                                            <td>{assessment.social !== null ? `${assessment.social}%` : 'N/A'}</td>
                                                                            <td>{assessment.governance !== null ? `${assessment.governance}%` : 'N/A'}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="row">
                    <div className="col-lg-6">
                        <div className="chart-section">
                            <div className="chart-header">
                                <h4 className="section-title">
                                    <i className="fas fa-chart-bar me-1"></i>
                                    ESG Category Performance
                                </h4>
                            </div>
                            <div className="chart-container" style={{ height: '300px' }}>
                                <Bar data={esgCategoryData} options={barChartOptions} />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="chart-section">
                            <div className="chart-header">
                                <h4 className="section-title">
                                    <i className="fas fa-chart-pie me-1"></i>
                                    ESG Score Distribution by Firms
                                </h4>
                            </div>
                            <div className="chart-container" style={{ height: '300px' }}>
                                <Doughnut data={esgDistributionData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="accordion accordion-flush mb-4" id="accordionFlushExample">
                    <div className="accordion-item">
                        <h2 className="accordion-header" id="flush-headingOne">
                            <button id="showMoreGraphs" className="accordion-button collapsed d-flex justify-content-end" type="button" data-bs-toggle="collapse"
                                data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                                Show More...
                            </button>
                        </h2>
                        <div id="flush-collapseOne" className="accordion-collapse collapse pt-4" aria-labelledby="flush-headingOne"
                            data-bs-parent="#accordionFlushExample">
                            {/* Additional Charts Section */}
                            <div className="row">
                                <div className="col-lg-6 mb-4">
                                    <div className="chart-section">
                                        <div className="chart-header">
                                            <h4 className="section-title">
                                                <i className="fas fa-building me-1"></i>
                                                ESG Score by Business Size
                                            </h4>
                                        </div>
                                        <div className="chart-container" style={{ height: '300px' }}>
                                            <Bar data={esgByBusinessSizeData} options={businessSizeChartOptions} />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-6 mb-4">
                                    <div className="chart-section">
                                        <div className="chart-header">
                                            <h4 className="section-title">
                                                <i className="fas fa-chart-bar me-1"></i>
                                                ESG Score by Industry
                                            </h4>
                                        </div>
                                        <div className="chart-container" style={{ height: '300px' }}>
                                            <Bar data={esgByIndustryCategoryData} options={industryCategoryChartOptions} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* New Charts: Sector and State */}
                            <div className="row">
                                <div className="col-lg-6 mb-4">
                                    <div className="chart-section">
                                        <div className="chart-header">
                                            <h4 className="section-title">
                                                <i className="fas fa-briefcase me-1"></i>
                                                ESG Score by Sector
                                            </h4>
                                        </div>
                                        <div className="chart-container" style={{ height: '400px' }}>
                                            <Bar data={esgBySectorData} options={industryChartOptions} />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-6 mb-4">
                                    <div className="chart-section">
                                        <div className="chart-header">
                                            <h4 className="section-title">
                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                ESG Score by State
                                            </h4>
                                        </div>
                                        <div className="chart-container" style={{ height: '400px' }}>
                                            <Bar data={esgByStateData} options={industryChartOptions} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Industry Category Chart Section */}
                            <div className="row">
                                <div className="col-lg-12 mb-4">
                                    <div className="chart-section">
                                        <div className="chart-header">
                                            <h4 className="section-title">
                                                <i className="fas fa-industry me-1"></i>
                                                ESG Score by Industry (Detailed)
                                            </h4>
                                        </div>
                                        <div className="chart-container" style={{ height: '400px' }}>
                                            <Bar data={esgByIndustryData} options={industryChartOptions} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



                {/* Firm Performance Cards */}
                <div className="row">
                    <div className="col-12">
                        <div className="chart-section">
                            <div className="chart-header m-0">
                                <h4 className="section-title">
                                    <i className="fas fa-building me-1"></i>
                                    Firm ESG Performance Overview
                                </h4>
                            </div>
                            <div className="row">
                                {filteredUsers.slice(0, 3).map((user) => {
                                    const metrics = userMetrics[user.id] || {
                                        totalAssessments: 0,
                                        latestYear: 'N/A',
                                        overallScore: 0,
                                        envScore: 0,
                                        socialScore: 0,
                                        govScore: 0
                                    };

                                    const getStatusBadge = (score) => {
                                        const numScore = parseFloat(score);
                                        if (isNaN(numScore)) return 'badge bg-secondary';
                                        if (numScore === 0) return 'badge bg-dark';
                                        if (numScore <= 30) return 'badge bg-danger';
                                        if (numScore <= 50) return 'badge bg-warning';
                                        if (numScore <= 80) return 'badge bg-info';
                                        return 'badge bg-success';
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

                                    const getProgressBarColor = (score) => {
                                        const numScore = parseFloat(score);
                                        if (isNaN(numScore)) return 'bg-secondary';
                                        if (numScore === 0) return 'bg-dark';
                                        if (numScore <= 30) return 'bg-danger';
                                        if (numScore <= 50) return 'bg-warning';
                                        if (numScore <= 80) return 'bg-info';
                                        return 'bg-success';
                                    };

                                    return (
                                        <div key={user.id} className="col-lg-4 col-md-6 mb-4">
                                            <div className="firm-performance-card border">
                                                <div className="firm-card-header">
                                                    <div className="firm-info">
                                                        <h5 className="firm-name text-dark">
                                                            {user.firm}
                                                        </h5>
                                                        <p className="firm-email text-dark">{user.email}</p>
                                                        <div className="firm-details mt-2">
                                                            {user.sector && (
                                                                <small className="text-muted me-1">
                                                                    <i className="fas fa-industry me-1"></i>
                                                                    {user.sector}
                                                                </small>
                                                            )}
                                                            {user.business_size && (
                                                                <small className="text-muted me-1">
                                                                    <i className="fas fa-ruler me-1"></i>
                                                                    {user.business_size}
                                                                </small>
                                                            )}
                                                            {user.industry && (
                                                                <small className="text-muted me-1 d-block mt-1">
                                                                    <i className="fas fa-building me-1"></i>
                                                                    {user.industry}
                                                                </small>
                                                            )}
                                                            {(user.location || user.address?.location) && (
                                                                <small className="text-muted me-1 d-block mt-1">
                                                                    <i className="fas fa-map-marker-alt me-1"></i>
                                                                    {user.location || user.address?.location}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="firm-status">
                                                        <span className={getStatusBadge(metrics.overallScore)}>
                                                            {getStatusText(metrics.overallScore)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="firm-card-body">
                                                    {/* Overall Score */}
                                                    <div className="score-section">
                                                        <div className="score-header">
                                                            <span className="score-label">Overall ESG Score</span>
                                                            <span className={`score-value ${getScoreColor(metrics.overallScore)}`}>
                                                                {metrics.overallScore}%
                                                            </span>
                                                        </div>
                                                        <div className="progress mb-3">
                                                            <div
                                                                className={`progress-bar ${getProgressBarColor(metrics.overallScore)}`}
                                                                style={{ width: `${metrics.overallScore}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {/* ESG Breakdown */}
                                                    <div className="esg-breakdown">
                                                        <div className="esg-item">
                                                            <div className="">
                                                                <i className="fas fa-leaf text-success me-1"></i>
                                                                Environment
                                                            </div>
                                                            <div className={`esg-score ${getScoreColor(metrics.envScore)}`}>
                                                                {metrics.envScore}%
                                                            </div>
                                                        </div>
                                                        <div className="esg-item">
                                                            <div className="">
                                                                <i className="fas fa-users text-primary me-1"></i>
                                                                Social
                                                            </div>
                                                            <div className={`esg-score ${getScoreColor(metrics.socialScore)}`}>
                                                                {metrics.socialScore}%
                                                            </div>
                                                        </div>
                                                        <div className="esg-item">
                                                            <div className="">
                                                                <i className="fas fa-shield-alt text-purple me-1"></i>
                                                                Governance
                                                            </div>
                                                            <div className={`esg-score ${getScoreColor(metrics.govScore)}`}>
                                                                {metrics.govScore}%
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Assessment Info */}
                                                    <div className="assessment-info">
                                                        <div className="info-item">
                                                            <i className="fas fa-clipboard-list me-1"></i>
                                                            <span>{metrics.totalAssessments} Assessment{metrics.totalAssessments !== 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div className="info-item">
                                                            <i className="fas fa-calendar-alt me-1"></i>
                                                            <span>Latest: {metrics.latestYear}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* View More Link */}
                            {filteredUsers.length > 3 && (
                                <div className="text-center mt-3">
                                    <a
                                        href="/admin/firm-comparison"
                                        className="btn btn-outline-primary btn-sm"
                                    >
                                        <i className="fas fa-eye me-1"></i>
                                        View More Firms ({filteredUsers.length - 3} more)
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Individual Firm Assessments */}
                <div className="row  d-none">
                    <div className="col-12">
                        <div className="dashboard-header border rounded p-3 mb-4">
                            <h2 className="dashboard-title ">
                                <i className="fas fa-building me-1"></i>
                                Individual Firm Assessments
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="accordion accordion-flush d-none" id="accordionFlushExample">
                    {filteredUsers.map((user) => {
                        const metrics = userMetrics[user.id] || {
                            totalAssessments: 0,
                            latestYear: 'N/A'
                        };

                        return (
                            <div className="accordion-item" key={user.id}>
                                <h2 className="accordion-header" id={`flush-heading-${user.id}`}>
                                    <button
                                        className="accordion-button collapsed"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#flush-collapse-${user.id}`}
                                        aria-expanded="false"
                                        aria-controls={`flush-collapse-${user.id}`}
                                    >
                                        <span className="me-1"></span>
                                        <span className="text-primary fw-bold">
                                            <i className="fas fa-building me-1"></i> {user.firm}
                                            {metrics.latestYear !== 'N/A' ? (
                                                <span className="ms-2 text-muted">
                                                    <i className="fas fa-calendar-alt me-1"></i>
                                                    Latest: {metrics.latestYear} ({metrics.totalAssessments} assessment{metrics.totalAssessments !== 1 ? 's' : ''})
                                                </span>
                                            ) : (
                                                <span className="ms-2 text-muted fst-italic">
                                                    <i className="fas fa-exclamation-circle me-1"></i>
                                                    No Assessments
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                </h2>
                                <div
                                    id={`flush-collapse-${user.id}`}
                                    className="accordion-collapse collapse p-0"
                                    aria-labelledby={`flush-heading-${user.id}`}
                                    data-bs-parent="#accordionFlushExample"
                                >
                                    <div className="accordion-body p-0">
                                        <Assesments
                                            key={user.id}
                                            userId={user.id}
                                            userDetails={user}
                                            onDataUpdate={(data) => handleAssessmentData(user.id, data)}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}

export default DashboardContent;