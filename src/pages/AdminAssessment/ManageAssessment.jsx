import React, { useState, useEffect } from 'react';
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
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import api from '../../utils/api';
function AdminESGAssessment() {
    const [activeTab, setActiveTab] = useState('Prerequisites');
    const [page, setPage] = useState(1);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [questions, setQuestions] = useState({
        Prerequisites: [],
        Environment: [],
        Social: [],
        Governance: []
    });
    const levelOneIndex = {
        "Prerequisites": 1,
        "Environment": 2,
        "Social": 3,
        "Governance": 4
    }
    const [newQuestion, setNewQuestion] = useState({
        category: 'Environment',
        subCategory: 'Emission Management',
        text: '',
        index: 1,
        mark: 6
    });
    const questionsPerPage = 5;
    const startIndex = (page - 1) * questionsPerPage;
    const currentQuestions = questions[activeTab].slice(startIndex, startIndex + questionsPerPage);
    useEffect(() => {
        fetchQuestions();
    }, []);
    const fetchQuestions = async () => {
        try {
            const response = await api.get('/assessment/admin/get-all-questions');
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
    }
    const handleSaveSubmit = async () => {
        const payloads = getEventPayloads(editedQuestions, questions);
        let somethingSaved = false;
        let hasValidationError = false;
        let hasFetchError = false;
        for (const payload of payloads) {
            if (payload._id.includes('new')) {
                // Validate all fields for all categories including Prerequisites
                if (!payload.text || !payload.subCategory || (payload.category !== 'Prerequisites' && (payload.mark === '' || payload.mark === undefined || isNaN(payload.mark)))) {
                    hasValidationError = true;
                    continue;
                }
                // POST
                try {
                    await api.post('/assessment/admin/create-question', {
                        category: staticCategories.find(cat => questions[cat.key].some(q => q._id === payload._id))?.key || 'Environment',
                        subCategory: payload.subCategory || 'N/A',
                        text: payload.text,
                        index: payload.index,
                        mark: payload.category === 'Prerequisites' ? 0 : (payload.mark || 0)
                    });
                    somethingSaved = true;
                } catch (error) {
                    console.error("Error creating question:", error);
                    hasFetchError = true;
                }
            } else {
                // PUT
                try {
                    await api.put(`/assessment/admin/update/v2/${payload._id}`, payload);
                    somethingSaved = true;
                } catch (error) {
                    console.error("Error updating question:", error);
                    hasFetchError = true;
                }
            }
        }
        if (somethingSaved) {
            setEditedQuestions([]);
            fetchQuestions();
            await Swal.fire({
                icon: 'success',
                title: 'Saved',
                text: 'Changes saved successfully',
                timer: 1200,
                showConfirmButton: false
            });
        }
        if (hasValidationError || hasFetchError) {
            let messages = [];
            if (hasValidationError) {
                const missingFields = [];
                payloads.forEach(payload => {
                    if (payload._id.includes('new')) {
                        if (!payload.text) missingFields.push('Statement');
                        if (!payload.subCategory) missingFields.push('Indicator');
                        if (payload.category !== 'Prerequisites' && (payload.mark === '' || payload.mark === undefined || isNaN(payload.mark))) missingFields.push('Mark');
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
    };
    const handleTextChange = (category, id, newText) => {
        setQuestions(prev => ({
            ...prev,
            [category]: prev[category].map(q => q._id === id ? { ...q, text: newText } : q)
        }));
    };
    const handleTabChange = tab => {
        setActiveTab(tab);
        setPage(1);
    };
    const esgCategories = ['Environment', 'Social', 'Governance'];
    const esgQuestions = esgCategories.flatMap(category =>
        questions[category].map(q => ({ ...q, category }))
    );
    const globalIndexMap = {};
    esgQuestions.forEach((q, i) => {
        globalIndexMap[q._id] = i + 1;
    });
    const [showPreview, setShowPreview] = useState(false);
    const [editedQuestions, setEditedQuestions] = useState({});
    const [editingCardId, setEditingCardId] = useState(null);
    const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
    const sensors = useSensors(pointerSensor);
    const [draggingCategory, setDraggingCategory] = useState(null);
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
                subCategory: subCategories[category]?.[0] || 'N/A',
                text: 'N/A',
                index: newIndex,
                mark: category === 'Prerequisites' ? 0 : 0,
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
    const staticCategories = [
        { key: 'Prerequisites', label: 'Prerequisites' },
        { key: 'Environment', label: 'Environment (E)' },
        { key: 'Social', label: 'Social (S)' },
        { key: 'Governance', label: 'Governance (G)' }
    ];
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
    return (
        <div className="container-fluid">
            <Title title="Manage Assessment Form" breadcrumb={[["Assessment", "/assessment"], "Manage Assessment Form"]} />
            <i className="fa-solid fa-pen-to-square mb-2"></i> Double click the questions to edit
            {staticCategories.map(({ key, label }) => {
                const catQuestions = questions[key];
                // Sum marks, using edited value if present, only if it's a valid number
                const totalMarks = key === 'Prerequisites' ? 0 : catQuestions.reduce((sum, q) => {
                    const mark = editedQuestions[q._id]?.mark ?? q.mark;
                    return sum + (typeof mark === 'number' && !isNaN(mark) ? mark : 0);
                }, 0);
                return (
                    <div key={key} className="mb-5 position-relative">
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 16,
                                //boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                                borderLeft: `8px solid ${sectionMainColors[key]}`,
                                padding: '20px 28px 16px 24px',
                                marginBottom: 18,
                                position: 'relative',
                                minHeight: 80
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div style={{ fontWeight: 700, fontSize: 22 }}>{label}</div>
                                <div className="text-secondary fw-semibold" style={{ fontSize: 16 }}>
                                    {key === 'Prerequisites' ? '' : `Total: ${totalMarks}`}
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
                                    <TransitionGroup className="d-flex flex-column gap-3">
                                        {catQuestions.length > 0 && catQuestions.map((q, idx) => {
                                            const isEdited = !!editedQuestions[q._id];
                                            return (
                                                <CSSTransition
                                                    key={q._id}
                                                    timeout={350}
                                                    classNames="fade-slide"
                                                >
                                                    <DraggableQuestion
                                                        q={q}
                                                        idx={idx}
                                                        isEdited={isEdited}
                                                        editedQuestions={editedQuestions}
                                                        setEditedQuestions={setEditedQuestions}
                                                        editingCardId={editingCardId}
                                                        setEditingCardId={setEditingCardId}
                                                        sectionColor={sectionMainColors[key]}
                                                        setQuestions={setQuestions}
                                                    />
                                                </CSSTransition>
                                            );
                                        })}
                                        {/* {catQuestions.length === 0 &&
                                                <div className="text-center text-muted">
                                                    No questions found
                                                </div>
                                            } */}
                                    </TransitionGroup>
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
                                    //background: sectionColors[key],
                                    color: '#fff',
                                    //border: `2px solid ${sectionColors[key]}`
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
                >
                    <i className="fa-solid fa-check me-1"></i>Save
                </button>
            </div>
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
function SortableQuestionCard({ q, idx, isEdited, editedQuestions, setEditedQuestions, editingCardId, setEditingCardId, listeners, attributes, isDragging, forwardedRef, style, sectionColor, setQuestions }) {
    const isEditing = editingCardId === q._id;
    const cardRef = React.useRef(null);
    function handleCardBlur(e) {
        if (!cardRef.current) return;
        if (!cardRef.current.contains(e.relatedTarget)) {
            setEditingCardId(null);
        }
    }
    // Show label if new or empty fields
    const showEditingLabel = isEditing && (q.isNew || !q.text || !q.subCategory);
    const handleDelete = async (category, _id) => {
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
                    await api.delete(`/assessment/admin/delete/${_id}`);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The question was successfully deleted.',
                        timer: 1200,
                        showConfirmButton: false
                    });
                    window.location.reload();
                } catch (error) {
                    console.error("Delete error:", error);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Delete Failed',
                        text: 'There was a problem deleting the question. Please try again.'
                    });
                }
            }
        }
    };
    return (
        <div
            ref={node => {
                forwardedRef(node);
                cardRef.current = node;
            }}
            {...attributes}
            {...listeners}
            className={`bg-white shadow-sm rounded position-relative ${isDragging ? 'bg-info bg-opacity-25' : ''} ${isEditing ? 'card-editing' : ''}`}
            style={{
                border: isEdited ? '1.5px solid #339af0' : '1px solid #eee',
                minHeight: 70,
                cursor: 'grab',
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
                    <div className="fw-semibold small text-muted">Indicator</div>
                    {isEditing ? (
                        <>
                            {/* Default Drodown */}
                            <div className="dropdown">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    id="dropdownMenuButton"
                                    data-bs-toggle="dropdown"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                    value={editedQuestions[q._id]?.subCategory ?? q.subCategory ?? ''}
                                    onChange={e => {
                                        setEditedQuestions(prev => ({
                                            ...prev,
                                            [q._id]: {
                                                ...prev[q._id],
                                                subCategory: e.target.value
                                            }
                                        }));
                                    }}
                                    autoFocus
                                />
                                <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                    {subCategories[q.category].map(subCategory => (
                                        <a className="dropdown-item" onClick={() => {
                                            setEditedQuestions(prev => ({
                                                ...prev,
                                                [q._id]: {
                                                    ...prev[q._id],
                                                    subCategory: subCategory
                                                }
                                            }));
                                        }}>
                                            {subCategory}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>{editedQuestions[q._id]?.subCategory ?? q.subCategory ?? 'N/A'}</div>
                    )}
                </div>
                <div className={`col-${q.category === 'Prerequisites' ? '7' : '5'}`}>
                    <div className="fw-semibold small text-muted">Statement</div>
                    {isEditing ? (
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editedQuestions[q._id]?.text ?? q.text ?? ''}
                            onChange={e => {
                                setEditedQuestions(prev => ({
                                    ...prev,
                                    [q._id]: {
                                        ...prev[q._id],
                                        text: e.target.value
                                    }
                                }));
                            }}
                        />
                    ) : (
                        <div>{editedQuestions[q._id]?.text ?? q.text ?? 'N/A'}</div>
                    )}
                </div>
                {q.category !== 'Prerequisites' && (
                    <div className="col-2">
                        <div className="fw-semibold small text-muted">Mark</div>
                        {isEditing ? (
                            <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editedQuestions[q._id]?.mark === undefined ? (q.mark ?? '') : editedQuestions[q._id].mark}
                                onChange={e => {
                                    setEditedQuestions(prev => ({
                                        ...prev,
                                        [q._id]: {
                                            ...prev[q._id],
                                            mark: e.target.value === '' ? '' : parseInt(e.target.value)
                                        }
                                    }));
                                }}
                            />
                        ) : (
                            <div>{editedQuestions[q._id]?.mark === undefined ? (q.mark ?? 'N/A') : (editedQuestions[q._id].mark === '' ? 'N/A' : editedQuestions[q._id].mark)}</div>
                        )}
                    </div>
                )}
                <div className="col-2 d-flex justify-content-between">
                    <i className="fa-solid fa-bars"></i>
                    <span className="text-danger" onClick={() => handleDelete(q.category, q._id)}>
                        <i className="fa-solid fa-trash"></i>
                    </span>
                </div>
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
export default AdminESGAssessment;
