import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import Swal from 'sweetalert2';
import api, { API_BASE } from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSyncAlt } from 'react-icons/fa';
import { hasPermission, Permission } from '../../utils/permissions';
import './ManageAchievements.css';


const ManageAchievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'environmental',
        difficulty: 'bronze',
        icon_class: '',
        color: 'primary',
        criteria: '',
        
        // NEW: Assessment-based criteria fields
        criteria_type: 'threshold',
        comparison_method: 'current_year',
        target_value: 0,
        improvement_threshold: 0,
        combination_threshold: 0,
        combination_improvement: 0,
        
        measurement_unit: 'percentage',
        time_period: 'annual',
        metric_name: '',
        is_active: true
    });

    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [loadingMetrics, setLoadingMetrics] = useState(true);
    const [metricsError, setMetricsError] = useState(null);

    const achievementTypes = [
        { value: 'environmental', label: 'Environmental' },
        { value: 'social', label: 'Social' },
        { value: 'governance', label: 'Governance' },
        { value: 'general', label: 'General' }
    ];

    const difficulties = [
        { value: 'bronze', label: 'Bronze', color: '#cd7f32' },
        { value: 'silver', label: 'Silver', color: '#c0c0c0' },
        { value: 'gold', label: 'Gold', color: '#ffd700' },
        { value: 'platinum', label: 'Platinum', color: '#e5e4e2' }
    ];

    // NEW: Criteria type options
    const criteriaTypes = [
        { value: 'threshold', label: 'Threshold (Score ≥ X%)', description: 'Achieve a minimum score' },
        { value: 'improvement', label: 'Improvement (≥ X% better)', description: 'Improve score from previous year' },
        { value: 'combination', label: 'Combination (Score ≥ X% AND improve ≥ Y%)', description: 'Both threshold and improvement' }
    ];

    // NEW: Comparison method options
    const comparisonMethods = [
        { value: 'current_year', label: 'Current Year', description: 'Compare against fixed threshold' },
        { value: 'year_over_year', label: 'Year over Year', description: 'Compare current vs previous year' }
    ];

    const colors = [
        { value: 'primary', label: 'Primary', class: 'text-primary' },
        { value: 'success', label: 'Success', class: 'text-success' },
        { value: 'info', label: 'Info', class: 'text-info' },
        { value: 'warning', label: 'Warning', class: 'text-warning' },
        { value: 'danger', label: 'Danger', class: 'text-danger' },
        { value: 'secondary', label: 'Secondary', class: 'text-secondary' }
    ];

    const measurementUnits = [
        { value: 'percentage', label: 'Percentage (%)' },
        { value: 'count', label: 'Count (number)' },
        { value: 'score', label: 'Score (0-100)' },
        { value: 'currency', label: 'Currency (RM)' }
    ];

    const timePeriods = [
        { value: 'annual', label: 'Annual' }
    ];

    const iconSuggestions = [
        'fa-solid fa-leaf',
        'fa-solid fa-recycle',
        'fa-solid fa-solar-panel',
        'fa-solid fa-water',
        'fa-solid fa-seedling',
        'fa-solid fa-users',
        'fa-solid fa-handshake',
        'fa-solid fa-heart',
        'fa-solid fa-graduation-cap',
        'fa-solid fa-chart-line',
        'fa-solid fa-award',
        'fa-solid fa-trophy',
        'fa-solid fa-star',
        'fa-solid fa-crown',
        'fa-solid fa-gem'
    ];

    useEffect(() => {
        // Add a small delay to ensure the component is fully mounted
        const timer = setTimeout(() => {
            fetchAchievements();
            fetchAvailableMetrics();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    const fetchAchievements = async () => {
        try {
            setLoading(true);
            
            const response = await api.get('/achievements/');
            const data = response.data;
            console.log('Achievements fetched successfully:', data);
            setAchievements(data);
        } catch (error) {
            console.error('Error fetching achievements:', error);
            if (error.message.includes('Cannot connect to backend server')) {
                Swal.fire('Connection Error', 'Cannot connect to the backend server. Please ensure the server is running.', 'error');
            } else {
                Swal.fire('Error', error.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableMetrics = async () => {
        try {
            setLoadingMetrics(true);
            setMetricsError(null);

            const response = await api.get('/achievements/metrics');
            const data = response.data;
            setAvailableMetrics(data);
            
            if (data.length === 0) {
                setMetricsError('No ESG metrics found. The system will create default metrics automatically on startup.');
            }
            
        } catch (error) {
            console.error('Error fetching metrics:', error);
            setMetricsError(`Error loading metrics: ${error.message}`);
            
            // Provide helpful guidance
            if (error.message.includes('Failed to fetch')) {
                setMetricsError('Cannot connect to backend. Please ensure the server is running.');
            }
        } finally {
            setLoadingMetrics(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'environmental',
            difficulty: 'bronze',
            icon_class: '',
            color: 'primary',
            criteria: '',
            
            // NEW: Assessment-based criteria fields
            criteria_type: 'threshold',
            comparison_method: 'current_year',
            target_value: 0,
            improvement_threshold: 0,
            combination_threshold: 0,
            combination_improvement: 0,
            
            measurement_unit: 'percentage',
            time_period: 'annual',
            metric_name: '',
            is_active: true
        });
        setEditingAchievement(null);
        setShowForm(false);
    };

    const createNewAchievement = () => {
        setEditingAchievement(null); // Clear editing state
        setFormData({
            name: '',
            description: '',
            type: 'environmental',
            difficulty: 'bronze',
            icon_class: '',
            color: 'primary',
            criteria: '',
            
            // NEW: Assessment-based criteria fields
            criteria_type: 'threshold',
            comparison_method: 'current_year',
            target_value: 0,
            improvement_threshold: 0,
            combination_threshold: 0,
            combination_improvement: 0,
            
            measurement_unit: 'percentage',
            time_period: 'annual',
            metric_name: '',
            is_active: true
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // NEW: Validate form data consistency
        if (!validateFormData()) {
            return;
        }
        
        try {
            const url = editingAchievement 
                ? '/achievements/' + (editingAchievement._id || editingAchievement.id)
                : '/achievements/';
            
            const method = editingAchievement ? 'put' : 'post';
            const response = await api[method](url, formData);

            Swal.fire(
                'Success!',
                editingAchievement 
                    ? 'Achievement updated successfully!' 
                    : 'Achievement created successfully!',
                'success'
            );
            resetForm();
            fetchAchievements();
        } catch (error) {
            console.error('Error saving achievement:', error);
            Swal.fire('Error', 'Failed to save achievement', 'error');
        }
    };

    // NEW: Form validation function
    const validateFormData = () => {
        const { criteria_type, target_value, improvement_threshold, combination_threshold, combination_improvement } = formData;
        
        // Validate threshold criteria
        if (criteria_type === 'threshold') {
            if (!target_value || target_value <= 0 || target_value > 100) {
                Swal.fire('Validation Error', 'Target value must be between 0 and 100 for threshold criteria.', 'error');
                return false;
            }
        }
        
        // Validate improvement criteria
        if (criteria_type === 'improvement') {
            if (!improvement_threshold || improvement_threshold <= 0 || improvement_threshold > 100) {
                Swal.fire('Validation Error', 'Improvement threshold must be between 0 and 100 for improvement criteria.', 'error');
                return false;
            }
        }
        
        // Validate combination criteria
        if (criteria_type === 'combination') {
            if (!combination_threshold || combination_threshold <= 0 || combination_threshold > 100) {
                Swal.fire('Validation Error', 'Combination threshold must be between 0 and 100 for combination criteria.', 'error');
                return false;
            }
            if (!combination_improvement || combination_improvement <= 0 || combination_improvement > 100) {
                Swal.fire('Validation Error', 'Combination improvement must be between 0 and 100 for combination criteria.', 'error');
                return false;
            }
        }
        
        return true;
    };

    const handleEdit = (achievement) => {
        setEditingAchievement(achievement);
        setFormData({
            name: achievement.name,
            description: achievement.description,
            type: achievement.type,
            difficulty: achievement.difficulty,
            icon_class: achievement.icon_class,
            color: achievement.color,
            criteria: achievement.criteria,
            
            // NEW: Assessment-based criteria fields
            criteria_type: achievement.criteria_type || 'threshold',
            comparison_method: achievement.comparison_method || 'current_year',
            target_value: achievement.target_value || 0,
            improvement_threshold: achievement.improvement_threshold || 0,
            combination_threshold: achievement.combination_threshold || 0,
            combination_improvement: achievement.combination_improvement || 0,
            
            measurement_unit: achievement.measurement_unit,
            time_period: achievement.time_period,
            metric_name: achievement.metric_name,
            is_active: achievement.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (achievementId) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_CONTENT)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete achievements.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete('/achievements/' + achievementId);
                Swal.fire('Deleted!', 'Achievement has been deleted.', 'success');
                fetchAchievements();
            } catch (error) {
                console.error('Error deleting achievement:', error);
                Swal.fire('Error', 'Failed to delete achievement', 'error');
            }
        }
    };



    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Manage Achievements" breadcrumb={[["Admin", "/admin"], "Manage Achievements"]} />
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading achievements...</p>
                    <small className="text-muted">This may take a few seconds if the backend is starting up.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Manage Achievements" breadcrumb={[["Admin", "/admin"], "Manage Achievements"]} />
            
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-end">
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={fetchAchievements}
                                disabled={loading}
                            >
                                <FaSyncAlt className={`me-1 ${loading ? 'fa-spin' : ''}`} />
                                Refresh
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={createNewAchievement}
                            >
                                <FaPlus className="me-1" />
                                Add Achievement
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Achievement Form */}
            {showForm && (
                <div className="row mb-4">
                    <div className="col-12">
                        {/* NEW: Example achievements guide */}
                        <div className="border-secondary mb-3">
                            <div className="">
                                <h4 className="card-title text-dark fw-bold mb-4">
                                    <i className="fas fa-lightbulb me-3 text-warning" style={{ fontSize: '1.5rem' }}></i>
                                    Example Achievement Types
                                </h4>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="shadow rounded p-3 bg-white">
                                            <h6 className="text-success">🌱 Threshold Achievement</h6>
                                            <small className="text-muted">
                                                <strong>Environmental Champion:</strong><br/>
                                                • Criteria Type: Threshold<br/>
                                                • Target: Environmental Score ≥80%<br/>
                                                • Comparison: Current Year<br/>
                                                <em>"Achieve excellent environmental performance"</em>
                                            </small>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="shadow rounded p-3 bg-white">
                                            <h6 className="text-primary">📈 Improvement Achievement</h6>
                                            <small className="text-muted">
                                                <strong>ESG Rising Star:</strong><br/>
                                                • Criteria Type: Improvement<br/>
                                                • Improvement: Overall Score ≥20%<br/>
                                                • Comparison: Year over Year<br/>
                                                <em>"Show significant year-over-year improvement"</em>
                                            </small>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="shadow rounded p-3 bg-white">
                                            <h6 className="text-warning">🏆 Combination Achievement</h6>
                                            <small className="text-muted">
                                                <strong>Governance Master:</strong><br/>
                                                • Criteria Type: Combination<br/>
                                                • Threshold: Governance Score ≥75%<br/>
                                                • Improvement: ≥15% better<br/>
                                                <em>"Maintain high standards AND improve"</em>
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <div className="card-header">
                                <h5 className="">
                                    {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
                                </h5>
                            </div>
                            <div className="">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Type *</label>
                                                <select
                                                    className="form-select"
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    {achievementTypes.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Difficulty Level *</label>
                                                <select
                                                    className="form-select"
                                                    name="difficulty"
                                                    value={formData.difficulty}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    {difficulties.map(diff => (
                                                        <option key={diff.value} value={diff.value}>
                                                            {diff.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Icon Class *</label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="icon_class"
                                                        value={formData.icon_class}
                                                        onChange={handleInputChange}
                                                        placeholder="fa-solid fa-leaf"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary dropdown-toggle"
                                                        data-bs-toggle="dropdown"
                                                    >
                                                        Icons
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        {iconSuggestions.map(icon => (
                                                            <li key={icon}>
                                                                <button
                                                                    type="button"
                                                                    className="dropdown-item"
                                                                    onClick={() => setFormData(prev => ({ ...prev, icon_class: icon }))}
                                                                >
                                                                    <i className={icon}></i> {icon}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Color *</label>
                                                <select
                                                    className="form-select"
                                                    name="color"
                                                    value={formData.color}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    {colors.map(color => (
                                                        <option key={color.value} value={color.value}>
                                                            {color.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Description *</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Criteria *</label>
                                        <textarea
                                            className="form-control"
                                            name="criteria"
                                            value={formData.criteria}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="e.g., Complete 5 environmental assessments with score above 80%"
                                            required
                                        />
                                    </div>

                                    {/* NEW: Assessment-based criteria section */}
                                    <div className="card bg-light mb-3">
                                        <div className="card-body">
                                            <h6 className="card-title">
                                                <i className="fas fa-cog me-1"></i>
                                                Assessment-Based Criteria
                                            </h6>
                                            <p className="card-text text-muted mb-3">
                                                Define how users can earn this achievement based on their ESG assessment performance.
                                            </p>

                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Criteria Type *</label>
                                                        <select
                                                            className="form-select"
                                                            name="criteria_type"
                                                            value={formData.criteria_type}
                                                            onChange={handleInputChange}
                                                            required
                                                        >
                                                            {criteriaTypes.map(type => (
                                                                <option key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <small className="text-muted">
                                                            {criteriaTypes.find(t => t.value === formData.criteria_type)?.description}
                                                        </small>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="mb-3">
                                                        <label className="form-label">Comparison Method *</label>
                                                        <select
                                                            className="form-select"
                                                            name="comparison_method"
                                                            value={formData.comparison_method}
                                                            onChange={handleInputChange}
                                                            required
                                                        >
                                                            {comparisonMethods.map(method => (
                                                                <option key={method.value} value={method.value}>
                                                                    {method.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <small className="text-muted">
                                                            {comparisonMethods.find(m => m.value === formData.comparison_method)?.description}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic fields based on criteria type */}
                                            {formData.criteria_type === 'threshold' && (
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Target Value *</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                name="target_value"
                                                                value={formData.target_value}
                                                                onChange={handleInputChange}
                                                                min="0"
                                                                max="100"
                                                                step="0.1"
                                                                required
                                                            />
                                                            <small className="text-muted">
                                                                Minimum score required (e.g., 80 for 80%)
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.criteria_type === 'improvement' && (
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="mb-3">
                                                            <label className="form-label">Improvement Threshold *</label>
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                name="improvement_threshold"
                                                                value={formData.improvement_threshold}
                                                                onChange={handleInputChange}
                                                                min="0"
                                                                max="100"
                                                                step="0.1"
                                                                required
                                                            />
                                                            <small className="text-muted">
                                                                Minimum improvement required (e.g., 20 for 20% better than last year)
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.criteria_type === 'combination' && (
                                                <>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Score Threshold *</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    name="combination_threshold"
                                                                    value={formData.combination_threshold}
                                                                    onChange={handleInputChange}
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.1"
                                                                    required
                                                                />
                                                                <small className="text-muted">
                                                                    Minimum score required (e.g., 75 for 75%)
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <div className="mb-3">
                                                                <label className="form-label">Improvement Required *</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    name="combination_improvement"
                                                                    value={formData.combination_improvement}
                                                                    onChange={handleInputChange}
                                                                    min="0"
                                                                    max="100"
                                                                    step="0.1"
                                                                    required
                                                                />
                                                                <small className="text-muted">
                                                                    Minimum improvement required (e.g., 15 for 15% better)
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Help text for comparison method */}
                                            {formData.comparison_method === 'year_over_year' && (
                                                <div className="alert alert-info">
                                                    <i className="fas fa-info-circle me-1"></i>
                                                    <strong>Year-over-Year Comparison:</strong> This achievement will compare the user's current year assessment score with their previous year score to calculate improvement.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Measurement Unit *</label>
                                                <select
                                                    className="form-select"
                                                    name="measurement_unit"
                                                    value={formData.measurement_unit}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    {measurementUnits.map(unit => (
                                                        <option key={unit.value} value={unit.value}>
                                                            {unit.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Time Period *</label>
                                                <select
                                                    className="form-select"
                                                    name="time_period"
                                                    value={formData.time_period}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    {timePeriods.map(period => (
                                                        <option key={period.value} value={period.value}>
                                                            {period.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="metric_name" className="form-label">
                                                    Metric Name* <span className="text-muted">(What this achievement tracks)</span>
                                                </label>
                                                <select
                                                    className={`form-select ${loadingMetrics ? 'is-loading' : ''} ${metricsError ? 'is-invalid' : ''}`}
                                                    name="metric_name"
                                                    value={formData.metric_name}
                                                    onChange={handleInputChange}
                                                    required
                                                    disabled={loadingMetrics}
                                                >
                                                    <option value="">Select a metric</option>
                                                    {availableMetrics.map(metric => (
                                                        <option key={metric.id} value={metric.name}>
                                                            {metric.display_name} ({metric.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                                
                                                {/* Helpful guidance */}
                                                {!loadingMetrics && availableMetrics.length === 0 && (
                                                    <div className="alert alert-info mt-2">
                                                        <strong>No metrics available yet.</strong> The system will automatically create default ESG metrics when it starts up. 
                                                        <br />
                                                        <small className="text-muted">
                                                            Available metrics include: environmental_score, social_score, governance_score, total_score, 
                                                            carbon_reduction, green_initiatives, waste_reduction, and more.
                                                        </small>
                                                    </div>
                                                )}
                                                
                                                {/* Error message */}
                                                {metricsError && (
                                                    <div className="alert alert-warning mt-2">
                                                        <strong>Metrics Loading Issue:</strong> {metricsError}
                                                        <br />
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-sm btn-outline-warning mt-2"
                                                            onClick={fetchAvailableMetrics}
                                                        >
                                                            <FaSyncAlt className="me-1" />
                                                            Retry Loading Metrics
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {/* Loading state */}
                                                {loadingMetrics && (
                                                    <div className="text-muted mt-2">
                                                        <small>Loading available metrics...</small>
                                                    </div>
                                                )}
                                                
                                                {/* Help text */}
                                                <div className="form-text">
                                                    Choose the ESG metric this achievement will track. Assessment-based metrics (like environmental_score) 
                                                    automatically unlock based on assessment performance.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        name="is_active"
                                                        checked={formData.is_active}
                                                        onChange={handleInputChange}
                                                    />
                                                    <label className="form-check-label">
                                                        Active (visible to users)
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-primary">
                                            {editingAchievement ? 'Update' : 'Create'} Achievement
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary"
                                            onClick={resetForm}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Achievements List */}
            <div className="row">
                <div className="col-12">
                    <div className="">
                        <div className="">
                            {achievements.length === 0 ? (
                                <div className="text-center p-4">
                                    <div className="mb-3">
                                        <i className="fa-solid fa-trophy text-muted" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                    <h5 className="text-muted">No Achievements Found</h5>
                                    <p className="text-muted">Get started by creating your first achievement badge!</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={createNewAchievement}
                                    >
                                        <FaPlus className="me-1" />
                                        Create First Achievement
                                    </button>
                                </div>
                            ) : (
                                <div className="">
                                    <table className="table  table-hover">
                                        <thead>
                                            <tr>
                                                <th>Badge</th>
                                                <th>Name & Description</th>
                                                <th>Type</th>
                                                <th>Difficulty</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {achievements.map(achievement => (
                                                <tr key={achievement._id || achievement.id}>
                                                    <td>
                                                        <div className="achievement-badge-preview">
                                                            <i 
                                                                className={`${achievement.icon_class} text-${achievement.color}`}
                                                                style={{ fontSize: '2rem' }}
                                                            ></i>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>
                                                            <strong>{achievement.name}</strong>
                                                            <br />
                                                            <small className="text-muted">{achievement.description}</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${achievement.type === 'environmental' ? 'success' : achievement.type === 'social' ? 'info' : achievement.type === 'governance' ? 'warning' : 'secondary'}`}>
                                                            {achievement.type.charAt(0).toUpperCase() + achievement.type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span 
                                                            className="badge"
                                                            style={{ 
                                                                backgroundColor: difficulties.find(d => d.value === achievement.difficulty)?.color || '#6c757d',
                                                                color: achievement.difficulty === 'gold' ? '#000' : '#fff'
                                                            }}
                                                        >
                                                            {achievement.difficulty.charAt(0).toUpperCase() + achievement.difficulty.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm icon-btn text-primary"
                                                                onClick={() => handleEdit(achievement)}
                                                                title="Edit"
                                                            >
                                                                <FaEdit />
                                                            </button>
                                                            {hasPermission(Permission.DELETE_CONTENT) && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger icon-btn"
                                                                    onClick={() => handleDelete(achievement._id || achievement.id)}
                                                                    title="Delete"
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageAchievements; 