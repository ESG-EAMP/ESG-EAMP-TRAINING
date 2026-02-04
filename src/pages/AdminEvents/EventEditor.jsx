import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../utils/api';

function EventEditor() {
    const { id } = useParams();
    const navigate = useNavigate();

    const isEditMode = !!id;

    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        image: '',
        status: 'Upcoming',
        external_url: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            const fetchEvent = async () => {
                try {
                    const res = await api.get(`/events/${id}`);
                    const data = res.data;
                    setEventData({
                        title: data.title || '',
                        description: data.description || '',
                        date: data.date ? new Date(data.date).toISOString().slice(0, 16) : '',
                        location: data.location || '',
                        image: data.image || '',
                        status: data.status || 'Upcoming',
                        external_url: data.external_url || '',
                    });
                } catch (error) {
                    console.error(error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to load event.'
                    });
                    navigate('/admin/events');
                }
            };
            fetchEvent();
        }
    }, [id, isEditMode, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setEventData((prev) => ({
            ...prev,
            imageFile: file
        }));
    };


    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', eventData.title);
            formData.append('description', eventData.description);
            formData.append('date', eventData.date);
            formData.append('location', eventData.location);
            formData.append('category', eventData.category || '');
            formData.append('status', eventData.status);
            formData.append('external_url', eventData.external_url || '');
            if (eventData.imageFile) {
                formData.append('image', eventData.imageFile);
            }

            const apiMethod = isEditMode ? api.put : api.post;
            const apiUrl = isEditMode ? `/events/${id}` : '/events/';
            await apiMethod(apiUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Event saved successfully!'
            });
            navigate('/admin/events');
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save event.'
            });
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="container-fluid">
            <Title
                title={isEditMode ? "Edit Event" : "Create Event"}
                breadcrumb={[["Events", "/admin/events"], isEditMode ? "Edit" : "Create"]}
            />

            <div className="row">
                <div className="col-lg-12">
                    <div className="">
                        <div className="mb-3">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                className="form-control"
                                name="title"
                                value={eventData.title}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-control"
                                rows="5"
                                name="description"
                                value={eventData.description}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                name="date"
                                value={eventData.date}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-control"
                                name="location"
                                value={eventData.location}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Image URL</label>
                            <input
                                type="file"
                                className="form-control"
                                name="imageFile"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                        </div>
                        <div className="mb-3">
                            <label className="form-label">Status</label>
                            <select
                                className="form-select"
                                name="status"
                                value={eventData.status}
                                onChange={handleInputChange}
                            >
                                <option value="Upcoming">Upcoming</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">External URL</label>
                            <input
                                type="text"
                                className="form-control"
                                name="external_url"
                                value={eventData.external_url || ''}
                                onChange={handleInputChange}
                                placeholder="https://example.com/event-page"
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-secondary" onClick={() => navigate(-1)} disabled={saving}>
                                <FaArrowLeft className="me-1" /> Back
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="me-1" /> Save
                                    </>
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventEditor;
