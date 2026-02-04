import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';
import api from '../../utils/api';
import { hasPermission, Permission } from '../../utils/permissions';

// Helper functions for dual language support
const normalizeText = (text) => {
    // Handle null, undefined, empty string, or empty object
    if (!text || text === null || text === undefined) return { en: '', ms: '' };
    if (typeof text === 'string') {
        // Empty string returns empty dual language object
        return { en: text, ms: text };
    }
    if (typeof text === 'object') {
        // Handle empty object or object with empty values
        // IMPORTANT: Don't auto-fill from other language - preserve empty values
        const en = text.en !== undefined && text.en !== null ? String(text.en) : '';
        const ms = text.ms !== undefined && text.ms !== null ? String(text.ms) : '';
        return {
            en: en,  // Don't use || ms - preserve empty values
            ms: ms   // Don't use || en - preserve empty values
        };
    }
    return { en: '', ms: '' };
};

const getTextDisplay = (text, lang = 'en') => {
    const normalized = normalizeText(text);
    return normalized[lang] || normalized.en || '';
};

const sectionMainColors = {
    Prerequisites: '#ff9800', // orange
    Environment: '#4caf50', // green
    Social: '#2196f3',     // blue
    Governance: '#9c27b0'  // purple
};
const sectionColors = {
    Prerequisites: 'warning', // orange
    Environment: 'success', // green
    Social: 'info',     // blue
    Governance: 'primary'  // purple
};
const staticCategories = [
    { key: 'Prerequisites', label: 'Prerequisites' },
    { key: 'Environment', label: 'Environment (E)' },
    { key: 'Social', label: 'Social (S)' },
    { key: 'Governance', label: 'Governance (G)' }
];

function ManageAssessmentV2() {
    const [searchParams] = useSearchParams();
    const formId = searchParams.get('formId');
    const [activeTab, setActiveTab] = useState('Prerequisites');
    const [page, setPage] = useState(1);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [questions, setQuestions] = useState({
        Prerequisites: [],
        Environment: [],
        Social: [],
        Governance: []
    });
    const [newQuestion, setNewQuestion] = useState({
        category: 'Environment',
        subCategory: 'Emission Management',
        text: '',
        weight: 1,
        options: [{ text: '', subMark: 0 }],
        info_description: ''
    });
    const questionsPerPage = 5;
    const startIndex = (page - 1) * questionsPerPage;
    const currentQuestions = questions[activeTab].slice(startIndex, startIndex + questionsPerPage);
    const [showPreview, setShowPreview] = useState(false);
    const [editedQuestions, setEditedQuestions] = useState({});
    const [editingCardId, setEditingCardId] = useState(null);
    const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
    const sensors = useSensors(pointerSensor);
    const [draggingCategory, setDraggingCategory] = useState(null);
    const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
    const [selectedQuestionForModal, setSelectedQuestionForModal] = useState(null);
    const [formDetails, setFormDetails] = useState(null);
    const [isEditingForm, setIsEditingForm] = useState(false);
    const [editedFormData, setEditedFormData] = useState({
        title: '',
        remarks: '',
        default: false
    });
    const [savingForm, setSavingForm] = useState(false);
    const [savingQuestions, setSavingQuestions] = useState(false);

    const fetchFormDetails = useCallback(async () => {
        if (!formId) return;
        try {
            const response = await api.get(`/assessment/admin/v2/get-form-details?form_id=${formId}`);
            const data = response.data;
            console.log("Form details:", data);
            setFormDetails(data);
            // Initialize edited form data
            setEditedFormData({
                title: data.title || '',
                remarks: data.remarks || '',
                default: data.default || false
            });
        } catch (error) {
            console.error("Failed to load form details:", error);
        }
    }, [formId]);

    const fetchQuestions = useCallback(async () => {
        let query = '/assessment/admin/v2/get-all-questions-2'
        if (formId) {
            query += `?form_id=${formId}`;
        }
        try {
            const response = await api.get(query);
            const data = response.data;
            console.log("Fetched questions:", data);
            const grouped = { Prerequisites: [], Environment: [], Social: [], Governance: [] };
            if (Array.isArray(data)) {
                data.forEach(q => {
                    if (grouped[q.category]) {
                        grouped[q.category].push({ ...q, editing: false });
                    }
                });
            }
            setQuestions(grouped);
        } catch (error) {
            console.error("Failed to load questions:", error);
            if (error.response) {
                console.error("Error details:", error.response.data);
            }
        }
    }, [formId]);

    const refetchData = useCallback(async () => {
        await fetchQuestions();
        if (formId) {
            await fetchFormDetails();
        }
    }, [fetchQuestions, fetchFormDetails, formId]);

    // DEBUG: Log question count comparison when data changes
    useEffect(() => {
        if (formDetails && questions) {
            const countFromForm = formDetails.question_collection?.length || 0;
            const totalDisplayed = Object.values(questions).reduce((sum, arr) => sum + arr.length, 0);
            console.log("=== DEBUG: Question Count Comparison ===");
            console.log("Form question_collection count:", countFromForm);
            console.log("Total displayed questions:", totalDisplayed);
            console.log("Difference:", countFromForm - totalDisplayed);
            if (countFromForm !== totalDisplayed) {
                console.warn("⚠️ MISMATCH DETECTED!");
                console.warn("Form IDs:", formDetails.question_collection?.map(q => q._id || q) || []);
                const displayedIds = Object.values(questions).flat().map(q => q._id);
                console.warn("Displayed IDs:", displayedIds);
                const missingIds = formDetails.question_collection?.filter(q => {
                    const id = q._id || q;
                    return !displayedIds.includes(id);
                }) || [];
                if (missingIds.length > 0) {
                    console.warn("Missing question IDs:", missingIds);
                }
            }
            console.log("=== END DEBUG ===");
        }
    }, [formDetails, questions]);

    useEffect(() => {
        const abortController = new AbortController();
        let isMounted = true;

        // Reset form details when formId changes
        setFormDetails(null);

        console.log("Form ID:", formId);

        const fetchFormDetailsWithSignal = async () => {
            if (!formId) return;
            try {
                const response = await api.get(`/assessment/admin/v2/get-form-details?form_id=${formId}`, {
                    signal: abortController.signal
                });
                const data = response.data;
                
                // Only update state if component is still mounted
                if (isMounted) {
                    console.log("=== DEBUG: Form Details ===");
                    console.log("Form details:", data);
                    console.log("question_collection:", data.question_collection);
                    console.log("question_collection length:", data.question_collection?.length || 0);
                    if (data.question_collection && Array.isArray(data.question_collection)) {
                        console.log("question_collection IDs:", data.question_collection.map(q => q._id || q));
                    }
                    console.log("=== END DEBUG ===");
                    
                    setFormDetails(data);
                    // Initialize edited form data
                    setEditedFormData({
                        title: data.title || '',
                        remarks: data.remarks || '',
                        default: data.default || false
                    });
                }
            } catch (error) {
                // Ignore abort errors
                if (error.name === 'CanceledError' || error.name === 'AbortError') {
                    return;
                }
                if (isMounted) {
                    console.error("Failed to load form details:", error);
                }
            }
        };

        const fetchQuestionsWithSignal = async () => {
            let query = '/assessment/admin/v2/get-all-questions-2'
            if (formId) {
                query += `?form_id=${formId}`;
            }
            try {
                const response = await api.get(query, {
                    signal: abortController.signal
                });
                const data = response.data;
                
                // Only update state if component is still mounted
                if (isMounted) {
                    console.log("=== DEBUG: Questions Count Issue ===");
                    console.log("Fetched questions from API:", data);
                    console.log("Total questions from API:", Array.isArray(data) ? data.length : 0);
                    
                    const grouped = { Prerequisites: [], Environment: [], Social: [], Governance: [] };
                    const skippedQuestions = [];
                    
                    if (Array.isArray(data)) {
                        data.forEach(q => {
                            if (grouped[q.category]) {
                                grouped[q.category].push({ ...q, editing: false });
                            } else {
                                skippedQuestions.push({
                                    _id: q._id,
                                    category: q.category,
                                    text: q.text?.substring(0, 50) || 'N/A'
                                });
                            }
                        });
                    }
                    
                    const totalGrouped = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
                    console.log("Questions by category:", {
                        Prerequisites: grouped.Prerequisites.length,
                        Environment: grouped.Environment.length,
                        Social: grouped.Social.length,
                        Governance: grouped.Governance.length,
                        Total: totalGrouped
                    });
                    
                    if (skippedQuestions.length > 0) {
                        console.warn("⚠️ Questions skipped (invalid category):", skippedQuestions);
                        console.warn("Total skipped:", skippedQuestions.length);
                    }
                    
                    console.log("Total displayed questions:", totalGrouped);
                    console.log("Difference:", Array.isArray(data) ? data.length - totalGrouped : 0);
                    console.log("=== END DEBUG ===");
                    
                    setQuestions(grouped);
                }
            } catch (error) {
                // Ignore abort errors
                if (error.name === 'CanceledError' || error.name === 'AbortError') {
                    return;
                }
                if (isMounted) {
                    console.error("Failed to load questions:", error);
                    if (error.response) {
                        console.error("Error details:", error.response.data);
                    }
                }
            }
        };

        fetchQuestionsWithSignal();

        if (formId) {
            fetchFormDetailsWithSignal();
        }

        // Cleanup function to abort request if component unmounts or formId changes
        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [formId]);

    const handleSaveSubmit = async () => {
        // Check permission before allowing save
        if (!hasPermission(Permission.MANAGE_ASSESSMENTS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to manage assessments.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        setSavingQuestions(true);
        try {
            console.log("Saving changes...");
            
            // Validate ESG section totals (must equal 100)
            const esgCategories = ['Environment', 'Social', 'Governance'];
            const invalidSections = [];
            
            for (const category of esgCategories) {
                const catQuestions = questions[category];
                const totalWeights = catQuestions.reduce((sum, q) => {
                    const weight = editedQuestions[q._id]?.weight ?? q.weight;
                    return sum + (typeof weight === 'number' && !isNaN(weight) ? weight : 0);
                }, 0);
                
                // Check if total doesn't equal 100 (with small tolerance for floating point)
                if (Math.abs(totalWeights - 100) > 0.01) {
                    invalidSections.push({
                        category,
                        total: totalWeights
                    });
                }
            }
            
            // Show alert if any section doesn't total 100
            if (invalidSections.length > 0) {
                const sectionNames = {
                    'Environment': 'Environment (E)',
                    'Social': 'Social (S)',
                    'Governance': 'Governance (G)'
                };
                const errorMessages = invalidSections.map(section => 
                    `${sectionNames[section.category]}: Total = ${section.total} (must be 100)`
                ).join('<br>');
                
                await Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    html: `The following ESG sections must total 100:<br><br>${errorMessages}`,
                    confirmButtonText: 'OK'
                });
                setSavingQuestions(false);
                return; // Don't proceed with saving
            }
        
        const payloads = getEventPayloads(editedQuestions, questions);
        let somethingSaved = false;
        let hasValidationError = false;
        let hasFetchError = false;
        
        for (const payload of payloads) {
            console.log("Payload:", payload);
            if (payload._id.includes('new')) {
                // Normalize text fields to dual language format
                const normalizedText = normalizeText(payload.text);
                const normalizedSubCategory = normalizeText(payload.subCategory);
                
                // Validate all fields for all categories including Prerequisites
                if (!normalizedText.en || normalizedText.en.trim() === '' || 
                    !normalizedSubCategory.en || normalizedSubCategory.en.trim() === '' || 
                    (payload.category !== 'Prerequisites' && (payload.weight === '' || payload.weight === undefined || isNaN(payload.weight)))) {
                    hasValidationError = true;
                    console.log("Validation error:", payload);
                    continue;
                }
                // POST
                try {
                    let query = '/assessment/admin/v2/create-question-2';
                    if (formId) {
                        query += `?form_id=${formId}`;
                    }
                    const allowMultiple = payload.category !== 'Prerequisites' ? (payload.allow_multiple ?? false) : false;
                    // If allow_multiple is true and options are empty, use default prefilled options
                    let finalOptions = payload.options && payload.options.length > 0 ? payload.options.map(opt => ({
                        ...opt,
                        text: normalizeText(opt.text)
                    })) : null;
                    if (!finalOptions) {
                        if (allowMultiple) {
                            // Prefill with default options: option1, option2, option3 (subMark: 1) and None of the above (subMark: 0)
                            finalOptions = [
                                { text: { en: 'option1', ms: 'pilihan1' }, subMark: 1 },
                                { text: { en: 'option2', ms: 'pilihan2' }, subMark: 1 },
                                { text: { en: 'option3', ms: 'pilihan3' }, subMark: 1 },
                                { text: { en: 'None of the above', ms: 'Tiada di atas' }, subMark: 0 }
                            ];
                        } else {
                            finalOptions = [{ text: { en: '', ms: '' }, subMark: 0 }];
                        }
                    }
                    
                    await api.post(query, {
                        category: payload.category || 'Environment',
                        subCategory: normalizedSubCategory,
                        index: payload.index || 1,
                        text: normalizedText,
                        weight: payload.category === 'Prerequisites' ? 0 : (payload.weight || 0),
                        options: finalOptions,
                        allow_multiple: allowMultiple,
                        info_description: payload.info_description ? normalizeText(payload.info_description) : null
                    });
                    somethingSaved = true;
                } catch (error) {
                    console.error("Error creating question:", error);
                    const allowMultipleForLog = payload.category !== 'Prerequisites' ? (payload.allow_multiple ?? false) : false;
                    const normalizedText = normalizeText(payload.text);
                    const normalizedSubCategory = normalizeText(payload.subCategory);
                    let finalOptionsForLog = payload.options && payload.options.length > 0 ? payload.options.map(opt => ({
                        ...opt,
                        text: normalizeText(opt.text)
                    })) : null;
                    if (!finalOptionsForLog) {
                        if (allowMultipleForLog) {
                            finalOptionsForLog = [
                                { text: { en: 'option1', ms: 'pilihan1' }, subMark: 1 },
                                { text: { en: 'option2', ms: 'pilihan2' }, subMark: 1 },
                                { text: { en: 'option3', ms: 'pilihan3' }, subMark: 1 },
                                { text: { en: 'None of the above', ms: 'Tiada di atas' }, subMark: 0 }
                            ];
                        } else {
                            finalOptionsForLog = [{ text: { en: '', ms: '' }, subMark: 0 }];
                        }
                    }
                    console.error("Request payload:", {
                        category: payload.category || 'Environment',
                        subCategory: normalizedSubCategory,
                        index: payload.index || 1,
                        text: normalizedText,
                        weight: payload.category === 'Prerequisites' ? 0 : (payload.weight || 0),
                        options: finalOptionsForLog,
                        allow_multiple: allowMultipleForLog
                    });
                    if (error.response) {
                        console.error("Server response:", error.response.data);
                        console.error("Server status:", error.response.status);
                        if (error.response.data.detail) {
                            console.error("Validation errors:", error.response.data.detail);
                        }
                    }
                    hasFetchError = true;
                }
            } else {
                // PUT - Find the original question to merge with changes
                let originalQuestion = null;
                for (const cat of ['Environment', 'Social', 'Governance', 'Prerequisites']) {
                    originalQuestion = questions[cat].find(q => q._id === payload._id);
                    if (originalQuestion) break;
                }
                
                if (!originalQuestion) {
                    console.error("Original question not found for update:", payload._id);
                    hasFetchError = true;
                    continue;
                }
                
                // Normalize text fields to dual language format for validation
                const normalizedText = payload.text !== undefined ? normalizeText(payload.text) : normalizeText(originalQuestion.text ?? null);
                const normalizedSubCategory = payload.subCategory !== undefined ? normalizeText(payload.subCategory) : normalizeText(originalQuestion.subCategory ?? null);
                const currentWeight = payload.weight !== undefined ? payload.weight : originalQuestion.weight;
                const currentOptions = payload.options !== undefined ? payload.options : (originalQuestion.options || []);
                
                // Validate required fields before updating
                const missingFields = [];
                if (!normalizedText.en || normalizedText.en.trim() === '') {
                    missingFields.push('Statement (English)');
                }
                if (!normalizedSubCategory.en || normalizedSubCategory.en.trim() === '') {
                    missingFields.push('Indicator (English)');
                }
                if (payload.category !== 'Prerequisites') {
                    if (currentWeight === '' || currentWeight === undefined || isNaN(currentWeight)) {
                        missingFields.push('Weight');
                    }
                    if (!currentOptions || currentOptions.length === 0 || 
                        !currentOptions.some(opt => {
                            if (!opt || !opt.text) return false;
                            const optText = normalizeText(opt.text);
                            return optText.en && optText.en.trim() !== '';
                        })) {
                        missingFields.push('Options (at least one option with English text)');
                    }
                }
                
                // Skip update if validation fails
                if (missingFields.length > 0) {
                    hasValidationError = true;
                    console.log("Validation error for update:", payload._id, missingFields);
                    continue;
                }
                
                // Merge original question with changes and normalize text fields
                const updatePayload = {
                    ...originalQuestion,
                    ...payload,
                    _id: payload._id, // Ensure _id is preserved
                    // Normalize text fields to dual language format
                    text: normalizedText,
                    subCategory: normalizedSubCategory,
                    info_description: payload.info_description !== undefined 
                        ? (payload.info_description ? normalizeText(payload.info_description) : null)
                        : (originalQuestion.info_description ? normalizeText(originalQuestion.info_description ?? null) : null),
                    // Normalize options text
                    options: currentOptions.map(opt => ({
                        ...opt,
                        text: normalizeText(opt.text)
                    }))
                };
                
                try {
                    await api.get(`/assessment/admin/v2/update-form-timestamp/${formId}`);
                    await api.put(`/assessment/admin/v2/update-2/${payload._id}`, updatePayload);
                    somethingSaved = true;
                } catch (error) {
                    console.error("Error updating question:", error);
                    console.error("Update payload:", updatePayload);
                    if (error.response) {
                        console.error("Update server response:", error.response.data);
                        console.error("Update server status:", error.response.status);
                        if (error.response.data.detail) {
                            console.error("Update validation errors:", error.response.data.detail);
                        }
                    }
                    hasFetchError = true;
                }
            }
        }
        
        if (somethingSaved) {
            setEditedQuestions({});
            setEditingCardId(null);
            await Swal.fire({
                icon: 'success',
                title: 'Saved',
                text: 'Changes saved successfully',
                timer: 1200,
                showConfirmButton: false
            });
            await refetchData();
        }
        
        if (hasValidationError || hasFetchError) {
            let messages = [];
            if (hasValidationError) {
                const missingFields = [];
                payloads.forEach(payload => {
                    if (payload._id.includes('new')) {
                        const normalizedText = normalizeText(payload.text);
                        const normalizedSubCategory = normalizeText(payload.subCategory);
                        if (!normalizedText.en || normalizedText.en.trim() === '') missingFields.push('Statement (English)');
                        if (!normalizedSubCategory.en || normalizedSubCategory.en.trim() === '') missingFields.push('Indicator (English)');
                        if (payload.category !== 'Prerequisites' && (payload.weight === '' || payload.weight === undefined || isNaN(payload.weight))) missingFields.push('Weight');
                    }
                });
                const uniqueFields = [...new Set(missingFields)];
                if (uniqueFields.length > 0) {
                    messages.push(`Some new questions had incomplete fields: ${uniqueFields.join(', ')}`);
                }
            }
            if (hasFetchError) messages.push('Some questions failed to save due to server error.');
            await Swal.fire({
                icon: 'error',
                title: 'Save Issues',
                html: messages.join('<br>'),
            });
        }
        } finally {
            setSavingQuestions(false);
        }

    };


    const handleOpenSubCategoryModal = (questionId) => {
        setSelectedQuestionForModal(questionId);
        setShowSubCategoryModal(true);
    };

    const handleCloseSubCategoryModal = () => {
        setShowSubCategoryModal(false);
        setSelectedQuestionForModal(null);
    };

    const handleSubCategorySelect = (subCategory) => {
        if (selectedQuestionForModal) {
            // Convert string subcategory to dual language format
            const dualLangSubCategory = typeof subCategory === 'string' 
                ? { en: subCategory, ms: subCategory }
                : normalizeText(subCategory);
            setEditedQuestions(prev => ({
                ...prev,
                [selectedQuestionForModal]: {
                    ...prev[selectedQuestionForModal],
                    subCategory: dualLangSubCategory
                }
            }));
        }
        handleCloseSubCategoryModal();
    };

    const getQuestionCategory = (questionId) => {
        for (const category of Object.keys(questions)) {
            if (questions[category].some(q => q._id === questionId)) {
                return category;
            }
        }
        return null;
    };

    const esgCategories = ['Environment', 'Social', 'Governance'];
    const esgQuestions = esgCategories.flatMap(category =>
        questions[category].map(q => ({ ...q, category }))
    );
    const globalIndexMap = {};
    esgQuestions.forEach((q, i) => {
        globalIndexMap[q._id] = i + 1;
    });

    function handleDragEnd(cat) {
        return (event) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            setQuestions(prev => {
                const oldList = prev[cat];
                const oldIndex = oldList.findIndex(q => q._id === active.id);
                const newIndex = oldList.findIndex(q => q._id === over.id);
                if (oldIndex === -1 || newIndex === -1) return prev;
                const newList = arrayMove(oldList, oldIndex, newIndex).map((q, i) => ({ ...q, index: i + 1 }));
                // Update editedQuestions for any card whose index changed
                setEditedQuestions(prevEdited => {
                    const updated = { ...prevEdited };
                    oldList.forEach((q, i) => {
                        const newQ = newList.find(nq => nq._id === q._id);
                        if (newQ && newQ.index !== q.index) {
                            updated[q._id] = { ...updated[q._id], index: newQ.index };
                        }
                    });
                    return updated;
                });
                return { ...prev, [cat]: newList };
            });
        };
    }

    function getEventPayloads(editedQuestions, questions) {
        return Object.entries(editedQuestions).map(([id, changes]) => {
            // Find the question in any category
            let foundQ = null;
            for (const cat of ['Environment', 'Social', 'Governance', 'Prerequisites']) {
                foundQ = questions[cat].find(q => q._id === id);
                if (foundQ) break;
            }
            return { _id: id, category: foundQ ? foundQ.category : undefined, ...changes, index: foundQ ? foundQ.index : undefined };
        });
    }

    function handleAddNewQuestion(category) {
        const newId = 'new-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        setQuestions(prev => {
            const newIndex = prev[category].length + 1;
            const newQ = {
                _id: newId,
                category: category,
                subCategory: { en: '', ms: '' },
                text: { en: '', ms: '' },
                weight: category === 'Prerequisites' ? 0 : '',
                options: category === 'Prerequisites' ? [{ text: { en: '', ms: '' }, subMark: 0 }] : [
                    { text: { en: 'Yes', ms: 'Ya' }, subMark: category === 'Prerequisites' ? 0 : 1 },
                    { text: { en: 'No', ms: 'Tidak' }, subMark: 0 }
                ],
                allow_multiple: category === 'Prerequisites' ? false : false,
                info_description: { en: '', ms: '' },
                isNew: true
            };
            return {
                ...prev,
                [category]: [...prev[category], newQ]
            };
        });
        // Delay setting edit mode to allow animation
        setTimeout(() => {
            setEditingCardId(newId);
        }, 250);
    }

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'N/A';
        }
    };

    const handleEditFormToggle = () => {
        if (isEditingForm) {
            // Cancel editing - reset to original values
            setEditedFormData({
                title: formDetails?.title || '',
                remarks: formDetails?.remarks || '',
                default: formDetails?.default || false
            });
        }
        setIsEditingForm(!isEditingForm);
    };

    const handleFormDataChange = (field, value) => {
        setEditedFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveForm = async () => {
        // Check permission before allowing save
        if (!hasPermission(Permission.EDIT_ASSESSMENT_FORMS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to edit assessment forms.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        if (!editedFormData.title?.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Validation Error',
                text: 'Please enter a title',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        setSavingForm(true);
        try {
            await api.put(`/assessment/admin/v2/edit-form/${formId}`, {
                title: editedFormData.title.trim(),
                remarks: editedFormData.remarks.trim()
            });

            await Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Form details have been successfully updated.',
                timer: 2000,
                showConfirmButton: false
            });

            // Update form details and exit edit mode
            setFormDetails(prev => ({
                ...prev,
                title: editedFormData.title.trim(),
                remarks: editedFormData.remarks.trim()
            }));
            setIsEditingForm(false);
        } catch (error) {
            console.error('Failed to update form:', error);
            const errorMessage = error.response?.data?.message || error.response?.statusText || 'Please try again.';
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Failed to update form: ${errorMessage}`
            });
        } finally {
            setSavingForm(false);
        }
    };

    return (
        <div className="container-fluid">
            <Title title="Manage Assessment Form" breadcrumb={[["View Forms", "/admin/assessment/view-forms"], "Manage Assessment Form"]} />
            
            {/* Form Details Section */}
            {formId && formDetails && (
                <div className="card mb-4" style={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                }}>
                    <div className="card-header bg-dark" >
                        <div className="d-flex justify-content-between align-items-center">
                            <h3 className="text-white" style={{ fontWeight: 600 }}>
                                <i className="fas fa-file-alt me-1"></i>
                                Form Details
                            </h3>
                            <div className="d-flex align-items-center gap-2">
                                {formDetails.default && (
                                    <span className="badge bg-light text-dark">
                                        <i className="fas fa-star me-1"></i>
                                        Default Form
                                    </span>
                                )}
                                {!isEditingForm ? (
                                    <button
                                        className="btn btn-sm text-white"
                                        onClick={handleEditFormToggle}
                                        title="Edit Form Details"
                                    >
                                        <i className="fas fa-edit me-1"></i>
                                        Edit
                                    </button>
                                ) : (
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn btn-sm text-white"
                                            onClick={handleSaveForm}
                                            disabled={savingForm}
                                            title="Save Changes"
                                        >
                                            {savingForm ? (
                                                <>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-check me-1"></i>
                                                    Save
                                                </>
                                            )}
                                        </button>
                                        <button
                                            className="btn btn-sm text-white"
                                            onClick={handleEditFormToggle}
                                            disabled={savingForm}
                                            title="Cancel"
                                        >
                                            <i className="fas fa-times me-1"></i>
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="card-body" style={{ padding: '1.5rem' }}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="text-muted small mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        Form Title <span className="text-danger">*</span>
                                    </label>
                                    {isEditingForm ? (
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editedFormData.title}
                                            onChange={(e) => handleFormDataChange('title', e.target.value)}
                                            placeholder="Enter form title"
                                            disabled={savingForm}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#2c3e50' }}>
                                            {formDetails.title || 'N/A'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6 d-none">
                                <div className="mb-3">
                                    <label className="text-muted small mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        Form ID
                                    </label>
                                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: '#6c757d' }}>
                                        {formDetails._id || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="mb-3">
                                    <label className="text-muted small mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        Remarks
                                    </label>
                                    {isEditingForm ? (
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={editedFormData.remarks}
                                            onChange={(e) => handleFormDataChange('remarks', e.target.value)}
                                            placeholder="Enter remarks (optional)"
                                            disabled={savingForm}
                                        />
                                    ) : (
                                        <div style={{ 
                                            fontSize: '0.95rem', 
                                            color: '#495057',
                                            background: '#f8f9fa',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            {formDetails.remarks || 'No remarks'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label className="text-muted small mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        Questions Count
                                    </label>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#667eea' }}>
                                        {Object.values(questions).reduce((sum, arr) => sum + arr.length, 0)} questions
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label className="text-muted small mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        Created At
                                    </label>
                                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                                        {formatDate(formDetails.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="mb-3">
                                    <label className="text-muted small mb-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                        Updated At
                                    </label>
                                    <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                                        {formatDate(formDetails.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <i className="fa-solid fa-pen-to-square mb-2"></i> Double click the questions to edit
            {staticCategories.map(({ key, label }) => {
                const catQuestions = questions[key];
                
                // DEBUG: Log questions count per category
                if (catQuestions.length > 0) {
                    console.log(`[DEBUG] Category ${key}: ${catQuestions.length} questions displayed`);
                }
                
                // Sum weights, using edited value if present, only if it's a valid number
                const totalWeights = key === 'Prerequisites' ? 0 : catQuestions.reduce((sum, q) => {
                    const weight = editedQuestions[q._id]?.weight ?? q.weight;
                    return sum + (typeof weight === 'number' && !isNaN(weight) ? weight : 0);
                }, 0);
                return (
                    <div key={key} className="mb-5 position-relative">
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                borderLeft: `8px solid ${sectionMainColors[key]}`,
                                padding: '20px 28px 16px 24px',
                                marginBottom: 18,
                                position: 'relative',
                                minHeight: 80
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div style={{ fontWeight: 700, fontSize: 22 }}>{label}</div>
                                <div 
                                    className="fw-semibold" 
                                    style={{ 
                                        fontSize: 16,
                                        color: key === 'Prerequisites' ? 'inherit' : (Math.abs(totalWeights - 100) > 0.01 ? '#dc3545' : '#6c757d')
                                    }}
                                >
                                    {key === 'Prerequisites' ? '' : `Total: ${totalWeights}${Math.abs(totalWeights - 100) > 0.01 ? ' (Must be 100)' : ''}`}
                                </div>
                            </div>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={() => setDraggingCategory(key)}
                                onDragEnd={handleDragEnd(key)}
                            >
                                <SortableContext
                                    items={catQuestions.map(q => q._id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="d-flex flex-column gap-3">
                                        {catQuestions.length > 0 && catQuestions.map((q, idx) => {
                                            const isEdited = !!editedQuestions[q._id];
                                            return (
                                                <DraggableQuestion
                                                    key={q._id}
                                                    q={q}
                                                    idx={idx}
                                                    isEdited={isEdited}
                                                    editedQuestions={editedQuestions}
                                                    setEditedQuestions={setEditedQuestions}
                                                    editingCardId={editingCardId}
                                                    setEditingCardId={setEditingCardId}
                                                    sectionColor={sectionMainColors[key]}
                                                    setQuestions={setQuestions}
                                                    handleOpenSubCategoryModal={handleOpenSubCategoryModal}
                                                    showSubCategoryModal={showSubCategoryModal}
                                                    refetchData={refetchData}
                                                />
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                            {/* Floating + button */}
                            <button
                                className={`btn btn-${sectionColors[key]} shadow position-absolute`}
                                style={{
                                    right: 24,
                                    bottom: -22,
                                    borderRadius: '50%',
                                    width: 44,
                                    height: 44,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 24,
                                    zIndex: 2,
                                    color: '#fff',
                                }}
                                onClick={() => handleAddNewQuestion(key)}
                                title={`Add new question to ${key}`}
                            >
                                <i className="fa-regular fa-plus"></i>
                            </button>
                        </div>
                    </div>
                );
            })}
            <div className="d-flex justify-content-end position-fixed bottom-0 end-0 p-3">
                <button
                    className="btn btn-primary rounded-pill mt-3 me-1"
                    onClick={() => {
                        const payloads = getEventPayloads(editedQuestions, questions);
                        Swal.fire({
                            title: 'Edit Payloads',
                            html: `<pre style="text-align:left;white-space:pre-wrap;max-height:400px;overflow:auto">${JSON.stringify(payloads, null, 2)
                                }</pre>`,
                            width: 700,
                            confirmButtonText: 'Close',
                        });
                    }}
                    disabled={Object.keys(editedQuestions).length === 0}
                >
                    <i className="fa-solid fa-circle-question"></i>
                </button>
                <button
                    className="btn btn-primary rounded-pill mt-3"
                    onClick={() => Object.keys(editedQuestions).length === 0 ? Swal.fire({
                        title: 'No changes to save',
                        icon: 'info',
                        timer: 1200,
                        showConfirmButton: false
                    }) : handleSaveSubmit()}
                    disabled={savingQuestions || Object.keys(editedQuestions).length === 0}
                >
                    {savingQuestions ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-check me-1"></i>Save
                        </>
                    )}
                </button>
            </div>

            {/* SubCategory Selection Modal */}
            {showSubCategoryModal && selectedQuestionForModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Select Indicator</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseSubCategoryModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="list-group">
                                    {selectedQuestionForModal && getQuestionCategory(selectedQuestionForModal) && 
                                    subCategories[getQuestionCategory(selectedQuestionForModal)]?.map(subCategory => (
                                        <button
                                            key={subCategory}
                                            type="button"
                                            className="list-group-item list-group-item-action"
                                            onClick={() => handleSubCategorySelect(subCategory)}
                                        >
                                            {subCategory}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const subCategories = {
    "Prerequisites": [
        "Electricity Consumption",
        "Water Consumption",
        "Petrol Consumption",
        "Diesel Consumption"
    ],
    "Environment": [
        "Emission Management",
        "Energy Management",
        "Water Management",
        "Waste Management"
    ],
    "Social": [
        "Labour Practices & Standards",
        "Safety & Health",
        "Employee Benefits",
        "Corporate Social Responsibility"
    ],
    "Governance": [
        "Culture & Commitments",
        "Integrity / Anti- Corruption",
        "Risk Governance & Internal Controls",
        "Decision Making & Strategic Oversight",
        "Disclosure, Transparency & Data Protection"
    ]
}

function SortableQuestionCard({ q, idx, isEdited, editedQuestions, setEditedQuestions, editingCardId, setEditingCardId, listeners, attributes, isDragging, forwardedRef, style, sectionColor, setQuestions, handleOpenSubCategoryModal, showSubCategoryModal, refetchData }) {
    const isEditing = editingCardId === q._id;
    const cardRef = React.useRef(null);
    
    // Initialize Yes/No options when editing starts for non-Prerequisites questions
    React.useEffect(() => {
        if (isEditing && q.category !== 'Prerequisites' && !editedQuestions[q._id]) {
            const allowMultiple = q.allow_multiple ?? false;
            const currentOptions = q.options || [];
            const currentWeight = q.weight ?? 0;
            
            // Helper to check if option text matches Yes/No (handles both string and dual language)
            const isYesNoOption = (optText) => {
                const normalized = normalizeText(optText);
                return normalized.en === 'Yes' || normalized.ms === 'Ya';
            };
            const isNoOption = (optText) => {
                const normalized = normalizeText(optText);
                return normalized.en === 'No' || normalized.ms === 'Tidak';
            };
            
            // If allow_multiple is false and options aren't Yes/No, initialize them
            if (!allowMultiple && !(currentOptions.length === 2 && 
                currentOptions.some(opt => isYesNoOption(opt.text)) && 
                currentOptions.some(opt => isNoOption(opt.text)))) {
                setEditedQuestions(prev => ({
                    ...prev,
                    [q._id]: {
                        allow_multiple: false,
                        options: [
                            { text: { en: 'Yes', ms: 'Ya' }, subMark: currentWeight },
                            { text: { en: 'No', ms: 'Tidak' }, subMark: 0 }
                        ]
                    }
                }));
            }
            
            // If allow_multiple is true and options are empty or missing, initialize with default options
            if (allowMultiple && (!currentOptions || currentOptions.length === 0)) {
                setEditedQuestions(prev => ({
                    ...prev,
                    [q._id]: {
                        allow_multiple: true,
                        options: [
                            { text: { en: 'option1', ms: 'pilihan1' }, subMark: 1 },
                            { text: { en: 'option2', ms: 'pilihan2' }, subMark: 1 },
                            { text: { en: 'option3', ms: 'pilihan3' }, subMark: 1 },
                            { text: { en: 'None of the above', ms: 'Tiada di atas' }, subMark: 0 }
                        ]
                    }
                }));
            }
        }
    }, [isEditing, q._id, q.category, q.allow_multiple, q.options, q.weight, editedQuestions, setEditedQuestions]);
    
    function handleCardBlur(e) {
        if (!cardRef.current) return;
        
        // Check if the blur is caused by modal interaction
        const isModalOpen = showSubCategoryModal;
        const isModalElement = e.relatedTarget && (
            e.relatedTarget.closest('.modal') !== null ||
            e.relatedTarget.closest('.modal-dialog') !== null ||
            e.relatedTarget.closest('.modal-content') !== null ||
            e.relatedTarget.closest('.modal-body') !== null ||
            e.relatedTarget.closest('.modal-header') !== null ||
            e.relatedTarget.closest('.list-group') !== null ||
            e.relatedTarget.closest('.list-group-item') !== null
        );
        
        // Check if clicking on the "Select from List" button
        const isSelectButton = e.relatedTarget && (
            e.relatedTarget.getAttribute('data-select-indicator') === 'true' ||
            e.relatedTarget.closest('button[data-select-indicator="true"]') !== null ||
            (e.relatedTarget.closest('button') !== null &&
             (e.relatedTarget.textContent?.includes('Select from List') ||
              e.relatedTarget.closest('button')?.textContent?.includes('Select from List')))
        );
        
        // Check if clicking on the delete button (trash icon)
        const isDeleteButton = e.relatedTarget && (
            e.relatedTarget.closest('.fa-trash') !== null ||
            e.relatedTarget.closest('.text-danger.cursor-pointer') !== null ||
            e.relatedTarget.classList.contains('fa-trash') ||
            e.relatedTarget.classList.contains('text-danger')
        );
        
        // If modal is open, clicking on modal elements, clicking the select button, or clicking delete button, allow blur without validation
        if (isModalOpen || isModalElement || isSelectButton || isDeleteButton) {
            return;
        }
        
        // Check if the blur is caused by clicking outside the card
        if (!cardRef.current.contains(e.relatedTarget)) {
            // Allow blur without validation - users can clear fields during editing
            // Validation will happen when saving, not when blurring
            setEditingCardId(null);
        }
    }
    
    // Show label if new or empty fields
    const normalizedQText = normalizeText(q.text ?? null);
    const normalizedQSubCat = normalizeText(q.subCategory ?? null);
    const showEditingLabel = isEditing && (q.isNew || !normalizedQText.en || !normalizedQSubCat.en);
    
    const handleDelete = async (category, _id) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_ASSESSMENT_QUESTIONS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete assessment questions.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This question will be permanently deleted.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            confirmButtonColor: "#d33",
            cancelButtonText: 'Cancel'
        });
        if (result.isConfirmed) {
            if (_id.includes('new')) {
                setQuestions(prev => ({
                    ...prev,
                    [category]: prev[category].filter(q => q._id !== _id)
                }));
                setEditedQuestions(prev => {
                    const newEdited = { ...prev };
                    delete newEdited[_id];
                    return newEdited;
                });
                if (editingCardId === _id) {
                    setEditingCardId(null);
                }
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'The question was successfully removed.',
                    timer: 1200,
                    showConfirmButton: false
                });
            } else {
                // Existing question - delete from server
                try {
                    await api.delete(`/assessment/admin/v2/delete-2/${_id}`);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The question was successfully deleted.',
                        timer: 1200,
                        showConfirmButton: false
                    });
                    await refetchData();
                } catch (error) {
                    console.error("Delete error:", error);
                    console.error("Delete question ID:", _id);
                    if (error.response) {
                        console.error("Delete server response:", error.response.data);
                        console.error("Delete server status:", error.response.status);
                        if (error.response.data.detail) {
                            console.error("Delete validation errors:", error.response.data.detail);
                        }
                    }
                    await Swal.fire({
                        icon: 'error',
                        title: 'Delete Failed',
                        text: 'There was a problem deleting the question. Please try again.'
                    });
                }
            }
        }
    };

    const handleAddOption = () => {
        setEditedQuestions(prev => ({
            ...prev,
            [q._id]: {
                ...prev[q._id],
                options: [...(prev[q._id]?.options || q.options || []), { text: { en: '', ms: '' }, subMark: 0 }]
            }
        }));
    };

    const handleOptionChange = (optIdx, field, value) => {
        setEditedQuestions(prev => {
            // Always use edited options if they exist, otherwise use original
            // This ensures cleared values are preserved
            const currentOptions = prev[q._id]?.options !== undefined 
                ? prev[q._id].options 
                : (q.options || []);
            const updatedOptions = currentOptions.map((opt, i) =>
                i === optIdx ? { ...opt, [field]: value } : opt
            );
            return {
                ...prev,
                [q._id]: {
                    ...prev[q._id],
                    options: updatedOptions
                }
            };
        });
    };

    const handleDeleteOption = (optIdx) => {
        setEditedQuestions(prev => {
            // Always use edited options if they exist, otherwise use original
            const currentOptions = prev[q._id]?.options !== undefined 
                ? prev[q._id].options 
                : (q.options || []);
            const updatedOptions = currentOptions.filter((_, i) => i !== optIdx);
            return {
                ...prev,
                [q._id]: {
                    ...prev[q._id],
                    options: updatedOptions
                }
            };
        });
    };

    return (
        <div
            ref={node => {
                forwardedRef(node);
                cardRef.current = node;
            }}
            className={`bg-white shadow-sm rounded position-relative ${isDragging ? 'bg-info bg-opacity-25' : ''} ${isEditing ? 'card-editing' : ''}`}
            style={{
                border: isEdited ? '1.5px solid #339af0' : '1px solid #eee',
                minHeight: 70,
                padding: '16px 18px',
                ...style
            }}
            onDoubleClick={() => setEditingCardId(q._id)}
            tabIndex={-1}
            onBlur={isEditing ? handleCardBlur : undefined}
        >
            {showEditingLabel && (
                <span className="card-editing-label mb-5">Editing new question…</span>
            )}
            <div className="row align-items-center gx-2">
                <div className="col-auto">
                    <span style={{
                        display: 'inline-block',
                        background: sectionColor,
                        color: '#fff',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        lineHeight: '32px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: 16
                    }}>{idx + 1}</span>
                </div>
                <div className="col-2">
                    <div className="fw-semibold small text-muted">Indicator <span className="text-danger">*</span></div>
                    {isEditing ? (
                        <div>
                            <input
                                type="text"
                                className="form-control form-control-sm mb-1"
                                value={(() => {
                                    // If field has been edited, use edited value (even if empty)
                                    if (editedQuestions[q._id]?.subCategory !== undefined) {
                                        return getTextDisplay(editedQuestions[q._id].subCategory, 'en');
                                    }
                                    // Otherwise use original value
                                    return getTextDisplay(q.subCategory ?? null, 'en');
                                })()}
                                onChange={e => {
                                    // Get current edited value or normalize original
                                    const current = editedQuestions[q._id]?.subCategory !== undefined
                                        ? normalizeText(editedQuestions[q._id].subCategory)
                                        : normalizeText(q.subCategory ?? null);
                                    setEditedQuestions(prev => ({
                                        ...prev,
                                        [q._id]: {
                                            ...prev[q._id],
                                            subCategory: { ...current, en: e.target.value }
                                        }
                                    }));
                                }}
                                autoFocus
                                placeholder="English"
                                required
                            />
                            <input
                                type="text"
                                className="form-control form-control-sm mb-2"
                                value={(() => {
                                    // If field has been edited, use edited value (even if empty)
                                    if (editedQuestions[q._id]?.subCategory !== undefined) {
                                        return getTextDisplay(editedQuestions[q._id].subCategory, 'ms');
                                    }
                                    // Otherwise use original value
                                    return getTextDisplay(q.subCategory ?? null, 'ms');
                                })()}
                                onChange={e => {
                                    // Get current edited value or normalize original
                                    const current = editedQuestions[q._id]?.subCategory !== undefined
                                        ? normalizeText(editedQuestions[q._id].subCategory)
                                        : normalizeText(q.subCategory ?? null);
                                    setEditedQuestions(prev => ({
                                        ...prev,
                                        [q._id]: {
                                            ...prev[q._id],
                                            subCategory: { ...current, ms: e.target.value }
                                        }
                                    }));
                                }}
                                placeholder="Malay"
                                required
                            />
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm w-100"
                                onClick={() => handleOpenSubCategoryModal(q._id)}
                                data-select-indicator="true"
                            >
                                <i className="fa-solid fa-list me-1"></i>
                                Select from List
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div><strong>EN:</strong> {getTextDisplay(editedQuestions[q._id]?.subCategory ?? q.subCategory ?? null, 'en') || 'N/A'}</div>
                            <div className="small text-muted"><strong>MS:</strong> {getTextDisplay(editedQuestions[q._id]?.subCategory ?? q.subCategory ?? null, 'ms') || 'N/A'}</div>
                        </div>
                    )}
                </div>
                <div className={`col-${q.category === 'Prerequisites' ? '7' : '5'}`}>
                    <div className="fw-semibold small text-muted">Statement</div>
                    {isEditing ? (
                        <div>
                            <input
                                type="text"
                                className="form-control form-control-sm mb-1"
                                value={(() => {
                                    // If field has been edited, use edited value (even if empty)
                                    if (editedQuestions[q._id]?.text !== undefined) {
                                        return getTextDisplay(editedQuestions[q._id].text, 'en');
                                    }
                                    // Otherwise use original value
                                    return getTextDisplay(q.text ?? null, 'en');
                                })()}
                                onChange={e => {
                                    // Get current edited value or normalize original
                                    const current = editedQuestions[q._id]?.text !== undefined
                                        ? normalizeText(editedQuestions[q._id].text)
                                        : normalizeText(q.text ?? null);
                                    setEditedQuestions(prev => ({
                                        ...prev,
                                        [q._id]: {
                                            ...prev[q._id],
                                            text: { ...current, en: e.target.value }
                                        }
                                    }));
                                }}
                                placeholder="English"
                            />
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                value={(() => {
                                    // If field has been edited, use edited value (even if empty)
                                    if (editedQuestions[q._id]?.text !== undefined) {
                                        return getTextDisplay(editedQuestions[q._id].text, 'ms');
                                    }
                                    // Otherwise use original value
                                    return getTextDisplay(q.text ?? null, 'ms');
                                })()}
                                onChange={e => {
                                    // Get current edited value or normalize original
                                    const current = editedQuestions[q._id]?.text !== undefined
                                        ? normalizeText(editedQuestions[q._id].text)
                                        : normalizeText(q.text ?? null);
                                    setEditedQuestions(prev => ({
                                        ...prev,
                                        [q._id]: {
                                            ...prev[q._id],
                                            text: { ...current, ms: e.target.value }
                                        }
                                    }));
                                }}
                                placeholder="Malay"
                            />
                        </div>
                    ) : (
                        <div>
                            <div><strong>EN:</strong> {getTextDisplay(editedQuestions[q._id]?.text ?? q.text ?? null, 'en') || 'N/A'}</div>
                            <div className="small text-muted"><strong>MS:</strong> {getTextDisplay(editedQuestions[q._id]?.text ?? q.text ?? null, 'ms') || 'N/A'}</div>
                        </div>
                    )}
                </div>
                {q.category !== 'Prerequisites' && (
                    <div className="col-2">
                        <div className="fw-semibold small text-muted">Weight</div>
                        {isEditing ? (
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editedQuestions[q._id]?.weight === undefined ? (q.weight ?? '') : editedQuestions[q._id].weight}
                                onChange={e => {
                                    const newWeight = e.target.value === '' ? '' : parseFloat(e.target.value);
                                    const allowMultiple = editedQuestions[q._id]?.allow_multiple ?? q.allow_multiple ?? false;
                                    
                                    setEditedQuestions(prev => {
                                        const updated = {
                                            ...prev,
                                            [q._id]: {
                                                ...prev[q._id],
                                                weight: newWeight
                                            }
                                        };
                                        
                                        // If allow_multiple is disabled (false), update the "Yes" option's subMark
                                        if (!allowMultiple && newWeight !== '') {
                                            const currentOptions = prev[q._id]?.options || q.options || [];
                                            updated[q._id].options = currentOptions.map(opt => {
                                                const optText = normalizeText(opt.text);
                                                return (optText.en === 'Yes' || optText.ms === 'Ya')
                                                    ? { ...opt, subMark: newWeight }
                                                    : opt;
                                            });
                                        }
                                        
                                        return updated;
                                    });
                                }}
                            />
                        ) : (
                            <div>{editedQuestions[q._id]?.weight === undefined ? (q.weight ?? 'N/A') : (editedQuestions[q._id].weight === '' ? 'N/A' : editedQuestions[q._id].weight)}</div>
                        )}
                    </div>
                )}
                <div className="col-2 d-flex justify-content-between">
                    <i 
                        className="fa-solid fa-bars" 
                        {...attributes}
                        {...listeners}
                        style={{ 
                            cursor: 'grab',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    ></i>
                    <span 
                        className="text-danger cursor-pointer" 
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            // Exit edit mode first if in edit mode
                            if (isEditing) {
                                setEditingCardId(null);
                            }
                            // Small delay to ensure state updates before delete
                            setTimeout(() => {
                                handleDelete(q.category, q._id);
                            }, 0);
                        }}
                        onMouseDown={(e) => {
                            // Prevent blur event from firing when clicking delete
                            e.stopPropagation();
                        }}
                    >
                        <i className="fa-solid fa-trash"></i>
                    </span>
                </div>
            </div>
            
            {/* Options section for v2 questions */}
            {q.category !== 'Prerequisites' && (
                <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-semibold small text-muted">Options</div>
                        {isEditing && (
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id={`allow-multiple-${q._id}`}
                                    checked={editedQuestions[q._id]?.allow_multiple ?? q.allow_multiple ?? false}
                                    onChange={(e) => {
                                        const allowMultiple = e.target.checked;
                                        const currentWeight = editedQuestions[q._id]?.weight !== undefined 
                                            ? editedQuestions[q._id].weight 
                                            : (q.weight ?? 0);
                                        
                                        setEditedQuestions(prev => {
                                            const prevOptions = prev[q._id]?.options || q.options || [];
                                            // If allow_multiple is OFF (false), set to Yes/No
                                            // If allow_multiple is ON (true), allow custom multiple options
                                            let newOptions;
                                            if (!allowMultiple) {
                                                // Toggling off (allow_multiple = false): set to Yes/No
                                                newOptions = [
                                                    { text: { en: 'Yes', ms: 'Ya' }, subMark: currentWeight },
                                                    { text: { en: 'No', ms: 'Tidak' }, subMark: 0 }
                                                ];
                                            } else {
                                                // Helper to check if option is Yes/No
                                                const isYesNo = (opt) => {
                                                    const optText = normalizeText(opt.text);
                                                    return optText.en === 'Yes' || optText.ms === 'Ya';
                                                };
                                                const isNo = (opt) => {
                                                    const optText = normalizeText(opt.text);
                                                    return optText.en === 'No' || optText.ms === 'Tidak';
                                                };
                                                
                                                // Toggling on (allow_multiple = true): if previous was Yes/No or empty, use default prefilled options
                                                if (prevOptions.length === 2 && 
                                                    prevOptions.some(opt => isYesNo(opt)) && 
                                                    prevOptions.some(opt => isNo(opt))) {
                                                    // Prefill with default options: option1, option2, option3 (subMark: 1) and None of the above (subMark: 0)
                                                    newOptions = [
                                                        { text: { en: 'option1', ms: 'pilihan1' }, subMark: 1 },
                                                        { text: { en: 'option2', ms: 'pilihan2' }, subMark: 1 },
                                                        { text: { en: 'option3', ms: 'pilihan3' }, subMark: 1 },
                                                        { text: { en: 'None of the above', ms: 'Tiada di atas' }, subMark: 0 }
                                                    ];
                                                } else {
                                                    // If there are existing options, keep them; otherwise use default prefilled options
                                                    newOptions = prevOptions.length > 0 ? prevOptions : [
                                                        { text: { en: 'option1', ms: 'pilihan1' }, subMark: 1 },
                                                        { text: { en: 'option2', ms: 'pilihan2' }, subMark: 1 },
                                                        { text: { en: 'option3', ms: 'pilihan3' }, subMark: 1 },
                                                        { text: { en: 'None of the above', ms: 'Tiada di atas' }, subMark: 0 }
                                                    ];
                                                }
                                            }
                                            
                                            return {
                                                ...prev,
                                                [q._id]: {
                                                    ...prev[q._id],
                                                    allow_multiple: allowMultiple,
                                                    options: newOptions
                                                }
                                            };
                                        });
                                    }}
                                />
                                <label className="form-check-label small" htmlFor={`allow-multiple-${q._id}`}>
                                    Allow Multiple Select
                                </label>
                            </div>
                        )}
                    </div>
                    {isEditing ? (
                        <div>
                            {(() => {
                                // Always use edited options if they exist, otherwise use original
                                // This ensures cleared values are preserved
                                const currentOptions = editedQuestions[q._id]?.options !== undefined 
                                    ? editedQuestions[q._id].options 
                                    : (q.options || []);
                                return currentOptions.map((opt, optIdx) => {
                                    const allowMultiple = editedQuestions[q._id]?.allow_multiple ?? q.allow_multiple ?? false;
                                    const optText = normalizeText(opt.text);
                                    return (
                                        <div key={optIdx} className="mb-2 border rounded p-2">
                                            <div className="row g-1 mb-1">
                                                <div className="col-12">
                                                    <small className="text-muted">English:</small>
                                                    <input
                                                        className="form-control form-control-sm"
                                                        placeholder="English option text"
                                                        value={optText.en}
                                                        onChange={e => {
                                                            const newText = { en: e.target.value, ms: optText.ms };
                                                            handleOptionChange(optIdx, 'text', newText);
                                                        }}
                                                        disabled={!allowMultiple}
                                                    />
                                                </div>
                                                <div className="col-12">
                                                    <small className="text-muted">Malay:</small>
                                                    <input
                                                        className="form-control form-control-sm"
                                                        placeholder="Malay option text"
                                                        value={optText.ms}
                                                        onChange={e => {
                                                            const newText = { en: optText.en, ms: e.target.value };
                                                            handleOptionChange(optIdx, 'text', newText);
                                                        }}
                                                        disabled={!allowMultiple}
                                                    />
                                                </div>
                                            </div>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                placeholder="Sub-mark"
                                                min={0}
                                                step={0.01}
                                                value={opt.subMark}
                                                onChange={e => handleOptionChange(optIdx, 'subMark', parseFloat(e.target.value))}
                                                disabled={!allowMultiple}
                                            />
                                            {allowMultiple && (
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    type="button"
                                                    onClick={() => handleDeleteOption(optIdx)}
                                                    title="Delete option"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    );
                                });
                            })()}
                            {(editedQuestions[q._id]?.allow_multiple ?? q.allow_multiple ?? false) && (
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={handleAddOption}
                                    type="button"
                                >
                                    Add Option
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {(() => {
                                // Always use edited options if they exist, otherwise use original
                                const currentOptions = editedQuestions[q._id]?.options !== undefined 
                                    ? editedQuestions[q._id].options 
                                    : (q.options || []);
                                return currentOptions.map((opt, optIdx) => {
                                    const optText = normalizeText(opt.text);
                                    return (
                                        <div key={optIdx} className="d-flex flex-column align-items-start my-1 border rounded p-2">
                                            <div className="mb-1">
                                                <span className="badge bg-light text-dark me-1"><strong>EN:</strong> {optText.en || 'N/A'}</span>
                                                <span className="badge bg-light text-muted"><strong>MS:</strong> {optText.ms || 'N/A'}</span>
                                            </div>
                                            <span className="badge bg-info">
                                                {opt.subMark} Mark(s)
                                            </span>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>
            )}
            
            {/* Info Description section */}
            <div className="mt-3">
                <div className="fw-semibold small text-muted mb-2">Info Description</div>
                {isEditing ? (
                    <div>
                        <div className="mb-2">
                            <small className="text-muted">English:</small>
                            <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                placeholder="English description (optional)"
                                value={(() => {
                                    // If field has been edited, use edited value (even if empty)
                                    if (editedQuestions[q._id]?.info_description !== undefined) {
                                        return getTextDisplay(editedQuestions[q._id].info_description, 'en');
                                    }
                                    // Otherwise use original value
                                    return getTextDisplay(q.info_description ?? null, 'en');
                                })()}
                                onChange={e => {
                                    // Get current edited value or normalize original
                                    const current = editedQuestions[q._id]?.info_description !== undefined
                                        ? normalizeText(editedQuestions[q._id].info_description)
                                        : normalizeText(q.info_description ?? null);
                                    setEditedQuestions(prev => ({
                                        ...prev,
                                        [q._id]: {
                                            ...prev[q._id],
                                            info_description: { ...current, en: e.target.value }
                                        }
                                    }));
                                }}
                            />
                        </div>
                        <div>
                            <small className="text-muted">Malay:</small>
                            <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                placeholder="Malay description (optional)"
                                value={(() => {
                                    // If field has been edited, use edited value (even if empty)
                                    if (editedQuestions[q._id]?.info_description !== undefined) {
                                        return getTextDisplay(editedQuestions[q._id].info_description, 'ms');
                                    }
                                    // Otherwise use original value
                                    return getTextDisplay(q.info_description ?? null, 'ms');
                                })()}
                                onChange={e => {
                                    // Get current edited value or normalize original
                                    const current = editedQuestions[q._id]?.info_description !== undefined
                                        ? normalizeText(editedQuestions[q._id].info_description)
                                        : normalizeText(q.info_description ?? null);
                                    setEditedQuestions(prev => ({
                                        ...prev,
                                        [q._id]: {
                                            ...prev[q._id],
                                            info_description: { ...current, ms: e.target.value }
                                        }
                                    }));
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-muted small">
                        {(() => {
                            const desc = editedQuestions[q._id]?.info_description !== undefined 
                                ? editedQuestions[q._id].info_description 
                                : (q.info_description ?? null);
                            if (!desc) return <em>No description</em>;
                            const normalized = normalizeText(desc);
                            return (
                                <div>
                                    <div><strong>EN:</strong> {normalized.en || <em>No description</em>}</div>
                                    <div className="mt-1"><strong>MS:</strong> {normalized.ms || <em>No description</em>}</div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableQuestion({ q, idx, ...props }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: q._id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };
    
    return (
        <SortableQuestionCard
            q={q}
            idx={idx}
            {...props}
            forwardedRef={setNodeRef}
            listeners={listeners}
            attributes={attributes}
            isDragging={isDragging}
            style={style}
        />
    );
}

export default ManageAssessmentV2;