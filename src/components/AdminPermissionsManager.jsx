import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import api from '../utils/api';
import { Permission } from '../utils/permissions';

/**
 * AdminPermissionsManager Component
 * Allows super admins to customize permissions for individual admin users using checkboxes
 */
function AdminPermissionsManager({ userId, adminName, onClose, onUpdate }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [permissions, setPermissions] = useState({});
    const [permissionsByCategory, setPermissionsByCategory] = useState({});
    const [rolePermissions, setRolePermissions] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPermissions, setOriginalPermissions] = useState({});

    useEffect(() => {
        fetchPermissions();
    }, [userId]);

    const fetchPermissions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/management/admin/permissions/${userId}`);
            const data = response.data;
            
            setPermissionsByCategory(data.permissions_by_category || {});
            setRolePermissions(data.role_permissions || []);
            
            // Build permissions object from the response
            const permsObj = {};
            Object.values(data.permissions_by_category || {}).forEach(category => {
                category.forEach(perm => {
                    permsObj[perm.permission] = perm.effective;
                });
            });
            
            setPermissions(permsObj);
            setOriginalPermissions({ ...permsObj });
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to fetch permissions:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || 'Failed to load permissions',
                confirmButtonColor: '#312259'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = (permission, value) => {
        setPermissions(prev => ({
            ...prev,
            [permission]: value
        }));
        setHasChanges(true);
    };

    const handleCategoryToggle = (category, value) => {
        const categoryPerms = permissionsByCategory[category] || [];
        const newPermissions = { ...permissions };
        
        categoryPerms.forEach(perm => {
            newPermissions[perm.permission] = value;
        });
        
        setPermissions(newPermissions);
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // Build custom permissions object (only include permissions that differ from role-based)
            const customPermissions = {};
            Object.keys(permissions).forEach(perm => {
                const isRoleBased = rolePermissions.includes(perm);
                const currentValue = permissions[perm];
                
                // Only include if it differs from role-based permission
                if (isRoleBased !== currentValue) {
                    customPermissions[perm] = currentValue;
                }
            });
            
            await api.put(`/management/admin/permissions/${userId}`, {
                custom_permissions: customPermissions
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Permissions Updated!',
                text: `Permissions for ${adminName} have been updated successfully.`,
                timer: 2000,
                showConfirmButton: false
            });
            
            setOriginalPermissions({ ...permissions });
            setHasChanges(false);
            
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to save permissions:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.detail || 'Failed to save permissions',
                confirmButtonColor: '#312259'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        const result = await Swal.fire({
            title: 'Reset Permissions?',
            text: 'This will remove all custom permissions and revert to role-based permissions.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#312259',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, reset!',
            cancelButtonText: 'Cancel'
        });
        
        if (result.isConfirmed) {
            try {
                setSaving(true);
                await api.delete(`/management/admin/permissions/${userId}`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Permissions Reset!',
                    text: 'Permissions have been reset to role-based defaults.',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                fetchPermissions(); // Reload permissions
                
                if (onUpdate) {
                    onUpdate();
                }
            } catch (error) {
                console.error('Failed to reset permissions:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.detail || 'Failed to reset permissions',
                    confirmButtonColor: '#312259'
                });
            } finally {
                setSaving(false);
            }
        }
    };

    const getPermissionName = (permission) => {
        return permission
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) {
        return (
            <div className="modal-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading permissions...</span>
                </div>
                <p className="mt-3 text-muted">Loading permissions...</p>
            </div>
        );
    }

    return (
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="mb-3">
                <p className="text-muted ">
                    Customize permissions for <strong>{adminName}</strong>. 
                    Checkboxes override role-based permissions.
                </p>
            </div>

            {Object.entries(permissionsByCategory).map(([category, categoryPerms]) => {
                const allChecked = categoryPerms.every(perm => permissions[perm.permission]);
                const someChecked = categoryPerms.some(perm => permissions[perm.permission]);
                
                return (
                    <div key={category} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                            <h6 className=" fw-semibold">{category}</h6>
                            <div className="btn-group btn-group-sm" role="group">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleCategoryToggle(category, true)}
                                    disabled={saving}
                                >
                                    All
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => handleCategoryToggle(category, false)}
                                    disabled={saving}
                                >
                                    None
                                </button>
                            </div>
                        </div>
                        
                        <div className="row g-2">
                            {categoryPerms.map(perm => {
                                const isRoleBased = perm.role_based;
                                const hasCustom = perm.has_custom;
                                const isChecked = permissions[perm.permission] || false;
                                
                                return (
                                    <div key={perm.permission} className="col-md-6">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`perm-${perm.permission}`}
                                                checked={isChecked}
                                                onChange={(e) => handlePermissionChange(perm.permission, e.target.checked)}
                                                disabled={saving}
                                            />
                                            <label 
                                                className="form-check-label" 
                                                htmlFor={`perm-${perm.permission}`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {perm.name}
                                                {isRoleBased && !hasCustom && (
                                                    <span className="badge bg-info ms-2" title="Role-based permission">
                                                        Default
                                                    </span>
                                                )}
                                                {hasCustom && (
                                                    <span className="badge bg-warning ms-2" title="Custom permission">
                                                        Custom
                                                    </span>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <div className="modal-footer border-top pt-3 mt-4">
                <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleReset}
                    disabled={saving || Object.keys(originalPermissions).length === 0}
                >
                    <i className="mdi mdi-refresh me-1"></i>
                    Reset to Defaults
                </button>
                <div className="ms-auto">
                    <button
                        type="button"
                        className="btn btn-outline-secondary me-2"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="mdi mdi-content-save me-1"></i>
                                Save Permissions
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminPermissionsManager;
