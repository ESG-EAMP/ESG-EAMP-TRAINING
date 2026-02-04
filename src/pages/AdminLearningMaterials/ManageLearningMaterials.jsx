import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaTrashAlt, FaEdit, FaFileAlt, FaVideo, FaSearch, FaFilter, FaPlus, FaEye, FaDownload, FaChartBar } from 'react-icons/fa';
import api from '../../utils/api';

function ManageLearningMaterials() {
    const [materials, setMaterials] = useState([]);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const res = await api.get('/learning-materials/');
                const data = res.data;
                // Add fallback values for `views` and `downloads` (if not tracked yet)
                const processed = data.map(m => ({
                    id: m.id,
                    title: m.title,
                    type: m.type,
                    category: m.category || 'Uncategorized',
                    date: new Date(m.created_at).toLocaleDateString('en-GB'), // 'dd/mm/yyyy'
                    status: m.status,
                    views: m.views || 0,
                    downloads: m.downloads || 0
                }));
                setMaterials(processed);
            } catch (err) {
                console.error("Error loading learning materials:", err);
            }
        };
        fetchMaterials();
    }, []);

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this material?');
        if (!confirmDelete) return;
        try {
            await api.delete(`/learning-materials/${id}`);
            setMaterials(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete material.");
        }
    };

    const countByStatus = (status, type = null) =>
        materials.filter(m => m.status === status && (!type || m.type === type)).length;

    const getTotalViews = () => materials.reduce((sum, m) => sum + m.views, 0);
    const getTotalDownloads = () => materials.reduce((sum, m) => sum + m.downloads, 0);

    const filteredMaterials = materials.filter(material => {
        const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !filterType || material.type === filterType;
        const matchesStatus = !filterStatus || material.status === filterStatus;
        const matchesCategory = !filterCategory || material.category === filterCategory;
        return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });

    const getStatusBadge = (status) => {
        const badges = {
            'Published': 'badge bg-success',
            'Draft': 'badge bg-warning text-dark',
            'Archived': 'badge bg-secondary'
        };
        return <span className={badges[status]}>{status}</span>;
    };

    const getTypeIcon = (type) => {
        const icons = {
            'Article': <FaFileAlt className="text-primary" />,
            'Video': <FaVideo className="text-danger" />,
            'Document': <FaFileAlt className="text-info" />,
            'Infographic': <FaChartBar className="text-success" />
        };
        return icons[type] || <FaFileAlt />;
    };

    return (
        <div className="container-fluid">
            <Title title="Manage Learning Centre" breadcrumb={[["Learning Centre", "/learning-materials"], "Manage"]} />
            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="bg-white p-4 rounded shadow-sm border-start border-primary border-4">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <FaFileAlt className="fs-2 text-primary" />
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h6 className="text-muted mb-1">Articles</h6>
                                <h3 className=" fw-bold">{countByStatus('Published', 'Article')}</h3>
                                <small className="text-success">+12% from last month</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="bg-white p-4 rounded shadow-sm border-start border-danger border-4">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <FaVideo className="fs-2 text-danger" />
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h6 className="text-muted mb-1">Videos</h6>
                                <h3 className=" fw-bold">{countByStatus('Published', 'Video')}</h3>
                                <small className="text-success">+8% from last month</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="bg-white p-4 rounded shadow-sm border-start border-warning border-4">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <FaFileAlt className="fs-2 text-warning" />
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h6 className="text-muted mb-1">Total Views</h6>
                                <h3 className=" fw-bold">{getTotalViews().toLocaleString()}</h3>
                                <small className="text-success">+15% from last month</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="bg-white p-4 rounded shadow-sm border-start border-info border-4">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <FaDownload className="fs-2 text-info" />
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <h6 className="text-muted mb-1">Downloads</h6>
                                <h3 className=" fw-bold">{getTotalDownloads().toLocaleString()}</h3>
                                <small className="text-success">+22% from last month</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Search and Filters */}
            <div className="bg-white rounded shadow-sm p-4 mb-4">
                <div className="row align-items-center">
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <FaSearch className="text-muted" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search materials..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Article">Article</option>
                            <option value="Video">Video</option>
                            <option value="Document">Document</option>
                            <option value="Infographic">Infographic</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            <option value="Environmental">Environmental</option>
                            <option value="Social">Social</option>
                            <option value="Governance">Governance</option>
                            <option value="Sustainability">Sustainability</option>
                            <option value="Compliance">Compliance</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-primary w-100">
                            <FaPlus className="me-1" />
                            Add New
                        </button>
                    </div>
                </div>
            </div>
            {/* Materials Table */}
            <div className="bg-white rounded shadow-sm">
                <div className="p-4 border-bottom">
                    <h5 className="fw-semibold ">Learning Centre ({filteredMaterials.length})</h5>
                </div>
                <div className="card shadow rounded">
                    <table className="table table-hover ">
                        <thead className="table-dark">
                            <tr>
                                <th className="border-0">Material</th>
                                <th className="border-0">Category</th>
                                <th className="border-0">Type</th>
                                <th className="border-0">Date</th>
                                <th className="border-0">Status</th>
                                <th className="border-0">Engagement</th>
                                <th className="border-0 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMaterials.map((material) => (
                                <tr key={material.id} className="align-middle">
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="me-3">
                                                {getTypeIcon(material.type)}
                                            </div>
                                            <div>
                                                <h6 className="mb-1 fw-semibold">{material.title}</h6>
                                                <small className="text-muted">ID: {material.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark">{material.category}</span>
                                    </td>
                                    <td>
                                        <span className="text-muted">{material.type}</span>
                                    </td>
                                    <td>
                                        <span className="text-muted">{material.date}</span>
                                    </td>
                                    <td>
                                        {getStatusBadge(material.status)}
                                    </td>
                                    <td>
                                        <div className="small">
                                            <div className="text-muted">Views: {material.views.toLocaleString()}</div>
                                            <div className="text-muted">Downloads: {material.downloads.toLocaleString()}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-1">
                                            <button 
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => navigate(`/admin/learning-materials/preview/${material.id}`)}
                                                title="Preview"
                                            >
                                                <FaEye />
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => navigate(`/admin/learning-materials/edit/${material.id}`)}
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-info"
                                                title="Download"
                                            >
                                                <FaDownload />
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(material.id)}
                                                title="Delete"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredMaterials.length === 0 && (
                    <div className="text-center py-5">
                        <FaFileAlt className="fs-1 text-muted mb-3" />
                        <h5 className="text-muted">No materials found</h5>
                        <p className="text-muted">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageLearningMaterials;
