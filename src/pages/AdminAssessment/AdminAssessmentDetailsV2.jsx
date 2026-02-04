import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import ESGScoreChart from '../UserAssessment/ESGScoreChart';
import ESGCharts from '../UserAssessment/ESGCharts';
import '../UserAssessment/AssessmentDetails.css';
import api from '../../utils/api';
import { getScoreColor, getScoreBadge } from '../../utils/scoreUtils';

// Helper functions for dual language support
const normalizeText = (text) => {
    if (!text) return { en: '', ms: '' };
    if (typeof text === 'string') return { en: text, ms: text };
    if (typeof text === 'object') {
        return {
            en: text.en || text.ms || '',
            ms: text.ms || text.en || ''
        };
    }
    return { en: '', ms: '' };
};

const getTextDisplay = (text, lang = 'en') => {
    const normalized = normalizeText(text);
    return normalized[lang] || normalized.en || '';
};

function AdminAssessmentDetailsV2() {
    const { userId, year } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [assessmentResponses, setAssessmentResponses] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('agolix-summary');
    const [activeCategory, setActiveCategory] = useState('');
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const agolixRef = useRef(null);
    const [language, setLanguage] = useState('en'); // 'en' or 'ms'

    useEffect(() => {
        // Fetch user information
        if (userId) {
            api.get('/management/users')
                .then(res => {
                    const data = res.data;
                    // Find the specific user by ID
                    const users = data.users || [];
                    const user = users.find(u => u.id === userId);
                    setUserInfo(user || null);
                })
                .catch(err => {
                    console.error('Error fetching user info:', err);
                });
        }

        // Fetch assessment details for V2
        api.get(`/assessment/user/v2/get-responses-2?user_id=${userId}&selected_only=true&assessment_year=${year}`)
            .then(res => {
                const data = res.data;
                if (data && data.length > 0) {
                    const assessmentData = data[0];

                    console.log('Admin Assessment data:', assessmentData);

                    setAssessment(assessmentData);

                    // Handle different possible response data structures
                    let responses = [];

                    if (assessmentData?.responses && Array.isArray(assessmentData.responses)) {
                        responses = assessmentData.responses;
                    } else if (assessmentData?.assessment_responses && Array.isArray(assessmentData.assessment_responses)) {
                        responses = assessmentData.assessment_responses;
                    } else if (assessmentData?.years && Array.isArray(assessmentData.years) && assessmentData.years.length > 0) {

                        // Check if the year data contains responses
                        const yearData = assessmentData.years.find(y => {
                            const yearMatch = y.year === year ||
                                y.assessment_year === year ||
                                y.year === parseInt(year) ||
                                y.assessment_year === parseInt(year) ||
                                y.year === year.toString() ||
                                y.assessment_year === year.toString();
                            return yearMatch;
                        });
                        if (yearData) {
                            if (yearData.responses && Array.isArray(yearData.responses)) {
                                responses = yearData.responses;
                            } else if (yearData.assessment_responses && Array.isArray(yearData.assessment_responses)) {
                                responses = yearData.assessment_responses;
                            } else if (yearData.questions && Array.isArray(yearData.questions)) {
                                responses = yearData.questions;
                            } else if (yearData.data && Array.isArray(yearData.data)) {

                                // Check if the data item contains a responses array
                                if (yearData.data[0] && yearData.data[0].responses && Array.isArray(yearData.data[0].responses)) {
                                    responses = yearData.data[0].responses;
                                } else {
                                    responses = yearData.data;
                                }
                            }
                        } else {
                            const firstYearData = assessmentData.years[0];

                            if (firstYearData) {
                                if (firstYearData.responses && Array.isArray(firstYearData.responses)) {
                                    responses = firstYearData.responses;
                                } else if (firstYearData.assessment_responses && Array.isArray(firstYearData.assessment_responses)) {
                                    responses = firstYearData.assessment_responses;
                                } else if (firstYearData.questions && Array.isArray(firstYearData.questions)) {
                                    responses = firstYearData.questions;
                                } else if (firstYearData.data && Array.isArray(firstYearData.data)) {

                                    // Check if the data item contains a responses array
                                    if (firstYearData.data[0] && firstYearData.data[0].responses && Array.isArray(firstYearData.data[0].responses)) {
                                        responses = firstYearData.data[0].responses;
                                    } else {
                                        responses = firstYearData.data;
                                    }
                                }
                            }
                        }
                    } else if (Array.isArray(assessmentData)) {
                        responses = assessmentData;
                    }

                    setAssessmentResponses(responses);

                    // Set initial active category
                    if (responses && responses.length > 0) {
                        const filteredForCategories = responses.filter(response => {
                            const hasQuestion = response.question;
                            const hasCategory = response.question?.category;
                            const isNotYearSelection = response.question?.category !== 'Year Selection';
                            const isValid = hasQuestion && hasCategory && isNotYearSelection;

                            return isValid;
                        });

                        const categories = [...new Set(filteredForCategories.map(response => response.question.category))];

                        if (categories.length > 0) {
                            setActiveCategory(categories[0]);
                        } else {
                            setActiveCategory('');
                        }
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching assessment:', err);
                setLoading(false);
            });
    }, [year, userId, navigate]);

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

    // Get status text based on ESG Scoring Methodology:
    // - 0%: Yet to Start
    // - 1-30%: Basic
    // - 31-50%: Developing
    // - 51-80%: Intermediate
    // - 81-100%: Advanced
    const getScoreStatus = (score) => {
        const numScore = parseFloat(score);
        if (isNaN(numScore)) return 'N/A';
        if (numScore === 0 || (numScore > 0 && numScore < 1)) return 'Yet to Start';
        if (numScore >= 1 && numScore <= 30) return 'Basic';
        if (numScore > 30 && numScore <= 50) return 'Developing';
        if (numScore > 50 && numScore <= 80) return 'Intermediate';
        if (numScore > 80 && numScore <= 100) return 'Advanced';
        return 'N/A';
    };



    // Calculate scores from responses or use pre-calculated scores
    const calculateScores = () => {
        // If we have pre-calculated scores in the assessment data, use those
        if (assessment?.score) {
            // Handle new data structure with total_score, max_score, and category_max
            if (assessment.score.total_score !== undefined && assessment.score.max_score !== undefined) {
                const preCalculatedScores = {
                    Environment: assessment.score.Environment || 0,
                    Social: assessment.score.Social || 0,
                    Governance: assessment.score.Governance || 0,
                    total_score: assessment.score.total_score,
                    max_score: assessment.score.max_score,
                    breakdown: assessment.score.breakdown || {
                        Environment: {},
                        Social: {},
                        Governance: {}
                    }
                };

                // Calculate from individual question responses if available
                if (assessmentResponses && Array.isArray(assessmentResponses)) {
                    const categories = ['Environment', 'Social', 'Governance'];

                    categories.forEach(category => {
                        const categoryResponses = assessmentResponses.filter(response =>
                            response.question && response.question.category === category &&
                            response.answer && response.answer.question_score !== undefined &&
                            response.answer.question_max !== undefined
                        );

                        if (categoryResponses.length > 0) {
                            const totalScore = categoryResponses.reduce((sum, response) => sum + (parseFloat(response.answer.question_score) || 0), 0);
                            const totalMax = categoryResponses.reduce((sum, response) => sum + (parseFloat(response.answer.question_max) || 0), 0);

                            if (totalMax > 0) {
                                preCalculatedScores[category] = Math.round((totalScore / totalMax) * 100);
                            }
                        }
                    });
                } else if (assessment.score.category_max) {
                    // Fallback: Convert raw scores to percentages
                    preCalculatedScores.Environment = Math.round((assessment.score.Environment / assessment.score.category_max.Environment) * 100);
                    preCalculatedScores.Social = Math.round((assessment.score.Social / assessment.score.category_max.Social) * 100);
                    preCalculatedScores.Governance = Math.round((assessment.score.Governance / assessment.score.category_max.Governance) * 100);
                }

                return preCalculatedScores;
            }

            // Fallback to old format
            const preCalculatedScores = {
                Environment: assessment.score.Environment || assessment.score.environment || 0,
                Social: assessment.score.Social || assessment.score.social || 0,
                Governance: assessment.score.Governance || assessment.score.governance || 0,
                total_score: assessment.score.total_score || assessment.score.overall_score || 0,
                max_score: 100,
                breakdown: assessment.score.breakdown || {
                    Environment: {},
                    Social: {},
                    Governance: {}
                }
            };

            return preCalculatedScores;
        }

        if (!assessmentResponses || !Array.isArray(assessmentResponses) || assessmentResponses.length === 0) {
            return null;
        }

        const scores = {
            Environment: 0,
            Social: 0,
            Governance: 0,
            total_score: 0,
            max_score: 0,
            breakdown: {
                Environment: {},
                Social: {},
                Governance: {}
            }
        };

        const categoryWeights = { Environment: 0, Social: 0, Governance: 0 };
        const categoryScores = { Environment: 0, Social: 0, Governance: 0 };
        const categoryBreakdowns = { Environment: {}, Social: {}, Governance: {} };

        // Filter out the year selection response and ensure response has question data
        const questionResponses = assessmentResponses.filter(response =>
            response &&
            response.question &&
            response.question.category &&
            response.question.category !== 'Year Selection'
        );

        questionResponses.forEach((response) => {
            const category = response.question.category;
            const weight = response.question.weight || 1;
            const indicator = response.question.indicator || 'General';

            if (response.answer && response.answer.selected_option_submarks) {
                const questionScore = response.answer.selected_option_submarks.reduce((sum, subMark) => sum + (subMark || 0), 0) * weight;
                categoryScores[category] += questionScore;
                categoryWeights[category] += weight;

                // Track breakdown by indicator
                if (!categoryBreakdowns[category][indicator]) {
                    categoryBreakdowns[category][indicator] = { score: 0, weight: 0 };
                }
                categoryBreakdowns[category][indicator].score += questionScore;
                categoryBreakdowns[category][indicator].weight += weight;
            }
        });

        // Calculate percentage scores for each category
        Object.keys(categoryScores).forEach(category => {
            if (categoryWeights[category] > 0) {
                scores[category] = Math.round((categoryScores[category] / categoryWeights[category]) * 100);

                // Calculate breakdown percentages
                Object.keys(categoryBreakdowns[category]).forEach(indicator => {
                    const breakdown = categoryBreakdowns[category][indicator];
                    if (breakdown.weight > 0) {
                        scores.breakdown[category][indicator] = Math.round((breakdown.score / breakdown.weight) * 100);
                    }
                });
            }
        });

        // Calculate overall score (average of category scores)
        const validCategories = Object.keys(categoryScores).filter(cat => categoryWeights[cat] > 0);

        if (validCategories.length > 0) {
            scores.total_score = Math.round(validCategories.reduce((sum, cat) => sum + scores[cat], 0) / validCategories.length);
            scores.max_score = 100;
        }

        return scores;
    };

    const getGroupedResponses = () => {
        if (!assessmentResponses || !Array.isArray(assessmentResponses)) {
            return {};
        }

        if (assessmentResponses.length === 0) {
            return {};
        }

        const filteredResponses = assessmentResponses.filter((response, index) => {
            // More flexible checking for different data structures
            const hasResponse = !!response;
            const hasQuestion = !!response?.question;
            const hasCategory = !!response?.question?.category;
            const isNotYearSelection = response?.question?.category !== 'Year Selection';

            // Also check if response might be a question itself (different data structure)
            const isQuestionWithCategory = !!response?.category && !response?.question;
            const questionCategory = response?.category || response?.question?.category;
            const isNotYearSelectionAlt = questionCategory !== 'Year Selection';

            // Check for the flat structure (your current data format)
            const isFlatStructure = !!response?.questionId && !!response?.category && !!response?.text;
            const isFlatStructureValid = isFlatStructure && response?.category !== 'Year Selection';

            const isValid = (hasResponse && hasQuestion && hasCategory && isNotYearSelection) ||
                (hasResponse && isQuestionWithCategory && isNotYearSelectionAlt) ||
                (hasResponse && isFlatStructureValid);

            return isValid;
        });

        const grouped = filteredResponses.reduce((acc, response, index) => {
            // Handle both data structures
            const category = response.question?.category || response.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({ ...response, originalIndex: index + 1 });
            return acc;
        }, {});

        return grouped;
    };

    const scores = calculateScores();
    const overallScore = scores ? (scores.total_score / 300 * 100).toFixed(2) : 0;

    // Helper function to get best performing ESG area
    const getBestPerformingArea = () => {
        if (!scores) return null;

        const areaScores = {
            Environment: scores.Environment,
            Social: scores.Social,
            Governance: scores.Governance
        };

        const bestArea = Object.entries(areaScores).reduce((best, [area, score]) => {
            return score > best.score ? { area, score } : best;
        }, { area: null, score: -1 });

        return bestArea.area ? { area: bestArea.area, score: bestArea.score } : null;
    };

    // Helper function to get worst performing ESG area
    const getWorstPerformingArea = () => {
        if (!scores) return null;

        const areaScores = {
            Environment: scores.Environment,
            Social: scores.Social,
            Governance: scores.Governance
        };

        const worstArea = Object.entries(areaScores).reduce((worst, [area, score]) => {
            return score < worst.score ? { area, score } : worst;
        }, { area: null, score: 101 });

        return worstArea.area ? { area: worstArea.area, score: worstArea.score } : null;
    };

    const bestArea = getBestPerformingArea();
    const worstArea = getWorstPerformingArea();

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
                console.error('PDF Generation Error: Could not find agolix-summary-tab element');
                alert('Error: Could not find the report content. Please ensure the Report tab is visible.');
                return;
            }

            // Wait for dynamic content (charts/fonts) to settle in the live DOM
            await new Promise(resolve => setTimeout(resolve, 800));

            // Capture all CSS from the page
            let allStyles = '';
            
            // Get all stylesheets
            Array.from(document.styleSheets).forEach(styleSheet => {
                try {
                    // Try to get CSS rules
                    if (styleSheet.cssRules) {
                        Array.from(styleSheet.cssRules).forEach(rule => {
                            try {
                                allStyles += rule.cssText + '\n';
                            } catch (e) {
                                // Skip rules that can't be accessed
                            }
                        });
                    } else if (styleSheet.href) {
                        // For external stylesheets, try to fetch
                        console.log('External stylesheet detected:', styleSheet.href);
                    }
                } catch (e) {
                    // Cross-origin stylesheets may throw errors, skip them
                    console.warn('Could not access stylesheet:', e);
                }
            });
            
            // Get computed styles for the element and its children (excluding font sizes)
            const getComputedStyles = (el) => {
                let styles = '';
                try {
                    const computed = window.getComputedStyle(el);
                    if (el.style && el.style.cssText) {
                        // Remove font-size from inline styles
                        const inlineStyles = el.style.cssText.split(';').filter(style => {
                            return !style.trim().toLowerCase().startsWith('font-size');
                        }).join(';');
                        if (inlineStyles.trim()) {
                            styles += `${el.tagName.toLowerCase()}.${Array.from(el.classList).join('.')} { ${inlineStyles} }\n`;
                        }
                    }
                    // Get important inline styles (excluding font-size)
                    const importantStyles = [];
                    if (computed.backgroundColor && computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        importantStyles.push(`background-color: ${computed.backgroundColor} !important`);
                    }
                    if (computed.color) {
                        importantStyles.push(`color: ${computed.color} !important`);
                    }
                    // Explicitly exclude font-size
                    if (importantStyles.length > 0) {
                        const selector = el.tagName.toLowerCase() + (el.className ? '.' + Array.from(el.classList).join('.') : '');
                        styles += `${selector} { ${importantStyles.join('; ')} }\n`;
                    }
                } catch (e) {
                    // Skip if can't get computed styles
                }
                return styles;
            };
            
            // Get inline styles from element
            let inlineStyles = getComputedStyles(element);
            Array.from(element.querySelectorAll('*')).forEach(child => {
                inlineStyles += getComputedStyles(child);
            });
            
            // Build complete HTML document with all CSS
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>ESG Assessment Report</title>
                    <style>
                        /* All captured stylesheets */
                        ${allStyles}
                        
                        /* Inline computed styles */
                        ${inlineStyles}
                        
                        /* Base styles */
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #ffffff !important;
                            color: #000000 !important;
                            padding: 20px;
                        }
                        .agolix-summary-tab {
                            background-color: #ffffff !important;
                            color: #000000 !important;
                        }
                        .bg-dark, .text-dark, .dark {
                            background-color: #ffffff !important;
                            color: #000000 !important;
                        }
                        .page-break-before {
                            page-break-before: always;
                        }
                        .page-break-after {
                            page-break-after: always;
                        }
                        canvas, svg {
                            max-width: 100%;
                            height: auto;
                        }
                        /* Bootstrap utility classes that might be missing */
                        .container { width: 100%; }
                        .row { display: flex; flex-wrap: wrap; }
                        .col { flex: 1; }
                        .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 15px; }
                        .card-body { padding: 15px; }
                        .card-header { padding: 10px 15px; background-color: #f8f9fa; border-bottom: 1px solid #ddd; }
                        .btn { padding: 8px 16px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
                        .table { width: 100%; border-collapse: collapse; }
                        .table th, .table td { padding: 8px; border: 1px solid #ddd; }
                        .table th { background-color: #f8f9fa; font-weight: bold; }
                        .text-center { text-align: center; }
                        .text-left { text-align: left; }
                        .text-right { text-align: right; }
                        .mb-3 { margin-bottom: 1rem; }
                        .mb-4 { margin-bottom: 1.5rem; }
                        .mt-3 { margin-top: 1rem; }
                        .mt-4 { margin-top: 1.5rem; }
                        .p-3 { padding: 1rem; }
                        .p-4 { padding: 1.5rem; }
                    </style>
                </head>
                <body>
                    ${element.outerHTML}
                </body>
                </html>
            `;

            // Send HTML to backend for PDF generation
            const response = await api.post('/assessment/admin/v2/generate-pdf-report', {
                html_content: htmlContent,
                css_content: '',
                user_id: userId,
                assessment_year: parseInt(year),
                filename: `ESG_Assessment_Report_${(userInfo?.firm || userInfo?.firm_name || 'Company')?.replace(/[^a-zA-Z0-9]/g, '_')}_${year}_${new Date().toISOString().split('T')[0]}.pdf`
            }, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ESG_Assessment_Report_${(userInfo?.firm || userInfo?.firm_name || 'Company')?.replace(/[^a-zA-Z0-9]/g, '_')}_${year}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            // OLD FRONTEND PDF GENERATION CODE REMOVED - Now using backend
            const pageHeight = 295; // A4 height in mm
            const marginX = 10; // side margins
            const headerHeight = 20; // space for header text

            // Function to add header to each page
            const addHeader = () => {
                pdf.setFontSize(16);
                pdf.text('ESG Assessment Report', pageWidth / 2, 12, { align: 'center' });
                pdf.setFontSize(11);
                pdf.text(`${userInfo?.firm || userInfo?.firm_name || 'Company Name'} - ${year} Assessment`, pageWidth / 2, 18, { align: 'center' });
            };

            // Helper function to force light mode in cloned document and preserve font sizes
            const forceLightMode = (clonedDoc) => {
                try {
                    // Remove dark mode attributes from html element
                    const clonedHtml = clonedDoc.documentElement;
                    if (clonedHtml) {
                        clonedHtml.removeAttribute('data-bs-theme');
                        clonedHtml.removeAttribute('data-menu-color');
                        clonedHtml.removeAttribute('data-topbar-color');
                        clonedHtml.classList.remove('dark');
                        // Ensure base font size is preserved
                        clonedHtml.style.fontSize = '16px';
                    }
                    
                    // Force light background on body
                    const clonedBody = clonedDoc.body;
                    if (clonedBody) {
                        clonedBody.style.backgroundColor = '#ffffff';
                        clonedBody.style.color = '#000000';
                        clonedBody.classList.remove('dark');
                        // Ensure body font size is preserved
                        clonedBody.style.fontSize = '16px';
                    }

                    // Force light backgrounds on all elements within the target
                    const targetElement = clonedDoc.querySelector('.agolix-summary-tab') || clonedBody;
                    if (targetElement) {
                        // Remove dark mode classes
                        targetElement.classList.remove('dark', 'bg-dark', 'text-dark');
                        targetElement.style.backgroundColor = '#ffffff';
                        targetElement.style.color = '#000000';
                        // Ensure minimum font size
                        if (!targetElement.style.fontSize) {
                            targetElement.style.fontSize = '16px';
                        }
                        
                        // Force white background on all child elements and preserve font sizes
                        try {
                            const allElements = targetElement.querySelectorAll('*');
                            allElements.forEach(el => {
                                try {
                                    // Remove dark mode classes
                                    el.classList.remove('dark', 'bg-dark', 'text-dark', 'bg-secondary', 'text-white', 'bg-black');
                                    
                                    // Preserve font sizes for text elements - ensure they don't shrink
                                    if (el.tagName === 'P' || el.tagName === 'SPAN' || el.tagName === 'DIV' || 
                                        el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || 
                                        el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6' ||
                                        el.tagName === 'LI' || el.tagName === 'TD' || el.tagName === 'TH' ||
                                        el.tagName === 'LABEL' || el.tagName === 'STRONG' || el.tagName === 'B') {
                                        // If element has a very small font size, increase it
                                        const currentFontSize = el.style.fontSize;
                                        if (!currentFontSize || parseFloat(currentFontSize) < 12) {
                                            // Set minimum readable font size
                                            el.style.fontSize = '14px';
                                        }
                                    }
                                    
                                    // Check if element has inline dark background styles
                                    const bgColor = el.style.backgroundColor;
                                    if (bgColor && (bgColor.includes('rgb(0') || bgColor.includes('rgb(33') || bgColor.includes('#000') || bgColor.includes('#1'))) {
                                        el.style.backgroundColor = '#ffffff';
                                        el.style.color = '#000000';
                                    }
                                    
                                    // Force light colors for common dark classes
                                    if (el.classList.contains('card') || el.classList.contains('bg-light') || el.classList.contains('bg-white')) {
                                        el.style.backgroundColor = '#ffffff';
                                        el.style.color = '#000000';
                                    }
                                } catch (e) {
                                    // Skip elements that cause errors
                                    console.warn('Error processing element in forceLightMode:', e);
                                }
                            });
                        } catch (e) {
                            console.warn('Error querying elements in forceLightMode:', e);
                        }
                    }
                } catch (e) {
                    console.warn('Error in forceLightMode:', e);
                }
            };

            // Find page break elements
            const pageBreakElements = element.querySelectorAll('.page-break-before');
            const imgWidth = pageWidth - marginX * 2; // Define imgWidth once for all branches

            if (pageBreakElements.length === 0) {
                // No page breaks found, use original method
                const canvas = await html2canvas(element, {
                    scale: 3, // Increased from 2 to 3 for better text quality
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: true,
                    onclone: forceLightMode
                }); 

                const imgData = canvas.toDataURL('image/png');
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
            } else {
                // Split content at page breaks
                const firstBreak = pageBreakElements[0];
                if (!firstBreak) {
                    console.error('PDF Generation Error: First page break element not found');
                    return;
                }

                // Process content before first page break (everything up to but not including the page break element)
                const contentBeforeFirstBreak = element.cloneNode(true);
                
                // Get the original width to preserve it
                const originalWidth = element.offsetWidth || element.clientWidth || 800;
                
                // Temporarily append to body so html2canvas can process it
                contentBeforeFirstBreak.style.position = 'absolute';
                contentBeforeFirstBreak.style.left = '-9999px';
                contentBeforeFirstBreak.style.top = '0';
                contentBeforeFirstBreak.style.width = `${originalWidth}px`; // Preserve original width
                contentBeforeFirstBreak.style.minWidth = `${originalWidth}px`; // Ensure minimum width
                document.body.appendChild(contentBeforeFirstBreak);

                try {
                    // Find and remove the page break element and everything after it
                    const firstBreakInClone = contentBeforeFirstBreak.querySelector('.page-break-before');
                    if (firstBreakInClone) {
                        // Get the parent container
                        const parent = firstBreakInClone.parentElement;
                        if (parent) {
                            // Find all elements after the page break (including the break itself)
                            let currentElement = firstBreakInClone;
                            const elementsToRemove = [];
                            
                            // Collect all siblings after the break element
                            while (currentElement) {
                                elementsToRemove.push(currentElement);
                                currentElement = currentElement.nextElementSibling;
                            }
                            
                            // Remove all collected elements
                            elementsToRemove.forEach(el => el.remove());
                        } else {
                            // If no parent, just remove the break element and its next siblings
                            let nextSibling = firstBreakInClone.nextSibling;
                            while (nextSibling) {
                                const toRemove = nextSibling;
                                nextSibling = nextSibling.nextSibling;
                                toRemove.remove();
                            }
                            firstBreakInClone.remove();
                        }
                    }

                    // Capture first section
                    const canvas1 = await html2canvas(contentBeforeFirstBreak, {
                        scale: 3, // Increased from 2 to 3 for better text quality
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        onclone: forceLightMode,
                        removeContainer: false
                    });

                    const imgData1 = canvas1.toDataURL('image/png');
                    const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;
                    let heightLeft1 = imgHeight1;
                    let position1 = headerHeight;

                    addHeader();
                    pdf.addImage(imgData1, 'PNG', marginX, position1, imgWidth, imgHeight1);
                    heightLeft1 -= (pageHeight - headerHeight);

                    while (heightLeft1 >= 0) {
                        position1 = heightLeft1 - imgHeight1 + headerHeight;
                        pdf.addPage();
                        addHeader();
                        pdf.addImage(imgData1, 'PNG', marginX, position1, imgWidth, imgHeight1);
                        heightLeft1 -= (pageHeight - headerHeight);
                    }
                } finally {
                    // Clean up: remove the temporary element
                    if (contentBeforeFirstBreak.parentNode) {
                        contentBeforeFirstBreak.parentNode.removeChild(contentBeforeFirstBreak);
                    }
                }

                // Process content after first page break (the page break element and everything after it)
                const contentAfterFirstBreak = element.cloneNode(true);
                
                // Get the original width to preserve it
                const originalWidth2 = element.offsetWidth || element.clientWidth || 800;
                
                // Temporarily append to body so html2canvas can process it
                contentAfterFirstBreak.style.position = 'absolute';
                contentAfterFirstBreak.style.left = '-9999px';
                contentAfterFirstBreak.style.top = '0';
                contentAfterFirstBreak.style.width = `${originalWidth2}px`;
                contentAfterFirstBreak.style.minWidth = `${originalWidth2}px`;
                document.body.appendChild(contentAfterFirstBreak);

                try {
                    // Find the page break element and remove everything before it
                    const firstBreakElement = contentAfterFirstBreak.querySelector('.page-break-before');
                    if (firstBreakElement) {
                        // Function to remove all nodes before a given element
                        const removeAllBefore = (targetElement) => {
                            // Remove all previous siblings at the current level
                            let prev = targetElement.previousSibling;
                            while (prev) {
                                const toRemove = prev;
                                prev = prev.previousSibling;
                                toRemove.remove();
                            }
                            
                            // Remove all previous element siblings
                            let prevElement = targetElement.previousElementSibling;
                            while (prevElement) {
                                const toRemove = prevElement;
                                prevElement = prevElement.previousElementSibling;
                                toRemove.remove();
                            }
                            
                            // Walk up the tree and remove previous siblings at each level
                            let current = targetElement;
                            while (current && current.parentElement && current.parentElement !== contentAfterFirstBreak) {
                                const parent = current.parentElement;
                                
                                // Remove all previous siblings of the parent
                                let parentPrev = parent.previousSibling;
                                while (parentPrev) {
                                    const toRemove = parentPrev;
                                    parentPrev = parentPrev.previousSibling;
                                    toRemove.remove();
                                }
                                
                                let parentPrevElement = parent.previousElementSibling;
                                while (parentPrevElement) {
                                    const toRemove = parentPrevElement;
                                    parentPrevElement = parentPrevElement.previousElementSibling;
                                    toRemove.remove();
                                }
                                
                                // Also remove previous children within the same parent
                                const parentChildren = Array.from(parent.children);
                                const currentIndex = parentChildren.indexOf(current);
                                if (currentIndex > 0) {
                                    for (let i = 0; i < currentIndex; i++) {
                                        if (parentChildren[i] && parentChildren[i].parentNode) {
                                            parentChildren[i].remove();
                                        }
                                    }
                                }
                                
                                current = parent;
                            }
                        };
                        
                        removeAllBefore(firstBreakElement);
                        // Keep the page break element itself - it will start on a new page
                    }

                    const canvas2 = await html2canvas(contentAfterFirstBreak, {
                        scale: 3, // Increased from 2 to 3 for better text quality
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        onclone: forceLightMode,
                        removeContainer: false
                    });

                    const imgData2 = canvas2.toDataURL('image/png');
                    const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;
                    let heightLeft2 = imgHeight2;
                    let position2 = headerHeight;

                    // Add new page for content after the page break
                    pdf.addPage();
                    addHeader();
                    pdf.addImage(imgData2, 'PNG', marginX, position2, imgWidth, imgHeight2);
                    heightLeft2 -= (pageHeight - headerHeight);

                    while (heightLeft2 >= 0) {
                        position2 = heightLeft2 - imgHeight2 + headerHeight;
                        pdf.addPage();
                        addHeader();
                        pdf.addImage(imgData2, 'PNG', marginX, position2, imgWidth, imgHeight2);
                        heightLeft2 -= (pageHeight - headerHeight);
                    }
                } finally {
                    // Clean up: remove the temporary element
                    if (contentAfterFirstBreak.parentNode) {
                        contentAfterFirstBreak.parentNode.removeChild(contentAfterFirstBreak);
                    }
                }
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert(`Error generating PDF: ${error.message || 'An unknown error occurred'}`);
        } finally {
            // Restore previous tab if changed
            if (previousTab !== 'agolix-summary') {
                setActiveTab(previousTab);
            }
            setIsGeneratingPDF(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Admin Assessment Details" breadcrumb={[["Admin Dashboard", "/dashboard"], "Assessment Details"]} />
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
                <Title title="Admin Assessment Details" breadcrumb={[["Admin Dashboard", "/dashboard"], "Assessment Details"]} />
                <div className="error-state">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h5>Assessment Not Found</h5>
                    <p className="text-muted">The requested assessment could not be found.</p>
                    <button className="btn" onClick={() => navigate('/admin/firm-comparison')}>
                        <i className="fas fa-arrow-left me-1"></i>
                        Back to Firms
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`container-fluid ${isGeneratingPDF ? 'pdf-generating' : ''}`}>
            <Title title={`${year} Assessment Details - ${userInfo?.firm || 'Firm'}`} breadcrumb={[["Admin Dashboard", "/dashboard"], ["Firms", "/admin/firm-comparison"], "Assessment Details"]} />

            {/* Admin Header */}
            <div className="admin-header mb-4 px-2 bg-warning text-dark rounded">
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <p className="text-dark">
                            Viewing assessment for: <strong>{userInfo?.firm || 'Loading...'}</strong>
                        </p>
                    </div>
                    <div className="col-md-4 text-end">
                        <button 
                            className="btn btn-sm me-1"
                            onClick={() => navigate('/admin/firm-comparison')}
                        >
                            <i className="fas fa-arrow-left me-1"></i>
                            Back to Firms
                        </button>
                    </div>
                </div>
            </div>

            {/* Header Section */}
            <div className="assessment-details-header">
                <div className="header-background">
                    <div className="header-pattern"></div>
                </div>
                <div className="header-content ps-3">
                    <div className="mb-2">
                        <button
                            className="btn btn-sm text-white"
                            onClick={() => navigate('/admin/firm-comparison')}
                        >
                            <i className="fas fa-arrow-left me-1"></i>
                            Back to Firms
                        </button>
                    </div>
                    <div className="row align-items-center">
                        <div className="col-lg-8">
                            <div className="header-main">
                                <div className="header-badge">
                                    <i className="fas fa-chart-line"></i>
                                    <span>ESG Assessment Report</span>
                                </div>
                                <h1 className="assessment-title">
                                    {year} Assessment Results - {userInfo?.firm || 'Firm'}
                                </h1>
                                <p className="header-description">
                                    Comprehensive analysis of Environmental, Social, and Governance performance metrics
                                </p>
                                <div className="header-meta">
                                    <div className="meta-item">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span>Completed: {formatDate(assessment.last_updated)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="fas fa-building"></i>
                                        <span>{userInfo?.firm || 'N/A'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="fas fa-envelope"></i>
                                        <span>{userInfo?.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="header-score-section">
                                <div className="score-card">
                                    <div className="score-header">
                                        <h3>Overall Performance</h3>
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
                                <div className="mb-3">
                                    <p className="mb-2">Dear {userInfo?.first_name || 'Valued Customer'},</p>
                                    <p className="">
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

                                <div className="mb-3">
                                    <h5 className="text-secondary mb-3">ESG Score by Indicators (Year {year})</h5>
                                    <ESGScoreChart score={scores} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Tab */}
                {activeTab === 'summary' && (
                    <div className="summary-tab p-0">
                        <div className="row gap-3">
                            {/* Methodology Section */}
                            <div className="col-12">
                                <div className="">
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

                            {/* ESG Performance Section */}
                            <div className="col-12">
                                <div className="">
                                    <h4 className="section-title">
                                        <i className="fas fa-chart-pie me-1"></i>
                                        ESG Performance Summary
                                    </h4>
                                    <div className="">
                                        {scores && (
                                            <>
                                                {/* Overall Score Card - Below Grid */}
                                                <div className="overall-score-card mb-4">
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

                                                {/* ESG Breakdown */}
                                                <div className="row mb-4">
                                                    <div className="col-4">
                                                        <div className="summary-esg-item environment border">
                                                            <div className="d-flex justify-content-between">
                                                                <div className="summary-esg-header">
                                                                    <div className="summary-esg-icon">
                                                                        <i className="fas fa-leaf"></i>
                                                                    </div>
                                                                    <div className="summary-esg-info">
                                                                        <span className="summary-esg-title">Environment</span>
                                                                        <span className="summary-esg-score">{scores.Environment}%</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className={`status-badge ${getScoreBadge(scores.Environment)}`}>
                                                                        {getScoreStatus(scores.Environment)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="summary-esg-bar">
                                                                <div className="summary-bar-bg">
                                                                    <div
                                                                        className="summary-bar-fill environment"
                                                                        style={{ width: `${scores.Environment}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-4">
                                                        <div className="summary-esg-item social border">
                                                            <div className="d-flex justify-content-between">
                                                                <div className="summary-esg-header">
                                                                    <div className="summary-esg-icon">
                                                                        <i className="fas fa-users"></i>
                                                                    </div>
                                                                    <div className="summary-esg-info">
                                                                        <span className="summary-esg-title">Social</span>
                                                                        <span className="summary-esg-score">{scores.Social}%</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className={`status-badge ${getScoreBadge(scores.Social)}`}>
                                                                        {getScoreStatus(scores.Social)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="summary-esg-bar">
                                                                <div className="summary-bar-bg">
                                                                    <div
                                                                        className="summary-bar-fill social"
                                                                        style={{ width: `${scores.Social}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="summary-esg-item governance border">
                                                            <div className="d-flex justify-content-between">
                                                                <div className="summary-esg-header">
                                                                    <div className="summary-esg-icon">
                                                                        <i className="fas fa-shield-alt"></i>
                                                                    </div>
                                                                    <div className="summary-esg-info">
                                                                        <span className="summary-esg-title">Governance</span>
                                                                        <span className="summary-esg-score">{scores.Governance}%</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className={`status-badge ${getScoreBadge(scores.Governance)}`}>
                                                                        {getScoreStatus(scores.Governance)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="summary-esg-bar">
                                                                <div className="summary-bar-bg">
                                                                    <div
                                                                        className="summary-bar-fill governance"
                                                                        style={{ width: `${scores.Governance}%` }}
                                                                    ></div>
                                                                </div>
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
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Consumption Data Section */}
                            {assessment?.consumption && (
                                <div className="col-12 mt-3">
                                    <div className="">
                                        <h4 className="section-title">
                                            <i className="fas fa-chart-bar me-1"></i>
                                            Resource Consumption Data
                                        </h4>
                                        <div className="consumption-content">
                                            <div className="row">
                                                {Object.entries(assessment.consumption).map(([key, value]) => (
                                                    <div key={key} className="col-md-6 col-lg-3 mb-3">
                                                        <div className="consumption-card">
                                                            <div className="consumption-header">
                                                                <h6 className="consumption-title">{key}</h6>
                                                            </div>
                                                            <div className="consumption-value">
                                                                {Array.isArray(value) ? value[0] : value}
                                                                <span className="consumption-unit">
                                                                    {key.includes('Electricity') ? ' kWh' :
                                                                        key.includes('Water') ? ' L' :
                                                                            key.includes('Petrol') || key.includes('Diesel') ? ' L' : ''}
                                                                </span>
                                                            </div>
                                                            <div className="consumption-period">per month</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                            <span>{userInfo?.firm || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Email</label>
                                            <span>{userInfo?.email || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Contact Number</label>
                                            <span>{userInfo?.contact_no || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Industry</label>
                                            <span>{userInfo?.industry || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Business Size</label>
                                            <span className="badge bg-info text-white">{userInfo?.business_size || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>State</label>
                                            <span>{userInfo?.location || 'N/A'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Verification Status</label>
                                            <span className={`badge ${userInfo?.status?.is_verified ? 'bg-success' : 'bg-warning'} text-white`}>
                                                {userInfo?.status?.is_verified ? 'Verified' : 'Pending Verification'}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Account Status</label>
                                            <span className={`badge ${userInfo?.status?.is_active ? 'bg-success' : 'bg-danger'} text-white`}>
                                                {userInfo?.status?.is_active ? 'Active' : 'Inactive'}
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
                                            <span>{formatDate(userInfo?.created_at)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Last Updated</label>
                                            <span>{formatDate(userInfo?.updated_at)}</span>
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
                                            const groupedResponses = getGroupedResponses();
                                            const categories = Object.keys(groupedResponses);

                                            // Set active category if not set and categories are available
                                            if (!activeCategory && categories.length > 0) {
                                                setActiveCategory(categories[0]);
                                            }

                                            if (categories.length === 0) {
                                                return (
                                                    <div className="no-responses">
                                                        <i className="fas fa-comments"></i>
                                                        <p>No valid question responses found for this assessment.</p>
                                                        <p className="text-muted">Please check the data structure or try refreshing the page.</p>
                                                    </div>
                                                );
                                            }

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
                                                                <div className="category-header mb-2">
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
                                                                                    <span className="question-category">{response.question?.category || response.category}</span>
                                                                                </div>
                                                                                <div className="response-status">
                                                                                    {(() => {
                                                                                        const hasAnswer = response.answer?.selected_option_submarks ||
                                                                                            response.answer?.selected_option_text ||
                                                                                            response.selectedOptions ||
                                                                                            response.question_score !== undefined;
                                                                                        return (
                                                                                            <span className={`answer-badge ${hasAnswer ? 'positive' : 'neutral'}`}>
                                                                                                <i className={`fas ${hasAnswer ? 'fa-check-circle' : 'fa-minus-circle'} me-1`}></i>
                                                                                                {hasAnswer ? 'Answered' : 'Not Answered'}
                                                                                            </span>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                            <div className="response-content">
                                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                                    <p className="question-text flex-grow-1">{getTextDisplay(response.question?.text || response.text, language) || 'Question text not available'}</p>
                                                                                    <div className="btn-group btn-group-sm" role="group">
                                                                                        <button
                                                                                            type="button"
                                                                                            className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                                            onClick={() => setLanguage('en')}
                                                                                            title="English"
                                                                                        >
                                                                                            EN
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            className={`btn ${language === 'ms' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                                                            onClick={() => setLanguage('ms')}
                                                                                            title="Malay"
                                                                                        >
                                                                                            MS
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="answer-details">
                                                                                    <div className="answer-summary">
                                                                                        <strong>Response:</strong>
                                                                                        <span className={`answer-value ${(() => {
                                                                                            const hasAnswer = response.answer?.selected_option_submarks ||
                                                                                                response.answer?.selected_option_text ||
                                                                                                response.selectedOptions ||
                                                                                                response.question_score !== undefined;
                                                                                            return hasAnswer ? 'text-success' : 'text-muted';
                                                                                        })()}`}>
                                                                                            {(() => {
                                                                                                // Handle V2 data structure from QuestionSectionV2.jsx
                                                                                                if (response.answer?.selected_option_text && response.answer.selected_option_text.length > 0) {
                                                                                                    return response.answer.selected_option_text.join(', ');
                                                                                                } else if (response.answer?.selected_option_submarks && response.answer.selected_option_submarks.length > 0) {
                                                                                                    const totalScore = response.answer.selected_option_submarks.reduce((sum, subMark) => sum + (subMark || 0), 0);
                                                                                                    const maxScore = response.answer.total_possible_score || 0;
                                                                                                    return `${totalScore} / ${maxScore} points`;
                                                                                                } else if (response.answer?.question_score !== undefined) {
                                                                                                    return `${response.answer.question_score} / ${response.answer.question_max} points`;
                                                                                                } else if (response.selectedOptions && response.selectedOptions.length > 0) {
                                                                                                    return response.selectedOptions.join(', ');
                                                                                                } else {
                                                                                                    return 'No response';
                                                                                                }
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>

                                                                                    {/* Enhanced answer details for V2 structure */}
                                                                                    {response.answer?.selected_option_text && response.answer.selected_option_text.length > 0 && (
                                                                                        <div className="answer-breakdown mt-2">
                                                                                            <div className="row">
                                                                                                <div className="col-md-6">
                                                                                                    <small className="text-muted">
                                                                                                        <strong>Selected Options:</strong><br />
                                                                                                        {response.answer.selected_option_text.map((text, index) => (
                                                                                                            <span key={index} className="badge bg-primary me-1 mb-1">
                                                                                                                {text}
                                                                                                            </span>
                                                                                                        ))}
                                                                                                    </small>
                                                                                                </div>
                                                                                                <div className="col-md-6">
                                                                                                    <small className="text-muted">
                                                                                                        <strong>Scoring:</strong><br />
                                                                                                        {response.answer.total_selected_score || 0} / {response.answer.total_possible_score || 0} points
                                                                                                        {response.answer.question_score !== undefined && (
                                                                                                            <span className="ms-2">
                                                                                                                (Final: {response.answer.question_score.toFixed(2)} / {response.answer.question_max || 0})
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </small>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                    {(response.question?.category || response.category) && (
                                                                                        <div className="question-category-badge">
                                                                                            <i className="fas fa-tag me-1"></i>
                                                                                            {response.question?.category || response.category}
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
                                            <div style={{
                                                background: '#fff3cd',
                                                border: '1px solid #ffeaa7',
                                                borderRadius: '4px',
                                                padding: '10px',
                                                marginBottom: '15px',
                                                fontSize: '12px'
                                            }}>
                                                <strong>⚠️ Data Status:</strong>
                                                <span style={{ marginLeft: '10px' }}>
                                                    assessmentResponses is null/undefined
                                                </span>
                                            </div>
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
                                        {scores && scores.breakdown ? (
                                            <div className="analytics-dashboard">
                                                {/* Chart.js Visualizations */}
                                                <div className="">
                                                    <ESGCharts scores={scores} />
                                                </div>

                                                {/* Detailed Breakdown */}
                                                <div className="">

                                                    {/* Environment Breakdown */}
                                                    <div className="breakdown-category">
                                                        <div className="breakdown-category-header">
                                                            <div className="breakdown-category-icon environment">
                                                                <i className="fas fa-leaf"></i>
                                                            </div>
                                                            <div className="breakdown-category-info">
                                                                <h6>Environment</h6>
                                                                <span className="breakdown-category-score">{scores.Environment}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="breakdown-items">
                                                            {scores.breakdown.Environment &&
                                                                Object.entries(scores.breakdown.Environment).map(([key, value]) => (
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
                                                                <span className="breakdown-category-score">{scores.Social}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="breakdown-items">
                                                            {scores.breakdown.Social &&
                                                                Object.entries(scores.breakdown.Social).map(([key, value]) => (
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
                                                                <span className="breakdown-category-score">{scores.Governance}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="breakdown-items">
                                                            {scores.breakdown.Governance &&
                                                                Object.entries(scores.breakdown.Governance).map(([key, value]) => (
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
                                            </div>
                                        ) : (
                                            <div className="analytics-placeholder">
                                                <i className="fas fa-chart-bar"></i>
                                                <h5>Analytics Dashboard</h5>
                                                <p>Detailed analytics and performance insights will be displayed here.</p>
                                                <p className="text-muted">This feature is coming soon!</p>
                                            </div>
                                        )}
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
                            {isGeneratingPDF ? 'Generating...' : 'Download Report'}
                        </button>
                        <button className="btn btn-outline-secondary me-3" onClick={() => navigate(`/admin/assessment-v2/${userId}`)}>
                            <i className="fas fa-edit me-1"></i>
                            Edit Assessment
                        </button>
                        <button className="btn" onClick={() => navigate('/admin/firm-comparison')}>
                            <i className="fas fa-building me-1"></i>
                            Back to Firms
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminAssessmentDetailsV2;