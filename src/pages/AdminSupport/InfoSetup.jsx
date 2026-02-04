import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import { FaTrashAlt, FaEdit, FaPlus, FaSave, FaTimes, FaBuilding, FaIndustry, FaChartBar, FaArrowUp, FaArrowDown, FaCheck, FaTimes as FaX } from 'react-icons/fa';
import api from '../../utils/api';
import Swal from 'sweetalert2';

function InfoSetup() {
    const [settings, setSettings] = useState({
        sector: { items: [] },
        industry: { items: [] },
        business_size: { items: [] }
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sector');
    const [editingItems, setEditingItems] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newItemValue, setNewItemValue] = useState('');
    const [newItemLabel, setNewItemLabel] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/info-settings/admin');
            const settingsData = response.data.settings || [];
            
            const settingsMap = {
                sector: { items: [] },
                industry: { items: [] },
                business_size: { items: [] }
            };

            settingsData.forEach(setting => {
                if (settingsMap[setting.setting_type]) {
                    settingsMap[setting.setting_type] = setting;
                }
            });

            setSettings(settingsMap);
        } catch (error) {
            console.error("Failed to fetch info settings:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load info settings.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditingItems([...settings[activeTab].items].map((item, index) => ({
            ...item,
            order: index
        })));
        setNewItemValue('');
        setNewItemLabel('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingItems([]);
        setNewItemValue('');
        setNewItemLabel('');
    };

    const handleAddItem = () => {
        if (!newItemValue.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Required Field',
                text: 'Please enter a value.',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        const newItem = {
            value: newItemValue.trim(),
            label: newItemLabel.trim() || newItemValue.trim(),
            order: editingItems.length,
            is_active: true
        };

        setEditingItems([...editingItems, newItem]);
        setNewItemValue('');
        setNewItemLabel('');
    };

    const handleRemoveItem = (index) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to remove this item?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, remove it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = editingItems.filter((_, i) => i !== index);
                setEditingItems(updated.map((item, idx) => ({ ...item, order: idx })));
            }
        });
    };

    const handleToggleActive = (index) => {
        const updated = [...editingItems];
        updated[index].is_active = !updated[index].is_active;
        setEditingItems(updated);
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const updated = [...editingItems];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        updated[index - 1].order = index - 1;
        updated[index].order = index;
        setEditingItems(updated);
    };

    const handleMoveDown = (index) => {
        if (index === editingItems.length - 1) return;
        const updated = [...editingItems];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        updated[index].order = index;
        updated[index + 1].order = index + 1;
        setEditingItems(updated);
    };

    const handleSave = async () => {
        try {
            // Update order for all items
            const itemsWithOrder = editingItems.map((item, index) => ({
                ...item,
                order: index
            }));

            await api.post('/info-settings/admin', {
                setting_type: activeTab,
                items: itemsWithOrder
            });

            Swal.fire({
                icon: 'success',
                title: 'Saved!',
                text: `${getTypeTitle(activeTab)} settings have been saved successfully.`,
                timer: 1500,
                showConfirmButton: false
            });

            await fetchSettings();
            handleCancel();
        } catch (error) {
            console.error("Failed to save settings:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || 'Failed to save settings.'
            });
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'sector':
                return <FaBuilding className="me-1" />;
            case 'industry':
                return <FaIndustry className="me-1" />;
            case 'business_size':
                return <FaChartBar className="me-1" />;
            default:
                return null;
        }
    };

    const getTypeTitle = (type) => {
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const currentItems = isEditing ? editingItems : (settings[activeTab]?.items || [])
        .filter(item => item.is_active)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const allItems = isEditing ? editingItems : (settings[activeTab]?.items || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="Info Setup" breadcrumb={[["Admin Support", "/admin"], "Info Setup"]} />
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="Info Setup" breadcrumb={[["Admin Support", "/admin"], "Info Setup"]} />
            
            {/* Tabs */}
            <div className="mb-4">
                <div className="card-header bg-white border-bottom">
                    <ul className="nav nav-tabs card-header-tabs" role="tablist">
                        {['sector', 'industry', 'business_size'].map((type) => (
                            <li key={type} className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === type ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(type);
                                        if (isEditing) {
                                            handleCancel();
                                        }
                                    }}
                                    type="button"
                                    style={{ 
                                        color: activeTab === type ? '#46015E' : '#6c757d',
                                        borderBottom: activeTab === type ? '3px solid #46015E' : '3px solid transparent',
                                        fontWeight: activeTab === type ? '600' : '400'
                                    }}
                                >
                                    {getTypeIcon(type)}   
                                    {getTypeTitle(type)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card-body p-4">
                    {/* Action Buttons */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className=" fw-bold">
                                {getTypeIcon(activeTab)}
                                {getTypeTitle(activeTab)} Management
                            </h5>
                            <small className="text-muted">
                                {allItems.length} total items ({allItems.filter(i => i.is_active).length} active)
                            </small>
                        </div>
                        {isEditing ? (
                            <div>
                                <button
                                    className="btn btn-dark me-1"
                                    onClick={handleSave}
                                >
                                    <FaSave className="me-1 pe-1" />  
                                    Save Changes
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={handleCancel}
                                >
                                    <FaTimes className="me-1" />
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-dark"
                                onClick={handleEdit}
                            >
                                <FaEdit className="me-1" />
                                Edit {getTypeTitle(activeTab)}
                            </button>
                        )}
                    </div>

                    {/* Add New Item Form (only in edit mode) */}
                    {isEditing && (
                        <div className="card bg-light mb-4">
                            <div className="card-body">
                                <h6 className="card-title fw-semibold mb-3">
                                    <FaPlus className="me-1" />
                                    Add New Item
                                </h6>
                                <div className="row g-3">
                                    <div className="col-md-5">
                                        <label className="form-label fw-semibold">Value <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newItemValue}
                                            onChange={(e) => setNewItemValue(e.target.value)}
                                            placeholder="Enter value"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddItem();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-5">
                                        <label className="form-label fw-semibold">Label (optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newItemLabel}
                                            onChange={(e) => setNewItemLabel(e.target.value)}
                                            placeholder="Enter label (defaults to value)"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddItem();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="col-md-2 d-flex align-items-end">
                                        <button
                                            className="btn btn-dark w-100"
                                            onClick={handleAddItem}
                                        >
                                            <FaPlus className="me-1" />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="table-responsive card">
                        <table className="table table-hover align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th>Value</th>
                                    <th>Label</th>
                                    <th style={{ width: '100px' }} className="text-center">Status</th>
                                    {isEditing && (
                                        <>
                                            <th style={{ width: '120px' }} className="text-center">Order</th>
                                            <th style={{ width: '100px' }} className="text-center">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {allItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={isEditing ? 6 : 4} className="text-center py-5 text-muted">
                                            <div>
                                                <FaIndustry className="fs-1 mb-3 opacity-25" />
                                                <p className="">No items configured</p>
                                                {!isEditing && (
                                                    <small>Click "Edit {getTypeTitle(activeTab)}" to add items</small>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    allItems.map((item, index) => (
                                        <tr 
                                            key={index}
                                            style={{ 
                                                opacity: item.is_active ? 1 : 0.6,
                                                backgroundColor: item.is_active ? 'white' : '#f8f9fa'
                                            }}
                                        >
                                            <td>
                                                <span className="badge bg-secondary">{index + 1}</span>
                                            </td>
                                            <td>
                                                <span className="fw-semibold">{item.value}</span>
                                            </td>
                                            <td>
                                                {item.label && item.label !== item.value ? (
                                                    <span className="text-muted">{item.label}</span>
                                                ) : (
                                                    <span className="text-muted fst-italic">—</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <span className={`${item.is_active ? 'text-success' : 'text-secondary'}`}>
                                                    {item.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            {isEditing && (
                                                <>
                                                    <td className="text-center">
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => handleMoveUp(index)}
                                                                disabled={index === 0}
                                                                title="Move Up"
                                                            >
                                                                <FaArrowUp />
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => handleMoveDown(index)}
                                                                disabled={index === allItems.length - 1}
                                                                title="Move Down"
                                                            >
                                                                <FaArrowDown />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className={`btn ${item.is_active ? 'btn-outline-dark' : 'btn-outline-secondary'}`}
                                                                onClick={() => handleToggleActive(index)}
                                                                title={item.is_active ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {item.is_active ? <FaX /> : <FaCheck /> }
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-danger"
                                                                onClick={() => handleRemoveItem(index)}
                                                                title="Remove"
                                                            >
                                                                <FaTrashAlt />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Info Message */}
                    {!isEditing && allItems.length > 0 && (
                        <div className="alert alert-info mt-4 ">
                            <small>
                                <strong>Note:</strong> Only active items are shown in the registration form. 
                                Inactive items are hidden but preserved in the database.
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InfoSetup;
