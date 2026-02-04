import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaPlus, FaEdit, FaTrashAlt, FaEye, FaSearch, FaFilter } from 'react-icons/fa';
import api from '../../utils/api';

function ManageLearningMaterialsSections() {
    const [sections, setSections] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const res = await api.get('/learning-materials-sections/');
            const data = res.data;
            setSections(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            alert("Failed to fetch sections.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this section?")) return;

        try {
            await api.delete(`/learning-materials-sections/${id}`);
            fetchSections();
        } catch (error) {
            console.error(error);
            alert("Delete failed.");
        }
    };

    const categories = [
        "ESG & Sustainability",
        "Website & Platform",
        "Resources",
        "Certification",
        "Financing & Incentives",
        "ESG Champion"
    ];

    const getCategoryBadge = (category) => {
        const colors = {
            "ESG & Sustainability": "bg-success",
            "Website & Platform": "bg-primary",
            "Resources": "bg-info",
            "Certification": "bg-warning",
            "Financing & Incentives": "bg-secondary",
            "ESG Champion": "bg-danger"
        };
        return <span className={`badge ${colors[category] || 'bg-light text-dark'}`}>{category}</span>;
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Published': 'badge bg-success',
            'Draft': 'badge bg-warning text-dark',
            'Archived': 'badge bg-secondary'
        };
        return <span className={badges[status]}>{status}</span>;
    };

    return (
        <div className="container-fluid">
            <Title title="Manage Learning Centre Sections" breadcrumb={[["Learning Centre", "/admin/learning-materials"], "Sections"]} />

            <div className="d-flex justify-content-end mb-3">
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/admin/learning-materials-sections/new')}
                >
                    <FaPlus className="me-1" /> Add Section
                </button>
            </div>

            <div className=" bg-white rounded shadow-sm">
                <table className="table  table-hover ">
                    <thead className="table-dark">
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Order</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sections.map((section) => (
                            <tr key={section.id}>
                                <td>
                                    <div>
                                        <h6 className="mb-1 fw-semibold">{section.title}</h6>
                                        <small className="text-muted">{section.description || 'No description'}</small>
                                    </div>
                                </td>
                                <td>{getCategoryBadge(section.category)}</td>
                                <td>{getStatusBadge(section.status)}</td>
                                <td>
                                    <span className="badge bg-light text-dark">{section.order}</span>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-primary me-1"
                                        onClick={() => navigate(`/admin/learning-materials-sections/preview/${section.id}`)}
                                    >
                                        <FaEye />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary me-1"
                                        onClick={() => navigate(`/admin/learning-materials-sections/edit/${section.id}`)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDelete(section.id)}
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sections.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-5">
                                    No sections found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ManageLearningMaterialsSections;


