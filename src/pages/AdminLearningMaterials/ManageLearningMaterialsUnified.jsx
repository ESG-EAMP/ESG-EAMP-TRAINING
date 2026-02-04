import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import { FaPlus, FaEdit, FaTrashAlt, FaEye, FaSearch, FaFilter, FaBook, FaList, FaSave, FaTimes, FaCode, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api, { getToken } from '../../utils/api';
import { hasPermission, Permission } from '../../utils/permissions';
import CKEditorWrapper from '../../components/CKEditorWrapper';
import Empty from '../../components/Empty';
import mammoth from 'mammoth';

function ManageLearningMaterialsUnified() {
    const [sections, setSections] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState(null); // Track which section's items are being viewed
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Pagination state for sections
    const [currentPageSections, setCurrentPageSections] = useState(1);
    const [itemsPerPageSections, setItemsPerPageSections] = useState(5);

    // Pagination state for materials (when viewing section items)
    const [currentPageMaterials, setCurrentPageMaterials] = useState(1);
    const [itemsPerPageMaterials, setItemsPerPageMaterials] = useState(5);

    const [categories, setCategories] = useState([]);

    // Inline editing state
    const [editingSectionId, setEditingSectionId] = useState(null);
    const [newSection, setNewSection] = useState(null);
    const [editingSectionData, setEditingSectionData] = useState({});

    // Content editor modal state
    const [contentModalOpen, setContentModalOpen] = useState(false);
    const [editingContentSectionId, setEditingContentSectionId] = useState(null);
    const [sectionContent, setSectionContent] = useState('');

    // Preview modal state
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewSection, setPreviewSection] = useState(null);

    // Word import refs
    const wordImportInputRef = useRef(null);

    useEffect(() => {
        fetchSections();
        fetchMaterials();
        fetchCategories();
    }, []);

    // Check URL params for section ID or category to restore selected section
    useEffect(() => {
        const sectionIdParam = searchParams.get('section');
        const categoryParam = searchParams.get('category');

        if (sectionIdParam && sections.length > 0) {
            // If section ID is in URL, set it
            const section = sections.find(s => s.id === sectionIdParam);
            if (section) {
                setSelectedSectionId(sectionIdParam);
            }
        } else if (categoryParam && sections.length > 0) {
            // If category is in URL, find section by category
            const section = sections.find(s => s.category === categoryParam);
            if (section) {
                setSelectedSectionId(section.id);
            }
        }
    }, [searchParams, sections]);

    // Reset pagination when filters or search change
    useEffect(() => {
        setCurrentPageSections(1);
        setCurrentPageMaterials(1);
    }, [searchTerm, filterCategory]);

    // Reset materials pagination when section changes
    useEffect(() => {
        setCurrentPageMaterials(1);
    }, [selectedSectionId]);

    const fetchSections = async () => {
        try {
            const res = await api.get('/learning-materials-sections/');
            const data = res.data;
            setSections(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching sections:", error);
            setSections([]); // Set empty array on error
            // Don't show alert for 403 errors as they might be expected
            if (!error.message.includes('403')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch sections.'
                });
            }
        }
    };

    const fetchMaterials = async () => {
        try {
            const res = await api.get('/learning-materials/');
            const data = res.data;
            setMaterials(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching materials:", error);
            setMaterials([]); // Set empty array on error
            // Don't show alert for 403 errors as they might be expected
            if (!error.message.includes('403')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch materials.'
                });
            }
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/learning-materials-sections/');
            const data = res.data;
            const sections = Array.isArray(data) ? data : [];

            // Extract unique categories from sections
            const uniqueCategories = [...new Set(sections
                .map(section => section.category)
                .filter(category => category && category.trim() !== '')
            )].sort();

            // If no categories found, use default categories
            if (uniqueCategories.length === 0) {
                setCategories([
                    "ESG & Sustainability",
                    "Website & Platform",
                    "Resources",
                    "Certification",
                    "Financing & Incentives",
                    "ESG Champion"
                ]);
            } else {
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Fallback to default categories on error
            setCategories([
                "ESG & Sustainability",
                "Website & Platform",
                "Resources",
                "Certification",
                "Financing & Incentives",
                "ESG Champion"
            ]);
        }
    };

    const handleDeleteSection = async (id) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_LEARNING_SECTIONS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete learning sections.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this section?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/learning-materials-sections/${id}`);
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Section has been deleted.',
                timer: 1500,
                showConfirmButton: false
            });
            fetchSections();
            fetchCategories(); // Refresh categories after deletion
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Delete failed.'
            });
        }
    };

    const handleDeleteMaterial = async (id) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_CONTENT)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete learning materials.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Are you sure you want to delete this material?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/learning-materials/${id}`);
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Material has been deleted.',
                timer: 1500,
                showConfirmButton: false
            });
            fetchMaterials();
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Delete failed.'
            });
        }
    };

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

    const getTypeIcon = (type) => {
        const icons = {
            'Article': <FaList className="text-primary" />,
            'Video': <FaList className="text-danger" />,
            'Document': <FaList className="text-info" />,
            'Infographic': <FaList className="text-success" />
        };
        return icons[type] || <FaList />;
    };

    const filteredSections = (sections || []).filter(section => {
        const matchesSearch = section.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || section.category === filterCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Get selected section
    const selectedSection = sections.find(s => s.id === selectedSectionId);

    // Filter materials - if viewing a section's items, filter by that section's category
    const filteredMaterials = (materials || []).filter(material => {
        const matchesSearch = material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.category?.toLowerCase().includes(searchTerm.toLowerCase());

        // If viewing a section's items, filter by that section's category
        if (selectedSectionId && selectedSection) {
            return matchesSearch && material.category === selectedSection.category;
        }

        // Otherwise, use the category filter
        const matchesCategory = !filterCategory || material.category === filterCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Pagination logic for sections
    const totalPagesSections = Math.ceil(filteredSections.length / itemsPerPageSections);
    const startIndexSections = (currentPageSections - 1) * itemsPerPageSections;
    const endIndexSections = startIndexSections + itemsPerPageSections;
    const currentSections = filteredSections.slice(startIndexSections, endIndexSections);

    // Pagination logic for materials
    const totalPagesMaterials = Math.ceil(filteredMaterials.length / itemsPerPageMaterials);
    const startIndexMaterials = (currentPageMaterials - 1) * itemsPerPageMaterials;
    const endIndexMaterials = startIndexMaterials + itemsPerPageMaterials;
    const currentMaterials = filteredMaterials.slice(startIndexMaterials, endIndexMaterials);

    // Pagination handlers for sections
    const handlePageChangeSections = (page) => {
        setCurrentPageSections(page);
    };

    const handleItemsPerPageChangeSections = (newItemsPerPage) => {
        setItemsPerPageSections(newItemsPerPage);
        setCurrentPageSections(1);
    };

    // Pagination handlers for materials
    const handlePageChangeMaterials = (page) => {
        setCurrentPageMaterials(page);
    };

    const handleItemsPerPageChangeMaterials = (newItemsPerPage) => {
        setItemsPerPageMaterials(newItemsPerPage);
        setCurrentPageMaterials(1);
    };

    const handleViewItems = (sectionId) => {
        setSelectedSectionId(sectionId);
        // Update URL to preserve section selection
        const section = sections.find(s => s.id === sectionId);
        if (section) {
            navigate(`/admin/learning-materials?section=${sectionId}&category=${encodeURIComponent(section.category)}`, { replace: true });
        }
    };

    const handleBackToSections = () => {
        setSelectedSectionId(null);
        setSearchTerm('');
        // Clear URL params when going back to sections
        navigate('/admin/learning-materials', { replace: true });
    };

    // Helper to check if HTML content is empty or mostly blank
    const isContentEmpty = (htmlContent) => {
        if (!htmlContent || typeof htmlContent !== 'string') return true;

        // Create a temporary DOM element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Get text content (strips HTML tags)
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        // Remove whitespace and check if there's meaningful content
        const trimmedText = textContent.trim().replace(/\s+/g, ' ');

        // Consider content empty if:
        // 1. No text content after stripping HTML
        // 2. Only whitespace characters
        // 3. Very short content (less than 3 characters) - likely just formatting artifacts
        return trimmedText.length < 3;
    };

    // Calculate default order (highest order + 1)
    const getDefaultOrder = () => {
        if (sections.length === 0) return 1;
        const maxOrder = Math.max(...sections.map(s => s.order || 0));
        return maxOrder + 1;
    };

    // Handle add new section (add row to table)
    const handleAddSection = () => {
        const defaultOrder = getDefaultOrder();
        setNewSection({
            title: '',
            description: '',
            category: '',
            status: 'Published',
            order: defaultOrder,
            content: '',
            image_url: null,
            external_url: '',
            isSectionPublic: true
        });
    };

    // Handle edit section (make row editable)
    const handleEditSection = (section) => {
        setEditingSectionId(section.id);
        setEditingSectionData({
            title: section.title || '',
            description: section.description || '',
            category: section.category || '',
            status: section.status || 'Published',
            order: section.order || 1,
            content: section.content || '',
            image_url: section.image_url || null,
            external_url: section.external_url || '',
            isSectionPublic: section.isSectionPublic !== undefined ? section.isSectionPublic : true
        });
    };

    // Handle open content editor
    const handleEditContent = (section) => {
        setEditingContentSectionId(section.id);
        setSectionContent(section.content || '');
        setContentModalOpen(true);
    };

    // Handle Word document import
    const handleWordImport = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword' // .doc
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(docx?)$/i)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid File',
                text: 'Please select a Word document (.doc or .docx file).'
            });
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            Swal.fire({
                icon: 'error',
                title: 'File Too Large',
                text: 'File size must be less than 10MB.'
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Importing Word Document...',
                text: 'Please wait while we convert your document.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Convert Word document to HTML using mammoth
            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            const html = result.value;

            // Get warnings if any
            if (result.messages.length > 0) {
                console.warn('Word import warnings:', result.messages);
            }

            // Insert HTML into CKEditor
            // Update content state - CKEditor will react to data changes
            setSectionContent(prev => {
                // If there's existing content, append with a line break
                return prev ? prev + '<br>' + html : html;
            });

            Swal.fire({
                icon: 'success',
                title: 'Import Successful!',
                text: 'Word document has been imported into the editor.',
                timer: 2000,
                showConfirmButton: false
            });

            // Reset file input
            if (wordImportInputRef.current) {
                wordImportInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Word import error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Import Failed',
                text: error.message || 'Failed to import Word document. Please try again.'
            });
        }
    };

    // Handle save content
    const handleSaveContent = async () => {
        try {
            if (!editingContentSectionId) return;

            const section = sections.find(s => s.id === editingContentSectionId);
            if (!section) return;

            const formData = new FormData();
            formData.append('title', section.title);
            formData.append('description', section.description || '');
            formData.append('content', sectionContent);
            formData.append('category', section.category);
            formData.append('status', section.status || 'Published');
            formData.append('order', section.order || 0);
            if (section.external_url) {
                formData.append('external_url', section.external_url);
            }

            await api.put(`/learning-materials-sections/${editingContentSectionId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            Swal.fire({
                icon: 'success',
                title: 'Content Saved!',
                text: 'Section content has been updated.',
                timer: 1500,
                showConfirmButton: false
            });

            setContentModalOpen(false);
            setEditingContentSectionId(null);
            setSectionContent('');
            fetchSections();
        } catch (error) {
            console.error('Save content error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save content.'
            });
        }
    };

    // Handle cancel editing
    const handleCancelEdit = () => {
        setEditingSectionId(null);
        setEditingSectionData({});
    };

    // Handle cancel new section
    const handleCancelNew = () => {
        setNewSection(null);
    };

    // Handle move section up
    const handleMoveUpSection = async (sectionId, displayIndex) => {
        const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
        const sectionIndex = sortedSections.findIndex(s => s.id === sectionId);

        if (sectionIndex === 0) return; // Already at top

        const section = sortedSections[sectionIndex];
        const prevSection = sortedSections[sectionIndex - 1];

        // Swap orders
        const tempOrder = section.order || sectionIndex;
        const newOrder = prevSection.order || (sectionIndex - 1);

        try {
            // Update both sections
            const formData1 = new FormData();
            formData1.append('title', section.title);
            formData1.append('description', section.description || '');
            formData1.append('content', section.content || '');
            formData1.append('category', section.category);
            formData1.append('status', section.status || 'Published');
            formData1.append('order', newOrder);
            formData1.append('isSectionPublic', (section.isSectionPublic !== undefined ? section.isSectionPublic : true) ? 'true' : 'false');
            if (section.external_url) formData1.append('external_url', section.external_url);

            const formData2 = new FormData();
            formData2.append('title', prevSection.title);
            formData2.append('description', prevSection.description || '');
            formData2.append('content', prevSection.content || '');
            formData2.append('category', prevSection.category);
            formData2.append('status', prevSection.status || 'Published');
            formData2.append('order', tempOrder);
            formData2.append('isSectionPublic', (prevSection.isSectionPublic !== undefined ? prevSection.isSectionPublic : true) ? 'true' : 'false');
            if (prevSection.external_url) formData2.append('external_url', prevSection.external_url);

            await Promise.all([
                api.put(`/learning-materials-sections/${section.id}`, formData1, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }),
                api.put(`/learning-materials-sections/${prevSection.id}`, formData2, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            ]);

            fetchSections();
        } catch (error) {
            console.error('Move section error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to move section.'
            });
        }
    };

    // Handle move section down
    const handleMoveDownSection = async (sectionId, displayIndex) => {
        const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
        const sectionIndex = sortedSections.findIndex(s => s.id === sectionId);

        if (sectionIndex === sortedSections.length - 1) return; // Already at bottom

        const section = sortedSections[sectionIndex];
        const nextSection = sortedSections[sectionIndex + 1];

        // Swap orders
        const tempOrder = section.order || sectionIndex;
        const newOrder = nextSection.order || (sectionIndex + 1);

        try {
            // Update both sections
            const formData1 = new FormData();
            formData1.append('title', section.title);
            formData1.append('description', section.description || '');
            formData1.append('content', section.content || '');
            formData1.append('category', section.category);
            formData1.append('status', section.status || 'Published');
            formData1.append('order', newOrder);
            formData1.append('isSectionPublic', (section.isSectionPublic !== undefined ? section.isSectionPublic : true) ? 'true' : 'false');
            if (section.external_url) formData1.append('external_url', section.external_url);

            const formData2 = new FormData();
            formData2.append('title', nextSection.title);
            formData2.append('description', nextSection.description || '');
            formData2.append('content', nextSection.content || '');
            formData2.append('category', nextSection.category);
            formData2.append('status', nextSection.status || 'Published');
            formData2.append('order', tempOrder);
            formData2.append('isSectionPublic', (nextSection.isSectionPublic !== undefined ? nextSection.isSectionPublic : true) ? 'true' : 'false');
            if (nextSection.external_url) formData2.append('external_url', nextSection.external_url);

            await Promise.all([
                api.put(`/learning-materials-sections/${section.id}`, formData1, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }),
                api.put(`/learning-materials-sections/${nextSection.id}`, formData2, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            ]);

            fetchSections();
        } catch (error) {
            console.error('Move section error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to move section.'
            });
        }
    };

    // Handle save section (create or update)
    const handleSaveSection = async (sectionData, isNew = false) => {
        try {
            // Validate required fields
            if (!sectionData.title || !sectionData.title.trim()) {
                Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    text: 'Title is required.'
                });
                return;
            }

            if (!sectionData.category || !sectionData.category.trim()) {
                Swal.fire({
                    icon: 'error',
                    title: 'Validation Error',
                    text: 'Category is required.'
                });
                return;
            }

            // Create FormData for multipart/form-data request
            const formData = new FormData();
            formData.append('title', sectionData.title.trim());
            formData.append('description', sectionData.description || '');
            formData.append('content', sectionData.content || ''); // Required by backend
            formData.append('category', sectionData.category.trim());
            formData.append('status', sectionData.status || 'Published');
            formData.append('order', sectionData.order || 0);
            formData.append('isSectionPublic', (sectionData.isSectionPublic !== undefined ? sectionData.isSectionPublic : true) ? 'true' : 'false');
            if (sectionData.external_url) {
                formData.append('external_url', sectionData.external_url);
            }

            if (isNew) {
                // Create new section
                await api.post('/learning-materials-sections/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Created!',
                    text: 'Section has been created.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setNewSection(null);
            } else {
                // Update existing section
                await api.put(`/learning-materials-sections/${editingSectionId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Section has been updated.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setEditingSectionId(null);
                setEditingSectionData({});
            }
            fetchSections();
            fetchCategories();
        } catch (error) {
            console.error('Save section error:', error);
            const errorMessage = error.response?.data?.detail ||
                (Array.isArray(error.response?.data) ? error.response.data.map(e => e.msg || e).join(', ') : null) ||
                error.message ||
                (isNew ? 'Failed to create section.' : 'Failed to update section.');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
        }
    };

    // Handle move material up
    const handleMoveUpMaterial = async (materialId, displayIndex) => {
        const sortedMaterials = [...filteredMaterials];
        const materialIndex = sortedMaterials.findIndex(m => m.id === materialId);

        if (materialIndex === 0) return; // Already at top

        const material = sortedMaterials[materialIndex];
        const prevMaterial = sortedMaterials[materialIndex - 1];

        // Swap orders
        const tempOrder = material.order || materialIndex;
        const newOrder = prevMaterial.order || (materialIndex - 1);

        try {
            // Update both materials
            const payload1 = { ...material, order: newOrder };
            const payload2 = { ...prevMaterial, order: tempOrder };

            await Promise.all([
                api.put(`/learning-materials/${material.id}`, payload1),
                api.put(`/learning-materials/${prevMaterial.id}`, payload2)
            ]);

            fetchMaterials();
        } catch (error) {
            console.error('Move material error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to move material.'
            });
        }
    };

    // Handle move material down
    const handleMoveDownMaterial = async (materialId, displayIndex) => {
        const sortedMaterials = [...filteredMaterials];
        const materialIndex = sortedMaterials.findIndex(m => m.id === materialId);

        if (materialIndex === sortedMaterials.length - 1) return; // Already at bottom

        const material = sortedMaterials[materialIndex];
        const nextMaterial = sortedMaterials[materialIndex + 1];

        // Swap orders
        const tempOrder = material.order || materialIndex;
        const newOrder = nextMaterial.order || (materialIndex + 1);

        try {
            // Update both materials
            const payload1 = { ...material, order: newOrder };
            const payload2 = { ...nextMaterial, order: tempOrder };

            await Promise.all([
                api.put(`/learning-materials/${material.id}`, payload1),
                api.put(`/learning-materials/${nextMaterial.id}`, payload2)
            ]);

            fetchMaterials();
        } catch (error) {
            console.error('Move material error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to move material.'
            });
        }
    };

    return (
        <div className="container-fluid">
            <Title title="Manage Learning Centre" breadcrumb={[["Learning Centre", "/admin/learning-materials"], "Manage"]} />

            {/* Header with Add Section Button */}
            {!selectedSectionId && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-semibold ">Learning Centre Sections ({(sections || []).length})</h5>
                        <button
                            className="btn btn-primary"
                            onClick={handleAddSection}
                        >
                            <FaPlus className="me-1" /> Add Section
                        </button>
                    </div>
                </div>
            )}

            {/* Back button and header when viewing section items */}
            {selectedSectionId && selectedSection && (
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <button
                                className="btn px-0 btn-sm mb-2"
                                onClick={handleBackToSections}
                            >
                                <i className="fas fa-arrow-left me-1"></i>Back to Sections
                            </button>
                            <h5 className="fw-semibold  mt-2">
                                Items in "{selectedSection.title}" ({filteredMaterials.length})
                            </h5>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                // Navigate to editor with category pre-filled
                                navigate(`/admin/learning-editor?category=${encodeURIComponent(selectedSection.category)}`);
                            }}
                        >
                            <FaPlus className="me-1" /> Add Item
                        </button>
                    </div>
                </div>
            )}

            {/* Search and Filter - only show when viewing sections */}
            {!selectedSectionId && (
                <div className="row align-items-center mb-3">
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <FaSearch className="text-muted" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search sections..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <select
                            className="form-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Search when viewing section items */}
            {selectedSectionId && (
                <div className="row align-items-center mb-3">
                    <div className="col-md-4">
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">
                                <FaSearch className="text-muted" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Sections Table - only show when not viewing section items */}
            {!selectedSectionId && (
                <div className="">
                    {/* Items Per Page - Top Right (Sections) */}
                    {filteredSections.length > 0 && (
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="d-flex justify-content-end align-items-center gap-2">
                                    <label className="form-label text-muted">Show:</label>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: 'auto' }}
                                        value={itemsPerPageSections}
                                        onChange={(e) => handleItemsPerPageChangeSections(Number(e.target.value))}
                                    >
                                        {[10, 20, 30, 40, 50].map(size => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-muted">entries</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className=" table-scroll-top overflow-y-auto card">
                        <table className="table  table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>No.</th>
                                    <th>Actions</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Order</th>
                                    <th>Public</th>
                                    <th>Items</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* New Section Row */}
                                {newSection && (
                                    <tr>
                                        <td>
                                            <span className="text-muted">New</span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm me-1"
                                                onClick={() => handleSaveSection(newSection, true)}
                                                title="Save"
                                            >
                                                <FaSave />
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                onClick={handleCancelNew}
                                                title="Cancel"
                                            >
                                                <FaTimes />
                                            </button>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Title"
                                                value={newSection.title}
                                                onChange={(e) => {
                                                    const title = e.target.value;
                                                    setNewSection({
                                                        ...newSection,
                                                        title: title,
                                                        category: title // Auto-fill category from title
                                                    });
                                                }}
                                            />
                                            <textarea
                                                className="form-control form-control-sm mt-1"
                                                rows="2"
                                                placeholder="Description"
                                                value={newSection.description}
                                                onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className="form-select form-select-sm"
                                                value={newSection.status}
                                                onChange={(e) => setNewSection({ ...newSection, status: e.target.value })}
                                            >
                                                <option value="Published">Published</option>
                                                <option value="Draft">Draft</option>
                                                <option value="Archived">Archived</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={newSection.order}
                                                onChange={(e) => setNewSection({ ...newSection, order: parseInt(e.target.value) || 1 })}
                                                style={{ width: '80px' }}
                                            />
                                        </td>
                                        <td>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={newSection.isSectionPublic !== undefined ? newSection.isSectionPublic : true}
                                                    onChange={(e) => setNewSection({ ...newSection, isSectionPublic: e.target.checked })}
                                                    id={`new-section-public`}
                                                />
                                                <label className="form-check-label" htmlFor={`new-section-public`}>
                                                    Public
                                                </label>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary">0 items</span>
                                        </td>
                                    </tr>
                                )}

                                {currentSections.map((section, index) => {
                                    // Count materials for this section
                                    const sectionMaterialsCount = (materials || []).filter(
                                        m => m.category === section.category
                                    ).length;

                                    const isEditing = editingSectionId === section.id;

                                    return (
                                        <tr key={section.id}>
                                            <td>
                                                <span className="text-muted">{startIndexSections + index + 1}</span>
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            className="btn btn-sm me-1"
                                                            onClick={() => handleSaveSection(editingSectionData, false)}
                                                            title="Save"
                                                        >
                                                            <FaSave />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm"
                                                            onClick={handleCancelEdit}
                                                            title="Cancel"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn btn-sm  me-1"
                                                            onClick={() => handleViewItems(section.id)}
                                                            title="View Items"
                                                        >
                                                            <FaList />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm  me-1"
                                                            onClick={() => handleEditContent(section)}
                                                            title="Edit Content"
                                                        >
                                                            <FaCode />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm  me-1"
                                                            onClick={() => {
                                                                setPreviewSection(section);
                                                                setPreviewModalOpen(true);
                                                            }}
                                                            title="Preview Section"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm  me-1"
                                                            onClick={() => handleEditSection(section)}
                                                            title="Edit Section"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        {hasPermission(Permission.DELETE_LEARNING_SECTIONS) && (
                                                            <button
                                                                className="btn btn-sm text-danger"
                                                                onClick={() => handleDeleteSection(section.id)}
                                                                title="Delete Section"
                                                            >
                                                                <FaTrashAlt />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm mb-1"
                                                            value={editingSectionData.title}
                                                            onChange={(e) => {
                                                                const title = e.target.value;
                                                                setEditingSectionData({
                                                                    ...editingSectionData,
                                                                    title: title,
                                                                    category: title // Auto-sync category with title
                                                                });
                                                            }}
                                                        />
                                                        <textarea
                                                            className="form-control form-control-sm"
                                                            rows="2"
                                                            value={editingSectionData.description}
                                                            onChange={(e) => setEditingSectionData({ ...editingSectionData, description: e.target.value })}
                                                        />
                                                    </>
                                                ) : (
                                                    <div>
                                                        <h6 className="mb-1 fw-semibold">{section.title}</h6>
                                                        <small className="text-muted">{section.description || 'No description'}</small>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={editingSectionData.status}
                                                        onChange={(e) => setEditingSectionData({ ...editingSectionData, status: e.target.value })}
                                                    >
                                                        <option value="Published">Published</option>
                                                        <option value="Draft">Draft</option>
                                                        <option value="Archived">Archived</option>
                                                    </select>
                                                ) : (
                                                    getStatusBadge(section.status)
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={editingSectionData.order}
                                                        onChange={(e) => setEditingSectionData({ ...editingSectionData, order: parseInt(e.target.value) || 1 })}
                                                        style={{ width: '80px' }}
                                                    />
                                                ) : (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-light text-dark">{section.order}</span>
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => handleMoveUpSection(section.id, startIndexSections + index)}
                                                                disabled={startIndexSections + index === 0}
                                                                title="Move Up"
                                                            >
                                                                <FaArrowUp />
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                onClick={() => handleMoveDownSection(section.id, startIndexSections + index)}
                                                                disabled={startIndexSections + index === filteredSections.length - 1}
                                                                title="Move Down"
                                                            >
                                                                <FaArrowDown />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={editingSectionData.isSectionPublic !== undefined ? editingSectionData.isSectionPublic : true}
                                                            onChange={(e) => setEditingSectionData({ ...editingSectionData, isSectionPublic: e.target.checked })}
                                                            id={`edit-section-public-${section.id}`}
                                                        />
                                                        <label className="form-check-label" htmlFor={`edit-section-public-${section.id}`}>
                                                            Public
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <span className={`badge ${section.isSectionPublic !== false ? 'bg-success' : 'bg-secondary'}`}>
                                                        {section.isSectionPublic !== false ? 'Public' : 'Private'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">{sectionMaterialsCount} items</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {currentSections.length === 0 && !newSection && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5">
                                            No sections found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Bottom Center (Sections) */}
                    {totalPagesSections > 1 && (
                        <div className="row mt-4">
                            <div className="col-12">
                                <nav aria-label="Sections pagination">
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPageSections === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChangeSections(currentPageSections - 1)}
                                                disabled={currentPageSections === 1}
                                            >
                                                <i className="mdi mdi-chevron-left"></i>
                                            </button>
                                        </li>

                                        {Array.from({ length: Math.min(5, totalPagesSections) }, (_, i) => {
                                            let pageNum;
                                            if (totalPagesSections <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPageSections <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPageSections >= totalPagesSections - 2) {
                                                pageNum = totalPagesSections - 4 + i;
                                            } else {
                                                pageNum = currentPageSections - 2 + i;
                                            }

                                            return (
                                                <li key={pageNum} className={`page-item ${currentPageSections === pageNum ? 'active' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => handlePageChangeSections(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </li>
                                            );
                                        })}

                                        <li className={`page-item ${currentPageSections === totalPagesSections ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChangeSections(currentPageSections + 1)}
                                                disabled={currentPageSections === totalPagesSections}
                                            >
                                                <i className="mdi mdi-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Section Items Table - show when viewing a section's items */}
            {selectedSectionId && (
                <div className="">
                    {/* Items Per Page - Top Right (Materials) */}
                    {filteredMaterials.length > 0 && (
                        <div className="row mb-3">
                            <div className="col-12">
                                <div className="d-flex justify-content-end align-items-center gap-2">
                                    <label className="form-label text-muted">Show:</label>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: 'auto' }}
                                        value={itemsPerPageMaterials}
                                        onChange={(e) => handleItemsPerPageChangeMaterials(Number(e.target.value))}
                                    >
                                        {[10, 20, 30, 40, 50].map(size => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-muted">entries</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className=" table-scroll-top overflow-y-auto card">
                        <table className="table  table-hover ">
                            <thead className="table-dark">
                                <tr>
                                    <th>No.</th>
                                    <th>Actions</th>
                                    <th>Material</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentMaterials.map((material, index) => (
                                    <tr key={material.id}>
                                        <td>
                                            <span className="text-muted">{startIndexMaterials + index + 1}</span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm me-1"
                                                onClick={() => navigate(`/admin/learning-materials/preview/${material.id}`)}
                                                title="Preview"
                                            >
                                                <FaEye />
                                            </button>
                                            <button
                                                className="btn btn-sm me-1"
                                                onClick={() => {
                                                    const section = sections.find(s => s.id === selectedSectionId);
                                                    if (section) {
                                                        navigate(`/admin/learning-materials/edit/${material.id}?section=${selectedSectionId}&category=${encodeURIComponent(section.category)}`);
                                                    } else {
                                                        navigate(`/admin/learning-materials/edit/${material.id}`);
                                                    }
                                                }}
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            {hasPermission(Permission.DELETE_CONTENT) && (
                                                <button
                                                    className="btn btn-sm text-danger"
                                                    onClick={() => handleDeleteMaterial(material.id)}
                                                    title="Delete"
                                                >
                                                    <FaTrashAlt />
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div>
                                                    <h6 className="mb-1 fw-semibold">{material.title}</h6>
                                                    <small className="text-muted">{material.description || 'No description'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-muted">{material.type}</span>
                                        </td>
                                        <td>{getStatusBadge(material.status)}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="badge bg-light text-dark">{material.order || 0}</span>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => handleMoveUpMaterial(material.id, startIndexMaterials + index)}
                                                        disabled={startIndexMaterials + index === 0}
                                                        title="Move Up"
                                                    >
                                                        <FaArrowUp />
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => handleMoveDownMaterial(material.id, startIndexMaterials + index)}
                                                        disabled={startIndexMaterials + index === filteredMaterials.length - 1}
                                                        title="Move Down"
                                                    >
                                                        <FaArrowDown />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {currentMaterials.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            No items found in this section. Click "Add Item" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Bottom Center (Materials) */}
                    {totalPagesMaterials > 1 && (
                        <div className="row mt-4">
                            <div className="col-12">
                                <nav aria-label="Materials pagination">
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPageMaterials === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChangeMaterials(currentPageMaterials - 1)}
                                                disabled={currentPageMaterials === 1}
                                            >
                                                <i className="mdi mdi-chevron-left"></i>
                                            </button>
                                        </li>

                                        {Array.from({ length: Math.min(5, totalPagesMaterials) }, (_, i) => {
                                            let pageNum;
                                            if (totalPagesMaterials <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPageMaterials <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPageMaterials >= totalPagesMaterials - 2) {
                                                pageNum = totalPagesMaterials - 4 + i;
                                            } else {
                                                pageNum = currentPageMaterials - 2 + i;
                                            }

                                            return (
                                                <li key={pageNum} className={`page-item ${currentPageMaterials === pageNum ? 'active' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => handlePageChangeMaterials(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </li>
                                            );
                                        })}

                                        <li className={`page-item ${currentPageMaterials === totalPagesMaterials ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChangeMaterials(currentPageMaterials + 1)}
                                                disabled={currentPageMaterials === totalPagesMaterials}
                                            >
                                                <i className="mdi mdi-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Editor Modal */}
            {contentModalOpen && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Section Content</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setContentModalOpen(false);
                                        setEditingContentSectionId(null);
                                        setSectionContent('');
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label ">Content</label>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary d-none"
                                            onClick={() => wordImportInputRef.current?.click()}
                                        >
                                            <i className="fa fa-file-word-o me-1"></i>
                                            Import from Word
                                        </button>
                                    </div>
                                    <input
                                        ref={wordImportInputRef}
                                        type="file"
                                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleWordImport}
                                        style={{ display: 'none' }}
                                    />
                                    <CKEditorWrapper
                                        key={editingContentSectionId ?? 'new'}
                                        data={sectionContent}
                                        onChange={(event, editor, rawHtml) => {
                                            const data = rawHtml !== undefined ? rawHtml : editor.getData();
                                            setSectionContent(data);
                                        }}
                                        config={{
                                            placeholder: 'Enter section content here...',
                                            simpleUpload: {
                                                uploadUrl: `${import.meta.env.VITE_APP_API}/learning-materials/upload-image`,
                                                withCredentials: true,
                                                headers: {
                                                    Authorization: `Bearer ${getToken()}`
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setContentModalOpen(false);
                                        setEditingContentSectionId(null);
                                        setSectionContent('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSaveContent}
                                >
                                    Save Content
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewModalOpen && previewSection && (() => {
                // Helper to resolve the correct image URL (same as LearningMaterials.jsx)
                const getImageUrl = (m) => {
                    if (!m.image_url) return null;
                    if (m.image_url.startsWith('http')) return m.image_url;
                    if (m.isfrontendurl) return m.image_url;
                    return `${import.meta.env.VITE_APP_API}${m.image_url}`;
                };

                // Normalize function for matching
                const normalize = (v) => (v || '').toString().trim().toLowerCase();

                // Get section key (same logic as LearningMaterials.jsx)
                const sectionKey = previewSection.__displayTitle || previewSection.category || previewSection.title;

                // Filter materials for this section (only published ones)
                const sectionMaterials = (materials || [])
                    .filter(m => {
                        const materialCategory = normalize(m.category);
                        const sectionCategory = normalize(sectionKey);
                        return materialCategory === sectionCategory && m.status === 'Published';
                    })
                    .slice(0, 5); // Show first 5 materials like on landing page

                return (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                        <div className="modal-dialog modal-xl modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Preview Section: {previewSection.title}</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setPreviewModalOpen(false);
                                            setPreviewSection(null);
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body" style={{ padding: '2rem' }}>
                                    {/* Preview matches the LearningMaterials.jsx structure */}
                                    <section className="lm-snap-section lm-band">
                                        <div className="container lm-section-block" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                                            <div className="lm-section-header">
                                                <h4 className="lm-section-title">{previewSection.title}</h4>
                                            </div>

                                            {/* Display section content if it exists and is not empty */}
                                            {previewSection.content && !isContentEmpty(previewSection.content) && (
                                                <div
                                                    className="section-content mb-4"
                                                    dangerouslySetInnerHTML={{ __html: previewSection.content }}
                                                    style={{
                                                        fontSize: '1rem',
                                                        lineHeight: '1.6',
                                                        color: '#333'
                                                    }}
                                                />
                                            )}

                                            {/* Display materials */}
                                            <div className="row g-4">
                                                {sectionMaterials.map((m) => (
                                                    <div key={m.id} className="col-lg-4 col-md-6">
                                                        <div className="card h-100 p-0 border lm-material-card d-flex flex-column">
                                                            {m.image_url ? (
                                                                m.external_url ? (
                                                                    <a href={m.external_url} target="_blank" rel="noreferrer">
                                                                        <img
                                                                            src={getImageUrl(m)}
                                                                            className="card-img-top lm-thumb"
                                                                            alt={m.title}
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <img
                                                                        src={getImageUrl(m)}
                                                                        className="card-img-top lm-thumb"
                                                                        alt={m.title}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                )
                                                            ) : (
                                                                <div className="card-img-top lm-thumb d-flex align-items-center justify-content-center bg-light">
                                                                    <span className="text-muted">{m.title}</span>
                                                                </div>
                                                            )}

                                                            <div className="card-body p-3 d-flex flex-column flex-grow-1">
                                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                                    {m.external_url ? (
                                                                        <a href={m.external_url} target="_blank" rel="noreferrer" className="text-decoration-none">
                                                                            <h5 className="card-title fw-bold text-primary">{m.title}</h5>
                                                                        </a>
                                                                    ) : (
                                                                        <h5 className="card-title fw-bold text-primary">{m.title}</h5>
                                                                    )}
                                                                    <span className={`badge lm-badge ${m.type === 'Article' ? 'bg-success' :
                                                                        m.type === 'Video' ? 'bg-warning' :
                                                                            'bg-info'
                                                                        } text-white`}>
                                                                        {m.type || 'Material'}
                                                                    </span>
                                                                </div>

                                                                <div className="flex-grow-1">
                                                                    <p className="card-text text-muted mb-3">{m.description}</p>
                                                                </div>

                                                                <div className="d-flex align-items-center mb-3">
                                                                    <i className="bi bi-tags me-1 text-primary"></i>
                                                                    <small className="text-muted lm-tag">{m.category || 'Uncategorized'}</small>
                                                                </div>

                                                                <div className="mt-auto">
                                                                    {m.downloadable_file_url ? (
                                                                        <a className="btn btn-info w-100" href={`${import.meta.env.VITE_APP_API || ''}${m.downloadable_file_url}`} download><i className="fa-solid fa-download me-1"></i>Download</a>
                                                                    ) : m.external_url ? (
                                                                        <a className="btn btn-info w-100" href={m.external_url} target="_blank" rel="noreferrer">Read More</a>
                                                                    ) : (
                                                                        <a className="btn btn-info w-100" href={`/learning-materials/${m.id}`}>Read More</a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* 
                                                {sectionMaterials.length === 0 && (
                                                    <div className="pt-2"><Empty title="Oops! No materials in this section yet." /></div>
                                                )} */}
                                            </div>
                                        </div>
                                    </section>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setPreviewModalOpen(false);
                                            setPreviewSection(null);
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

export default ManageLearningMaterialsUnified;
