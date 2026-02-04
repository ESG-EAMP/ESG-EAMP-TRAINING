import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import Swal from 'sweetalert2';
import './QuestionSection.css';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

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

const TAB_ORDER = ['Year Selection', 'Prerequisites', 'Environment', 'Social', 'Governance', 'Finish'];

// Validate and filter draft answers against current questions
const validateDraftAnswers = (draftAnswers, currentQuestions) => {
    const validatedAnswers = { Prerequisites: {}, Environment: {}, Social: {}, Governance: {} };
    let invalidAnswersCount = 0;
    let removedQuestionsCount = 0;

    // Iterate through each category
    Object.keys(draftAnswers || {}).forEach(category => {
        if (!currentQuestions[category] || !Array.isArray(currentQuestions[category])) {
            // Category doesn't exist or is invalid, skip all answers for this category
            removedQuestionsCount += Object.keys(draftAnswers[category] || {}).length;
            return;
        }

        const categoryQuestions = currentQuestions[category];
        const questionIds = new Set(categoryQuestions.map(q => q._id));

        // Validate each answer in this category
        Object.keys(draftAnswers[category] || {}).forEach(questionId => {
            const question = categoryQuestions.find(q => q._id === questionId);
            
            if (!question) {
                // Question no longer exists
                removedQuestionsCount++;
                return;
            }

            const answerValue = draftAnswers[category][questionId];
            
            // Validate answer based on question type
            if (category === 'Prerequisites') {
                // Prerequisites: numeric input, just check if it's a valid number
                if (answerValue !== null && answerValue !== undefined && answerValue !== '') {
                    const numValue = Number(answerValue);
                    if (!isNaN(numValue) && numValue >= 0) {
                        validatedAnswers[category][questionId] = answerValue;
                    } else {
                        invalidAnswersCount++;
                    }
                }
            } else {
                // Other categories: validate against options
                if (question.options && Array.isArray(question.options)) {
                    const maxOptionIndex = question.options.length - 1;
                    
                    if (Array.isArray(answerValue)) {
                        // Multiple selection: validate each option index
                        const validSelections = answerValue.filter(optIndex => {
                            const numIndex = Number(optIndex);
                            return !isNaN(numIndex) && numIndex >= 0 && numIndex <= maxOptionIndex;
                        });
                        
                        if (validSelections.length > 0) {
                            validatedAnswers[category][questionId] = validSelections;
                        } else {
                            invalidAnswersCount++;
                        }
                    } else if (answerValue !== null && answerValue !== undefined) {
                        // Single selection: validate option index
                        const numIndex = Number(answerValue);
                        if (!isNaN(numIndex) && numIndex >= 0 && numIndex <= maxOptionIndex) {
                            validatedAnswers[category][questionId] = answerValue;
                        } else {
                            invalidAnswersCount++;
                        }
                    }
                } else {
                    // Question has no options (shouldn't happen, but handle gracefully)
                    invalidAnswersCount++;
                }
            }
        });
    });

    return {
        validatedAnswers,
        invalidAnswersCount,
        removedQuestionsCount
    };
};

function QuestionSectionV2() {
    const [activeTab, setActiveTab] = useState('Year Selection');
    const [questions, setQuestions] = useState({ Prerequisites: [], Environment: [], Social: [], Governance: [] });
    const [answers, setAnswers] = useState({ Prerequisites: {}, Environment: {}, Social: {}, Governance: {} });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [assessmentCompleted, setAssessmentCompleted] = useState(false);
    const [highlightedQuestionId, setHighlightedQuestionId] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedQuestionInfo, setSelectedQuestionInfo] = useState(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [draftExists, setDraftExists] = useState(false);
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [showDraftSelection, setShowDraftSelection] = useState(false);
    const [userDrafts, setUserDrafts] = useState([]);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
    const [startFreshMode, setStartFreshMode] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' or 'ms'

    const navigate = useNavigate();
    // Check for drafts on mount
    useEffect(() => {
        const checkDrafts = async () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                setIsLoadingDrafts(false);
                return;
            }

            try {
                const response = await api.get('/assessment/user/v2/get-all-drafts-2');
                const drafts = response.data.drafts || [];
                
                if (drafts.length > 0) {
                    setUserDrafts(drafts);
                    setShowDraftSelection(true);
                }
            } catch (error) {
                console.error("Error checking drafts:", error);
            } finally {
                setIsLoadingDrafts(false);
            }
        };

        checkDrafts();
    }, []);

    useEffect(() => {
        api.get('/assessment/user/v2/get-questions-2')
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
                //console.log("🔍 FETCHED V2 QUESTIONS DEBUG:");
                //console.log("Total questions:", data.length);
                //console.log("Sample Environment question:", data.find(q => q.category === 'Environment'));
                //console.log("Sample Social question:", data.find(q => q.category === 'Social'));
                //console.log("Sample Governance question:", data.find(q => q.category === 'Governance'));
                setQuestions(grouped);
                console.log("🔍 FETCHED V2 QUESTIONS DEBUG:");
                console.log("Questions:", grouped);
            })
            .catch(err => {
                console.error("Error fetching v2 questions:", err);
                setQuestions({ Prerequisites: [], Environment: [], Social: [], Governance: [] });
            });
    }, []);

    // Load draft when questions are loaded or when year changes (only if not showing draft selection)
    useEffect(() => {
        // Don't auto-load draft if draft selection page is showing
        if (showDraftSelection) {
            return;
        }

        // Don't auto-load draft if user explicitly chose to start fresh
        if (startFreshMode) {
            return;
        }

        const loadDraft = async () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) return;

            // Check if questions have been loaded (at least one category has questions)
            const questionsLoaded = Object.values(questions).some(cat => Array.isArray(cat) && cat.length > 0);
            if (!questionsLoaded) {
                // Questions not loaded yet, skip draft loading
                return;
            }

            // Prevent loading draft multiple times for the same year
            // Only auto-load if draftLoaded is false (meaning user hasn't explicitly chosen to start fresh or continue)
            if (draftLoaded) {
                return;
            }

            try {
                const response = await api.get('/assessment/user/v2/get-draft-2', {
                    params: {
                        user_id: userId,
                        assessment_year: selectedYear
                    }
                });

                if (response.data.exists && response.data.draft) {
                    const draft = response.data.draft;
                    setDraftExists(true);
                    
                    // Validate and filter draft answers against current questions
                    if (draft.answers) {
                        const validation = validateDraftAnswers(draft.answers, questions);
                        setAnswers(validation.validatedAnswers);
                        
                        // Show warning if some answers were invalid or removed
                        if (validation.invalidAnswersCount > 0 || validation.removedQuestionsCount > 0) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Form Updated',
                                html: `
                                    <p>The assessment form has been updated since you saved this draft.</p>
                                    ${validation.removedQuestionsCount > 0 ? `<p><strong>${validation.removedQuestionsCount}</strong> question(s) were removed and their answers have been cleared.</p>` : ''}
                                    ${validation.invalidAnswersCount > 0 ? `<p><strong>${validation.invalidAnswersCount}</strong> answer(s) were invalid and have been cleared.</p>` : ''}
                                    <p>Please review your answers before submitting.</p>
                                `,
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#3085d6'
                            });
                        }
                    }
                    
                    // Validate active tab still exists
                    if (draft.active_tab && draft.active_tab !== 'Year Selection') {
                        if (questions[draft.active_tab] && questions[draft.active_tab].length > 0) {
                            setActiveTab(draft.active_tab);
                        }
                    }
                    
                    setDraftLoaded(true);
                    
                    // Show notification
                    Swal.fire({
                        icon: 'info',
                        title: 'Draft Loaded',
                        text: 'Your previous draft has been loaded. You can continue where you left off.',
                        timer: 3000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                } else {
                    // No draft exists for this year
                    setDraftExists(false);
                    setDraftLoaded(false);
                }
            } catch (error) {
                console.error("Error loading draft:", error);
                setDraftExists(false);
                setDraftLoaded(false);
                // Don't show error to user, just continue without draft
            }
        };

        loadDraft();
    }, [selectedYear, questions, showDraftSelection, draftLoaded, startFreshMode]);

    // Load draft when year changes (after questions are loaded)
    useEffect(() => {
        const loadDraft = async () => {
            const userId = localStorage.getItem("user_id");
            if (!userId) return;

            // Check if questions have been loaded (at least one category has questions)
            const questionsLoaded = Object.values(questions).some(cat => Array.isArray(cat) && cat.length > 0);
            if (!questionsLoaded) {
                // Questions not loaded yet, skip draft loading
                return;
            }

            try {
                const response = await api.get('/assessment/user/v2/get-draft-2', {
                    params: {
                        user_id: userId,
                        assessment_year: selectedYear
                    }
                });

                if (response.data.exists && response.data.draft) {
                    const draft = response.data.draft;
                    setDraftExists(true);
                    
                    // Restore answers and active tab
                    if (draft.answers) {
                        setAnswers(draft.answers);
                    }
                    if (draft.active_tab) {
                        setActiveTab(draft.active_tab);
                    }
                    
                    setDraftLoaded(true);
                    
                    // Show notification
                    Swal.fire({
                        icon: 'info',
                        title: 'Draft Loaded',
                        text: 'Your previous draft has been loaded. You can continue where you left off.',
                        timer: 3000,
                        showConfirmButton: false,
                        toast: true,
                        position: 'top-end'
                    });
                } else {
                    // No draft exists for this year
                    setDraftExists(false);
                    setDraftLoaded(false);
                }
            } catch (error) {
                console.error("Error loading draft:", error);
                setDraftExists(false);
                // Don't show error to user, just continue without draft
            }
        };

        loadDraft();
    }, [selectedYear, questions]);

    // Scroll to top when tab changes
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is updated, then scroll
        const scrollToTop = () => {
            requestAnimationFrame(() => {
                // Find the container element
                const container = document.getElementById('question-section-container');
                if (container) {
                    // Get the sticky header height
                    const header = document.querySelector('.navbar-custom');
                    const headerHeight = header ? header.offsetHeight : 70;
                    
                    // Get the container's position relative to the document
                    const containerRect = container.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const targetPosition = containerRect.top + scrollTop - headerHeight;
                    
                    // Scroll to position accounting for header
                    window.scrollTo({ 
                        top: Math.max(0, targetPosition), 
                        behavior: 'smooth' 
                    });
                } else {
                    // Fallback: scroll window to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        };
        
        // Delay slightly to ensure content is rendered
        const timer = setTimeout(scrollToTop, 100);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [questionId]: value
            }
        }));
        // Remove highlight when question is answered
        if (highlightedQuestionId === questionId) {
            setHighlightedQuestionId(null);
        }
    };

    const handleOptionSelection = (questionId, optionIndex, allowMultiple, optionText) => {
        // Find the question to access its options
        const question = questions[activeTab]?.find(q => q._id === questionId);
        const optionTextLower = optionText?.trim().toLowerCase();
        const isNoneOfTheAbove = optionTextLower === "none of the above" || optionTextLower === "tiada di atas";
        
        if (!allowMultiple) {
            // Single selection: replace with the selected option
            setAnswers(prev => ({
                ...prev,
                [activeTab]: {
                    ...prev[activeTab],
                    [questionId]: optionIndex
                }
            }));
            return;
        }
        
        // Multiple selection: toggle the option
        setAnswers(prev => {
            const currentAnswers = prev[activeTab] || {};
            // Normalize to array: handle both array and number (single selection) cases
            // Important: use !== undefined check to handle index 0 correctly
            const currentSelection = Array.isArray(currentAnswers[questionId])
                ? currentAnswers[questionId]
                : (currentAnswers[questionId] !== undefined ? [currentAnswers[questionId]] : []);
            
            // Check if "None of the above" is being selected
            if (isNoneOfTheAbove) {
                // If "None of the above" is being selected, clear all other selections
                if (currentSelection.includes(optionIndex)) {
                    // If it's already selected, unselect it
                    const newSelection = [];
                    // Question becomes unanswered, highlight it
                    setTimeout(() => {
                        setHighlightedQuestionId(questionId);
                    }, 0);
                    return {
                        ...prev,
                        [activeTab]: {
                            ...currentAnswers,
                            [questionId]: newSelection
                        }
                    };
                } else {
                    // Select only "None of the above", clear all others
                    const newSelection = [optionIndex];
                    // Remove highlight when question is answered
                    setTimeout(() => {
                        if (highlightedQuestionId === questionId) {
                            setHighlightedQuestionId(null);
                        }
                    }, 0);
                    return {
                        ...prev,
                        [activeTab]: {
                            ...currentAnswers,
                            [questionId]: newSelection
                        }
                    };
                }
            } else {
                // Check if "None of the above" is currently selected (check both languages)
                const noneOfTheAboveIndex = question?.options?.findIndex(opt => {
                    const optText = getTextDisplay(opt.text, language);
                    const optTextLower = optText?.trim().toLowerCase();
                    return optTextLower === "none of the above" || optTextLower === "tiada di atas";
                });
                const hasNoneOfTheAbove = noneOfTheAboveIndex !== undefined && 
                                         noneOfTheAboveIndex !== -1 && 
                                         currentSelection.includes(noneOfTheAboveIndex);
                
                // If "None of the above" is selected and user selects another option, unselect "None of the above"
                let newSelection;
                if (currentSelection.includes(optionIndex)) {
                    // Remove the option if it's already selected
                    newSelection = currentSelection.filter(opt => opt !== optionIndex);
                } else {
                    // Add the option if it's not selected
                    // If "None of the above" was selected, remove it first
                    if (hasNoneOfTheAbove) {
                        newSelection = [optionIndex];
                    } else {
                        newSelection = [...currentSelection, optionIndex];
                    }
                }
                
                // Remove highlight when question is answered (has at least one option selected)
                if (highlightedQuestionId === questionId && newSelection.length > 0) {
                    setHighlightedQuestionId(null);
                }
                
                return {
                    ...prev,
                    [activeTab]: {
                        ...currentAnswers,
                        [questionId]: newSelection
                    }
                };
            }
        });
    };

    const handleSaveDraft = async () => {
        const userId = localStorage.getItem("user_id");
        
        if (!userId) return Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'User not identified. Please log in.',
            timer: 1200,
            showConfirmButton: false
        });

        setIsSavingDraft(true);

        try {
            await api.post('/assessment/user/v2/save-draft-2', {
                user_id: userId,
                assessment_year: selectedYear,
                answers: answers,
                active_tab: activeTab
            });

            setDraftExists(true);
            
            Swal.fire({
                icon: 'success',
                title: 'Draft Saved',
                text: 'Your progress has been saved as a draft.',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } catch (error) {
            console.error("Error saving draft:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save draft. Please try again.',
                timer: 2000,
                showConfirmButton: false
            });
        } finally {
            setIsSavingDraft(false);
        }
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
            //console.log(`Processing category: ${category}`);
            //console.log(`Questions in ${category}:`, questions[category]);
            questions[category].forEach(q => {
                const answer = answers[category][q._id];
                //console.log(`Question ${q._id} answer:`, answer);
                // Use !== undefined to handle index 0 (first option) correctly
                if (answer !== undefined) {
                    if (q.category === 'Prerequisites') {
                        // Prerequisites use simple number input
                        allResponses.push({
                            question: {
                                _id: q._id,
                                category: q.category,
                                subCategory: q.subCategory,
                                text: q.text,
                                weight: q.weight,
                                index: q.index
                            },
                            answer: answer
                        });
                    } else {
                        // V2 categories use multiple option selection with sub-marks
                        const selectedOptions = Array.isArray(answer) ? answer : (answer !== undefined ? [answer] : []);
                        // Get option texts in current language
                        const selectedOptionTexts = selectedOptions.map(optIndex => {
                            const opt = q.options[optIndex];
                            if (!opt) return null;
                            return getTextDisplay(opt.text, language);
                        }).filter(Boolean);
                        const selectedOptionSubMarks = selectedOptions.map(optIndex => q.options[optIndex]?.subMark || 0);
                        
                        // Calculate total selected score and total possible score
                        const totalSelectedScore = selectedOptionSubMarks.reduce((sum, subMark) => sum + (parseFloat(subMark) || 0), 0);
                        const totalPossibleScore = q.options.reduce((sum, option) => sum + (parseFloat(option?.subMark) || 0), 0);
                        const questionWeight = parseFloat(q.weight) || 0;
                        
                        // Apply new scoring formula: finalscore = total_selected_score/total_score * total_weight
                        const finalScore = totalPossibleScore > 0 ? (totalSelectedScore / totalPossibleScore) * questionWeight : 0;
                        
                        //console.log(`🔍 V2 Question ${q._id}: Category=${q.category}, Weight=${q.weight}, Selected Options=${selectedOptions}, Final Score=${finalScore}`);
                        //console.log(`🔍 Full V2 question object:`, q);
                        
                        // Submit as single response with multiple selections
                        allResponses.push({
                            question: {
                                _id: q._id,
                                category: q.category,
                                subCategory: q.subCategory,
                                text: q.text,
                                weight: q.weight,
                                index: q.index
                            },
                            answer: {
                                selected_option: selectedOptions,
                                selected_option_text: selectedOptionTexts,
                                selected_option_submarks: selectedOptionSubMarks,
                                total_selected_score: totalSelectedScore,
                                total_possible_score: totalPossibleScore,
                                question_score: finalScore,
                                question_max: questionWeight
                            }
                        });
                    }
                }
            });
        });
        //console.log("🔍 SUBMISSION DEBUG:");
        //console.log("User ID:", userId);
        //console.log("Assessment Year:", selectedYear);
        //console.log("All responses array:", allResponses);
        //console.log("Number of responses:", allResponses.length);
        //console.log("Answers object:", answers);
        //console.log("Questions object:", questions);
        
        console.log("Submitting V2 assessment:", {
            user_id: userId,
            assessment_year: selectedYear,
            responses: allResponses
        });
        
        // Debug: Log the structure of each response
        allResponses.forEach((response, index) => {
            console.log(`Response ${index}:`, {
                question_id: response.question._id,
                answer_structure: response.answer,
                answer_type: typeof response.answer,
                selected_option_type: typeof response.answer.selected_option,
                selected_option_is_array: Array.isArray(response.answer.selected_option)
            });
        });

        //return;

        try {
            console.log("Submitting V2 assessment:", {
                user_id: userId,
                assessment_year: selectedYear,
                responses: allResponses
            });
            const res = await api.post('/assessment/user/v2/submit-response-enhanced-2', {
                user_id: userId,
                assessment_year: selectedYear,
                responses: allResponses
            });

            const result = res.data;
            console.log("✅ V2 Assessment submitted successfully:", result);
            
            // Debug: Check how the data was stored
            if (result.saved_responses) {
                console.log("🔍 Backend stored responses:", result.saved_responses);
                result.saved_responses.forEach((savedResponse, index) => {
                    console.log(`Stored Response ${index}:`, {
                        question_id: savedResponse.question?._id,
                        answer: savedResponse.answer,
                        answer_type: typeof savedResponse.answer,
                        is_string: typeof savedResponse.answer === 'string'
                    });
                });
            }
            
            // Delete draft after successful submission
            try {
                await api.delete('/assessment/user/v2/delete-draft-2', {
                    data: {
                        user_id: userId,
                        assessment_year: selectedYear
                    }
                });
                setDraftExists(false);
            } catch (error) {
                console.error("Error deleting draft after submission:", error);
                // Don't fail submission if draft deletion fails
            }

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

    // Show all questions of the current category on one page
    const currentQuestions = questions[activeTab] || [];

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
        const answeredQuestions = TAB_ORDER.slice(1, -1).reduce((sum, tab) => {
            if (tab === 'Prerequisites') {
                return sum + Object.keys(answers[tab] || {}).filter(id => answers[tab][id]).length;
            } else {
                return sum + Object.keys(answers[tab] || {}).filter(id => answers[tab][id] !== undefined).length;
            }
        }, 0);
        const baseProgress = (TAB_ORDER.indexOf(activeTab) - 1) * 20; // 20% per section
        const sectionProgress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 20 : 0;
        return Math.round(baseProgress + sectionProgress);
    };

    const getTabProgress = (tab) => {
        if (tab === 'Year Selection') return selectedYear ? 100 : 0;
        if (tab === 'Finish') return 0;
        if (questions[tab].length === 0) return 0;
        
        if (tab === 'Prerequisites') {
            // For Prerequisites, check if answers have values
            return Math.round((Object.keys(answers[tab] || {}).filter(id => answers[tab][id]).length / questions[tab].length) * 100);
        } else {
            // For V2 categories, check if answers have selected options
            return Math.round((Object.keys(answers[tab] || {}).filter(id => answers[tab][id] !== undefined).length / questions[tab].length) * 100);
        }
    };

    const canGoNext = () => {
        if (activeTab === 'Year Selection') return selectedYear;
        if (activeTab === 'Finish') return false;

        const currentTabQuestions = currentQuestions.map(q => q._id);
        
        if (activeTab === 'Prerequisites') {
            // For Prerequisites, check if answers have values
            const answeredQuestions = currentTabQuestions.filter(id => answers[activeTab][id]);
            return answeredQuestions.length === currentTabQuestions.length;
        } else {
            // For V2 categories, check if answers have selected options
            const answeredQuestions = currentTabQuestions.filter(id => answers[activeTab][id] !== undefined);
            return answeredQuestions.length === currentTabQuestions.length;
        }
    };

    const findFirstUnansweredQuestion = () => {
        if (activeTab === 'Year Selection' || activeTab === 'Finish') return null;
        
        const currentTabQuestions = currentQuestions;
        
        for (const q of currentTabQuestions) {
            if (activeTab === 'Prerequisites') {
                // For Prerequisites, check if answer has a value
                if (!answers[activeTab][q._id]) {
                    return q._id;
                }
            } else {
                // For V2 categories, check if answer has selected options
                const answer = answers[activeTab][q._id];
                if (answer === undefined || (Array.isArray(answer) && answer.length === 0)) {
                    return q._id;
                }
            }
        }
        return null;
    };

    const handleNext = () => {
        if (activeTab === 'Year Selection') {
            setActiveTab('Prerequisites');
            return;
        }
        
        // Check if all questions are answered
        const firstUnanswered = findFirstUnansweredQuestion();
        
        if (firstUnanswered) {
            // Not all questions answered - scroll to first unanswered
            setHighlightedQuestionId(firstUnanswered);
            
            // Wait a bit for the highlight to apply, then scroll
            setTimeout(() => {
                const questionElement = document.getElementById(`question-${firstUnanswered}`);
                if (questionElement) {
                    questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        } else {
            // All questions answered - proceed to next category
            setHighlightedQuestionId(null);
            if (TAB_ORDER.indexOf(activeTab) < TAB_ORDER.length - 1) {
                const nextTabIndex = TAB_ORDER.indexOf(activeTab) + 1;
                setActiveTab(TAB_ORDER[nextTabIndex]);
            }
            // The useEffect will handle scrolling when activeTab changes
        }
    };

    const handlePrevious = () => {
        if (activeTab === 'Year Selection') return;

        if (TAB_ORDER.indexOf(activeTab) > 1) {
            const prevTabIndex = TAB_ORDER.indexOf(activeTab) - 1;
            setActiveTab(TAB_ORDER[prevTabIndex]);
        } else if (TAB_ORDER.indexOf(activeTab) === 1) {
            setActiveTab('Year Selection');
        }
        // The useEffect will handle scrolling when activeTab changes
    };

    const isLastStep = () => {
        return activeTab === 'Governance';
    };

    // Validate and filter draft answers against current questions
    const validateDraftAnswers = (draftAnswers, currentQuestions) => {
        const validatedAnswers = { Prerequisites: {}, Environment: {}, Social: {}, Governance: {} };
        let invalidAnswersCount = 0;
        let removedQuestionsCount = 0;

        // Iterate through each category
        Object.keys(draftAnswers || {}).forEach(category => {
            if (!currentQuestions[category] || !Array.isArray(currentQuestions[category])) {
                // Category doesn't exist or is invalid, skip all answers for this category
                removedQuestionsCount += Object.keys(draftAnswers[category] || {}).length;
                return;
            }

            const categoryQuestions = currentQuestions[category];
            const questionIds = new Set(categoryQuestions.map(q => q._id));

            // Validate each answer in this category
            Object.keys(draftAnswers[category] || {}).forEach(questionId => {
                const question = categoryQuestions.find(q => q._id === questionId);
                
                if (!question) {
                    // Question no longer exists
                    removedQuestionsCount++;
                    return;
                }

                const answerValue = draftAnswers[category][questionId];
                
                // Validate answer based on question type
                if (category === 'Prerequisites') {
                    // Prerequisites: numeric input, just check if it's a valid number
                    if (answerValue !== null && answerValue !== undefined && answerValue !== '') {
                        const numValue = Number(answerValue);
                        if (!isNaN(numValue) && numValue >= 0) {
                            validatedAnswers[category][questionId] = answerValue;
                        } else {
                            invalidAnswersCount++;
                        }
                    }
                } else {
                    // Other categories: validate against options
                    if (question.options && Array.isArray(question.options)) {
                        const maxOptionIndex = question.options.length - 1;
                        
                        if (Array.isArray(answerValue)) {
                            // Multiple selection: validate each option index
                            const validSelections = answerValue.filter(optIndex => {
                                const numIndex = Number(optIndex);
                                return !isNaN(numIndex) && numIndex >= 0 && numIndex <= maxOptionIndex;
                            });
                            
                            if (validSelections.length > 0) {
                                validatedAnswers[category][questionId] = validSelections;
                            } else {
                                invalidAnswersCount++;
                            }
                        } else if (answerValue !== null && answerValue !== undefined) {
                            // Single selection: validate option index
                            const numIndex = Number(answerValue);
                            if (!isNaN(numIndex) && numIndex >= 0 && numIndex <= maxOptionIndex) {
                                validatedAnswers[category][questionId] = answerValue;
                            } else {
                                invalidAnswersCount++;
                            }
                        }
                    } else {
                        // Question has no options (shouldn't happen, but handle gracefully)
                        invalidAnswersCount++;
                    }
                }
            });
        });

        return {
            validatedAnswers,
            invalidAnswersCount,
            removedQuestionsCount
        };
    };

    const handleContinueDraft = async (draft) => {
        // First reset all state
        setShowDraftSelection(false);
        setAssessmentCompleted(false);
        setHighlightedQuestionId(null);
        setIsSubmitting(false);
        setIsSavingDraft(false);
        // Clear startFreshMode when continuing a draft
        setStartFreshMode(false);
        
        // Set the year first
        setSelectedYear(draft.assessment_year);
        
        // Wait for questions to be loaded before validating
        // Check if questions are already loaded
        const questionsLoaded = Object.values(questions).some(cat => Array.isArray(cat) && cat.length > 0);
        
        if (questionsLoaded && draft.answers) {
            // Validate and filter draft answers against current questions
            const validation = validateDraftAnswers(draft.answers, questions);
            setAnswers(validation.validatedAnswers);
            
            // Show warning if some answers were invalid or removed
            if (validation.invalidAnswersCount > 0 || validation.removedQuestionsCount > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Form Updated',
                    html: `
                        <p>The assessment form has been updated since you saved this draft.</p>
                        ${validation.removedQuestionsCount > 0 ? `<p><strong>${validation.removedQuestionsCount}</strong> question(s) were removed and their answers have been cleared.</p>` : ''}
                        ${validation.invalidAnswersCount > 0 ? `<p><strong>${validation.invalidAnswersCount}</strong> answer(s) were invalid and have been cleared.</p>` : ''}
                        <p>Please review your answers before submitting.</p>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3085d6'
                });
            }
        } else if (draft.answers) {
            // Questions not loaded yet, set answers as-is (will be validated when questions load)
            setAnswers(draft.answers);
        } else {
            setAnswers({ Prerequisites: {}, Environment: {}, Social: {}, Governance: {} });
        }
        
        if (draft.active_tab && draft.active_tab !== 'Year Selection') {
            // Validate that the active tab still exists and has questions
            if (questions[draft.active_tab] && questions[draft.active_tab].length > 0) {
                setActiveTab(draft.active_tab);
            } else {
                setActiveTab('Year Selection');
            }
        } else {
            setActiveTab('Year Selection');
        }
        
        setDraftExists(true);
        setDraftLoaded(true);
        
        // Show notification
        Swal.fire({
            icon: 'success',
            title: 'Draft Loaded',
            text: `Continuing your draft for ${draft.assessment_year}.`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    const handleStartFresh = () => {
        // Reset all state to initial values
        setShowDraftSelection(false);
        setAnswers({ Prerequisites: {}, Environment: {}, Social: {}, Governance: {} });
        setActiveTab('Year Selection');
        setDraftExists(false);
        // Set draftLoaded to true and startFreshMode to true to prevent auto-loading of drafts
        setDraftLoaded(true);
        setStartFreshMode(true);
        setSelectedYear(new Date().getFullYear());
        setAssessmentCompleted(false);
        setHighlightedQuestionId(null);
        setIsSubmitting(false);
        setIsSavingDraft(false);
        
        // Clear any draft-related state
        setUserDrafts([]);
    };

    const handleDeleteDraft = async (draftId, assessmentYear, event) => {
        event.stopPropagation();
        
        const result = await Swal.fire({
            title: 'Delete Draft?',
            text: `Are you sure you want to delete the draft for ${assessmentYear}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            const userId = localStorage.getItem("user_id");
            try {
                await api.delete('/assessment/user/v2/delete-draft-2', {
                    data: {
                        user_id: userId,
                        assessment_year: assessmentYear
                    }
                });

                // Remove from local state
                setUserDrafts(prev => prev.filter(d => d._id !== draftId));
                
                // If no drafts left, hide selection page
                if (userDrafts.length === 1) {
                    setShowDraftSelection(false);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Draft deleted successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } catch (error) {
                console.error("Error deleting draft:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete draft. Please try again.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        }
    };

    const renderDraftSelection = () => {
        if (isLoadingDrafts) {
            return (
                <div className="draft-selection-container">
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Checking for saved drafts...</p>
                    </div>
                </div>
            );
        }

        if (!showDraftSelection || userDrafts.length === 0) {
            return null;
        }

        return (
            <div className="draft-selection-container">
                <div className=" border-0">
                    <div className="card-body p-4">
                        <div className="text-center mb-4">
                            <h3 className="text-primary">Continue Where You Left Off</h3>
                            <p className="text-muted">You have {userDrafts.length} saved draft{userDrafts.length !== 1 ? 's' : ''}. Choose one to continue or start fresh.</p>
                        </div>

                        <div className="row g-3 mb-4">
                            {userDrafts.map((draft, index) => {
                                const savedDate = draft.updated_at ? new Date(draft.updated_at) : new Date(draft.saved_at);
                                const answerCount = Object.values(draft.answers || {}).reduce((total, categoryAnswers) => {
                                    return total + Object.keys(categoryAnswers || {}).length;
                                }, 0);

                                // Calculate progress percentage
                                const totalQuestions = TAB_ORDER.slice(1, -1).reduce((sum, tab) => {
                                    return sum + (questions[tab]?.length || 0);
                                }, 0);
                                const progressPercentage = totalQuestions > 0 ? Math.round((answerCount / totalQuestions) * 100) : 0;

                                return (
                                    <div key={draft._id || index} className="col-md-6">
                                        <div className="card h-100 border shadow-sm">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <h5 className="card-title mb-0">
                                                        <i className="fas fa-calendar-alt text-primary me-2"></i>
                                                        Assessment Year {draft.assessment_year}
                                                    </h5>
                                                    <span className="badge bg-info">Draft</span>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <small className="text-muted">Progress</small>
                                                        <small className="text-muted fw-bold">{progressPercentage}%</small>
                                                    </div>
                                                    <div className="progress" style={{ height: '6px' }}>
                                                        <div 
                                                            className="progress-bar bg-primary" 
                                                            style={{ width: `${progressPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <p className="text-muted mb-1">
                                                        <small>
                                                            <i className="fas fa-clock me-1"></i>
                                                            Last saved: {savedDate.toLocaleString()}
                                                        </small>
                                                    </p>
                                                    <p className="text-muted mb-1">
                                                        <small>
                                                            <i className="fas fa-check-circle me-1"></i>
                                                            {answerCount} question{answerCount !== 1 ? 's' : ''} answered
                                                        </small>
                                                    </p>
                                                    {draft.active_tab && draft.active_tab !== 'Year Selection' && (
                                                        <p className="text-muted mb-0">
                                                            <small>
                                                                <i className="fas fa-map-marker-alt me-1"></i>
                                                                Last section: {draft.active_tab}
                                                            </small>
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-primary flex-grow-1"
                                                        onClick={() => handleContinueDraft(draft)}
                                                    >
                                                        <i className="fas fa-play me-2"></i>
                                                        Continue
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={(e) => handleDeleteDraft(draft._id, draft.assessment_year, e)}
                                                        title="Delete draft"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="text-center">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={handleStartFresh}
                            >
                                <i className="fas fa-plus me-2"></i>
                                Start Fresh Assessment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                                    onClick={() => {
                                        // Reset state when changing year (draft will be loaded by useEffect unless startFreshMode is true)
                                        setAnswers({ Prerequisites: {}, Environment: {}, Social: {}, Governance: {} });
                                        setDraftExists(false);
                                        // Only reset draftLoaded if not in startFreshMode
                                        if (!startFreshMode) {
                                            setDraftLoaded(false);
                                        }
                                        setActiveTab('Year Selection');
                                        setSelectedYear(year);
                                    }}
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
                            {TAB_ORDER.slice(1, -1).map(tab => {
                                const answeredCount = tab === 'Prerequisites' 
                                    ? Object.keys(answers[tab] || {}).filter(id => answers[tab][id]).length
                                    : Object.keys(answers[tab] || {}).filter(id => answers[tab][id] !== undefined).length;
                                
                                return (
                                    <div key={tab} className="summary-section">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>{tab}</span>
                                            <span className="badge bg-primary">
                                                {answeredCount}/{questions[tab].length}
                                            </span>
                                        </div>
                                        <div className="progress mt-1" style={{ height: '4px' }}>
                                            <div
                                                className="progress-bar bg-primary"
                                                style={{ width: `${getTabProgress(tab)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {assessmentCompleted && (
                    <div className="next-steps mt-4">
                        <h5 className="mb-3">What's Next?</h5>
                        <div className="row">
                            <div className="col-md-4 text-center mb-3">
                                <div className="next-step-item" onClick={() => navigate(`/assessment-details-v2/${selectedYear}`)}>
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
        <div id="question-section-container" className="">
            {/* Overall Progress Bar - Hide when showing draft selection */}
            {!showDraftSelection && (
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
            )}

            {/* Wizard Steps - Hide when showing draft selection */}
            {!showDraftSelection && (
                <div className="wizard-steps mb-4">
                    <div className="row">
                        {TAB_ORDER.map((tab, index) => {
                            const currentTabIndex = TAB_ORDER.indexOf(activeTab);
                            const isPastOrCurrent = index <= currentTabIndex;
                            
                            // Check if tab is completed (all questions answered)
                            const isTabCompleted = (() => {
                                if (tab === 'Year Selection') {
                                    return selectedYear !== null && selectedYear !== undefined;
                                }
                                if (tab === 'Finish') {
                                    return false; // Finish is not a question tab
                                }
                                
                                const tabQuestions = questions[tab] || [];
                                if (tabQuestions.length === 0) return false;
                                
                                if (tab === 'Prerequisites') {
                                    // For Prerequisites, check if all questions have non-empty answers
                                    const answeredCount = Object.keys(answers[tab] || {}).filter(id => answers[tab][id]).length;
                                    return answeredCount === tabQuestions.length;
                                } else {
                                    // For other tabs, check if all questions have answers (including 0/index 0)
                                    const answeredCount = Object.keys(answers[tab] || {}).filter(id => answers[tab][id] !== undefined).length;
                                    return answeredCount === tabQuestions.length;
                                }
                            })();
                            
                            // Allow navigation if: past/current step OR tab is completed
                            const isClickable = isPastOrCurrent || isTabCompleted;
                            const isFutureStep = index > currentTabIndex && !isTabCompleted;
                            
                            return (
                                <div key={tab} className="col-2">
                                    <div
                                        className={`wizard-step ${activeTab === tab ? 'active' : ''} ${currentTabIndex > index ? 'completed' : ''} ${isTabCompleted && index > currentTabIndex ? 'completed-future' : ''} ${isFutureStep ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (isClickable) {
                                                handleTabChange(tab);
                                            }
                                        }}
                                        style={{ 
                                            cursor: isClickable ? 'pointer' : 'not-allowed',
                                            opacity: isFutureStep ? 0.5 : 1
                                        }}
                                    >
                                        <div className="step-number">
                                            {(currentTabIndex > index || isTabCompleted) ? (
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
                                                        {tab === 'Prerequisites' 
                                                            ? Object.keys(answers[tab] || {}).filter(id => answers[tab][id]).length
                                                            : Object.keys(answers[tab] || {}).filter(id => answers[tab][id] !== undefined).length
                                                        }/{questions[tab].length}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Content Area */}
            {showDraftSelection ? (
                renderDraftSelection()
            ) : activeTab === 'Year Selection' ? (
                renderYearSelection()
            ) : activeTab === 'Finish' ? (
                renderFinishPage()
            ) : (
                <>
                    {/* Current Section Header */}
                    <div className="mb-4 d-no">
                        <h4 className="mb-2">{activeTab}</h4>
                        <p className="d-none">
                            Step {TAB_ORDER.indexOf(activeTab) + 1} of {TAB_ORDER.length} •
                            {currentQuestions.length} questions in this category
                        </p>
                    </div>

                    {/* Questions */}
                    <div className="questions-container">
                        {currentQuestions.map((q, qIndex) => (
                            <div 
                                key={q._id} 
                                id={`question-${q._id}`}
                                className={`question-card mb-4 ${highlightedQuestionId === q._id ? 'unanswered-highlight' : ''}`}
                            >
                                <div className="question-header">
                                    <span className="question-number">Q{globalIndexMap[q._id]}</span>
                                    <div className="question-progress">
                                        <small className="text-muted">
                                            Question {qIndex + 1} of {currentQuestions.length}
                                        </small>
                                    </div>
                                </div>

                                <div className="question-content">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="question-text flex-grow-1">{getTextDisplay(q.text, language)}</h5>
                                        <div className="d-flex align-items-center gap-2">
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
                                            {q.info_description && (
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() => {
                                                        setSelectedQuestionInfo({
                                                            question: getTextDisplay(q.text, language),
                                                            description: getTextDisplay(q.info_description, language)
                                                        });
                                                        setShowInfoModal(true);
                                                    }}
                                                    title="View additional information"
                                                >
                                                    <i className="fas fa-info-circle"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>

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
                                            {q.allow_multiple && (
                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        <i className="fas fa-info-circle me-1"></i>
                                                        You can select multiple options for this question.
                                                    </small>
                                                </div>
                                            )}
                                            <div className="row">
                                                {q.options && q.options.map((option, optIndex) => {
                                                    const currentAnswers = answers[activeTab] || {};
                                                    const answerValue = currentAnswers[q._id];
                                                    // Normalize to array: if it's a number (single selection), convert to array; if array (multiple), use as is
                                                    const selectedOptions = Array.isArray(answerValue) 
                                                        ? answerValue 
                                                        : (answerValue !== undefined ? [answerValue] : []);
                                                    const selected = selectedOptions.includes(optIndex);
                                                    const optionText = getTextDisplay(option.text, language);
                                                    const isNoneOfTheAbove = optionText?.trim().toLowerCase() === "none of the above" || 
                                                                              optionText?.trim().toLowerCase() === "tiada di atas";
                                                    return (
                                                        <div key={optIndex} className="col-md-6 mb-2">
                                                            <label htmlFor={`opt_${q._id}_${optIndex}`} className={`answer-option ${selected ? 'selected' : ''}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    id={`opt_${q._id}_${optIndex}`}
                                                                    className="form-check-input"
                                                                    checked={selected}
                                                                    onChange={() => handleOptionSelection(q._id, optIndex, q.allow_multiple, optionText)}
                                                                />
                                                                <label className="form-check-label" htmlFor={`opt_${q._id}_${optIndex}`}>
                                                                    {optionText}
                                                                </label>
                                                            </label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Navigation Buttons - Hide when showing draft selection */}
            {!showDraftSelection && activeTab !== 'Finish' && (
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
                            {activeTab !== 'Year Selection' && (
                                <button
                                    className="btn btn-outline-info ms-2"
                                    onClick={handleSaveDraft}
                                    disabled={isSavingDraft}
                                    title="Save your progress as a draft"
                                >
                                    {isSavingDraft ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save me-1"></i>
                                            Save Draft
                                        </>
                                    )}
                                </button>
                            )}
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
                                    disabled={activeTab === 'Year Selection' && !selectedYear}
                                >
                                    Next
                                    <i className="fas fa-arrow-right ms-1"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    {draftExists && (
                        <div className="row mt-2">
                            <div className="col-12">
                                <div className="alert alert-info mb-0 py-2">
                                    <i className="fas fa-info-circle me-2"></i>
                                    <small>You have a saved draft. Your progress will be automatically saved when you submit.</small>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info Description Modal */}
            {showInfoModal && selectedQuestionInfo && (
                <div 
                    className="modal fade show d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => {
                        setShowInfoModal(false);
                        setSelectedQuestionInfo(null);
                    }}
                >
                    <div 
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-info-circle me-1 text-info"></i>
                                    Additional Information
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowInfoModal(false);
                                        setSelectedQuestionInfo(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div>
                                    <div 
                                        className="text-muted"
                                        style={{ 
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: '1.6'
                                        }}
                                    >
                                        {selectedQuestionInfo.description}
                                    </div>
                                </div>
                            </div>
                           
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default QuestionSectionV2;


