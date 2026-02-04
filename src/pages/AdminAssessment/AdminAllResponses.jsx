import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import '../UserAssessment/AssessmentDetails.css';
import * as XLSX from 'xlsx';
import api from '../../utils/api';
import { getScoreColor } from '../../utils/scoreUtils';
import { hasPermission, Permission } from '../../utils/permissions';
import Swal from 'sweetalert2';

function AdminAllResponses() {
    const navigate = useNavigate();
    const [allResponses, setAllResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('prerequisites');
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Filter and sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFirm, setSelectedFirm] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [filterLatestOnly, setFilterLatestOnly] = useState(false);
    const [sortBy, setSortBy] = useState('year');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        // Fetch all assessment responses
        api.get('/assessment/user/v2/get-all-responses-2')
            .then(res => {
                const data = res.data;
                console.log('All Assessment Responses:', data);
                setAllResponses(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching all responses:', err);
                setLoading(false);
            });
    }, [navigate]);

    const handleViewResponse = (response) => {
        setSelectedResponse(response);
        // Set initial tab based on available data
        // Check for consumption data first (Prerequisites)
        if (response.consumption && Object.keys(response.consumption).length > 0) {
            setActiveTab('prerequisites');
        } else {
            // Otherwise check for other categories
            const responses = response.responses || response.assessment_responses || [];
            // Helper function to group responses (inline version)
            const groupResponses = (responses) => {
                if (!responses || !Array.isArray(responses) || responses.length === 0) {
                    return {};
                }
                const filtered = responses.filter((r) => {
                    const hasResponse = !!r;
                    const hasQuestion = !!r?.question;
                    const hasCategory = !!r?.question?.category;
                    const isNotYearSelection = r?.question?.category !== 'Year Selection';
                    const isQuestionWithCategory = !!r?.category && !r?.question;
                    const questionCategory = r?.category || r?.question?.category;
                    const isNotYearSelectionAlt = questionCategory !== 'Year Selection';
                    const isFlatStructure = !!r?.questionId && !!r?.category && !!r?.text;
                    const isFlatStructureValid = isFlatStructure && r?.category !== 'Year Selection';
                    return (hasResponse && hasQuestion && hasCategory && isNotYearSelection) ||
                        (hasResponse && isQuestionWithCategory && isNotYearSelectionAlt) ||
                        (hasResponse && isFlatStructureValid);
                });
                return filtered.reduce((acc, r, index) => {
                    const category = r.question?.category || r.category;
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push({ ...r, originalIndex: index + 1 });
                    return acc;
                }, {});
            };
            const groupedResponses = groupResponses(responses);
            if (groupedResponses['Environment'] && groupedResponses['Environment'].length > 0) {
                setActiveTab('environmental');
            } else if (groupedResponses['Social'] && groupedResponses['Social'].length > 0) {
                setActiveTab('social');
            } else if (groupedResponses['Governance'] && groupedResponses['Governance'].length > 0) {
                setActiveTab('governance');
            } else {
                setActiveTab('prerequisites');
            }
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedResponse(null);
    };

    const handleDeleteResponse = (response) => {
        const responseId = response.id || response._id;
        if (!responseId) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Cannot delete: missing response id.' });
            return;
        }
        const userName = response.user_info?.[0]?.first_name || response.user_info?.[0]?.last_name
            ? [response.user_info[0].first_name, response.user_info[0].last_name].filter(Boolean).join(' ')
            : response.user_id || 'Unknown';
        const year = response.assessment_year || response.year || '';
        Swal.fire({
            title: 'Delete response?',
            html: `This will permanently delete the assessment response for <strong>${userName}</strong> (year ${year}).`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Delete'
        }).then((result) => {
            if (!result.isConfirmed) return;
            api.delete(`/assessment/admin/v2/delete-response/${responseId}`)
                .then(() => {
                    setAllResponses(prev => prev.filter(r => (r.id || r._id) !== responseId));
                    Swal.fire({ icon: 'success', title: 'Deleted', text: 'Response deleted successfully.' });
                })
                .catch((err) => {
                    const msg = err.response?.data?.detail || err.message || 'Failed to delete response.';
                    Swal.fire({ icon: 'error', title: 'Error', text: msg });
                });
        });
    };

    // Get unique firms/companies for filter dropdown
    const getUniqueFirms = () => {
        const firms = allResponses
            .map(response => response.user_info?.[0]?.firm_name || '')
            .filter(firm => firm && firm.trim() !== '')
            .filter((firm, index, self) => self.indexOf(firm) === index)
            .sort();
        return firms;
    };

    // Get unique years for filter dropdown
    const getUniqueYears = () => {
        const years = allResponses
            .map(response => response.assessment_year || response.year)
            .filter(year => year && year.toString().trim() !== '')
            .filter((year, index, self) => self.indexOf(year) === index)
            .sort((a, b) => b - a);
        return years;
    };

    // Get unique sectors for filter dropdown
    const getUniqueSectors = () => {
        const sectors = allResponses
            .map(response => response.user_info?.[0]?.sector || '')
            .filter(sector => sector && sector.trim() !== '')
            .filter((sector, index, self) => self.indexOf(sector) === index)
            .sort();
        return sectors;
    };

    // Get unique sizes for filter dropdown
    const getUniqueSizes = () => {
        const sizes = allResponses
            .map(response => response.user_info?.[0]?.business_size || '')
            .filter(size => size && size.trim() !== '')
            .filter((size, index, self) => self.indexOf(size) === index)
            .sort();
        return sizes;
    };

    // Get unique industries for filter dropdown
    const getUniqueIndustries = () => {
        const industries = allResponses
            .map(response => response.user_info?.[0]?.industry || '')
            .filter(industry => industry && industry.trim() !== '')
            .filter((industry, index, self) => self.indexOf(industry) === index)
            .sort();
        return industries;
    };

    // Get unique locations for filter dropdown
    const getUniqueLocations = () => {
        const locations = allResponses
            .map(response => response.user_info?.[0]?.location || response.user_info?.[0]?.address?.location || '')
            .filter(location => location && location.trim() !== '')
            .filter((location, index, self) => self.indexOf(location) === index)
            .sort();
        return locations;
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedFirm('');
        setSelectedYear('');
        setSelectedSector('');
        setSelectedSize('');
        setSelectedIndustry('');
        setSelectedLocation('');
        setFilterLatestOnly(false);
    };

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

    // Get assessment count for a user-year combination
    const getAssessmentCount = useMemo(() => {
        const countMap = {};
        allResponses.forEach(response => {
            const userId = response.user_id;
            const year = response.assessment_year || response.year;
            const key = `${userId}_${year}`;
            countMap[key] = (countMap[key] || 0) + 1;
        });
        return countMap;
    }, [allResponses]);

    // Filter and sort responses
    const filteredAndSortedResponses = useMemo(() => {
        let filtered = allResponses.filter(response => {
            // Filter by search term (name/email/company/sector/size/industry/state)
            if (searchTerm) {
                const name = response.user_info && response.user_info.length > 0
                    ? `${response.user_info[0].first_name || ''} ${response.user_info[0].last_name || ''}`.trim()
                    : response.user_name || '';
                const email = response.user_info && response.user_info.length > 0
                    ? response.user_info[0].email
                    : '';
                const companyName = response.user_info?.[0]?.firm_name || '';
                const sector = response.user_info?.[0]?.sector || '';
                const size = response.user_info?.[0]?.business_size || '';
                const industry = response.user_info?.[0]?.industry || '';
                const location = response.user_info?.[0]?.location || response.user_info?.[0]?.address?.location || '';

                const searchLower = searchTerm.toLowerCase();
                if (!name.toLowerCase().includes(searchLower) &&
                    !email.toLowerCase().includes(searchLower) &&
                    !companyName.toLowerCase().includes(searchLower) &&
                    !sector.toLowerCase().includes(searchLower) &&
                    !size.toLowerCase().includes(searchLower) &&
                    !industry.toLowerCase().includes(searchLower) &&
                    !location.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Filter by firm
            if (selectedFirm) {
                const companyName = response.user_info?.[0]?.firm_name || '';
                if (!companyName.toLowerCase().includes(selectedFirm.toLowerCase())) {
                    return false;
                }
            }

            // Filter by year
            if (selectedYear) {
                const year = response.assessment_year || response.year || '';
                if (year.toString() !== selectedYear) {
                    return false;
                }
            }

            // Filter by sector
            if (selectedSector) {
                const sector = response.user_info?.[0]?.sector || '';
                if (!sector.toLowerCase().includes(selectedSector.toLowerCase())) {
                    return false;
                }
            }

            // Filter by size
            if (selectedSize) {
                const size = response.user_info?.[0]?.business_size || '';
                if (!size.toLowerCase().includes(selectedSize.toLowerCase())) {
                    return false;
                }
            }

            // Filter by industry
            if (selectedIndustry) {
                const industry = response.user_info?.[0]?.industry || '';
                if (!industry.toLowerCase().includes(selectedIndustry.toLowerCase())) {
                    return false;
                }
            }

            // Filter by location
            if (selectedLocation) {
                const location = response.user_info?.[0]?.location || response.user_info?.[0]?.address?.location || '';
                if (!location.toLowerCase().includes(selectedLocation.toLowerCase())) {
                    return false;
                }
            }

            // Filter by latest only (show only latest assessments, excluding previous attempts for same year)
            if (filterLatestOnly) {
                const userId = response.user_id;
                const year = response.assessment_year || response.year;
                const key = `${userId}_${year}`;
                const assessmentCount = getAssessmentCount[key] || 1;
                
                // If multiple assessments exist for this year, only show the latest one (is_selected === true)
                // If only one assessment exists, always show it
                if (assessmentCount > 1 && !response.is_selected) {
                    return false;
                }
            }

            return true;
        });

        // Sort responses
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'name':
                    const nameA = a.user_info && a.user_info.length > 0
                        ? `${a.user_info[0].first_name || ''} ${a.user_info[0].last_name || ''}`.trim()
                        : a.user_name || '';
                    const nameB = b.user_info && b.user_info.length > 0
                        ? `${b.user_info[0].first_name || ''} ${b.user_info[0].last_name || ''}`.trim()
                        : b.user_name || '';
                    valueA = nameA.toLowerCase();
                    valueB = nameB.toLowerCase();
                    break;
                case 'firm':
                    valueA = (a.user_info?.[0]?.firm_name || '').toLowerCase();
                    valueB = (b.user_info?.[0]?.firm_name || '').toLowerCase();
                    break;
                case 'sector':
                    valueA = (a.user_info?.[0]?.sector || '').toLowerCase();
                    valueB = (b.user_info?.[0]?.sector || '').toLowerCase();
                    break;
                case 'size':
                    valueA = (a.user_info?.[0]?.business_size || '').toLowerCase();
                    valueB = (b.user_info?.[0]?.business_size || '').toLowerCase();
                    break;
                case 'industry':
                    valueA = (a.user_info?.[0]?.industry || '').toLowerCase();
                    valueB = (b.user_info?.[0]?.industry || '').toLowerCase();
                    break;
                case 'location':
                    valueA = (a.user_info?.[0]?.location || a.user_info?.[0]?.address?.location || '').toLowerCase();
                    valueB = (b.user_info?.[0]?.location || b.user_info?.[0]?.address?.location || '').toLowerCase();
                    break;
                case 'year':
                    valueA = parseInt(a.assessment_year || a.year || 0);
                    valueB = parseInt(b.assessment_year || b.year || 0);
                    break;
                case 'totalScore':
                    valueA = a.score?.total_score || 0;
                    valueB = b.score?.total_score || 0;
                    break;
                case 'submittedAt':
                    valueA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
                    valueB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
                    break;
                default:
                    valueA = parseInt(a.assessment_year || a.year || 0);
                    valueB = parseInt(b.assessment_year || b.year || 0);
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        return filtered;
    }, [allResponses, searchTerm, selectedFirm, selectedYear, selectedSector, selectedSize, selectedIndustry, selectedLocation, filterLatestOnly, sortBy, sortOrder]);

    // Pagination calculations
    const totalItems = filteredAndSortedResponses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedResponses = filteredAndSortedResponses.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedFirm, selectedYear, selectedSector, selectedSize, selectedIndustry, selectedLocation, filterLatestOnly, sortBy, sortOrder]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Export to Excel function
    const exportToExcel = () => {
        if (filteredAndSortedResponses.length === 0) {
            alert('No data to export');
            return;
        }

        const excelData = filteredAndSortedResponses.map((response, index) => {
            const userInfo = response.user_info && response.user_info.length > 0 ? response.user_info[0] : {};
            const responses = response.responses || response.assessment_responses || [];
            const groupedResponses = getGroupedResponses(responses);
            
            // Calculate status for this response
            const userId = response.user_id;
            const year = response.assessment_year || response.year;
            const key = `${userId}_${year}`;
            const assessmentCount = getAssessmentCount[key] || 1;
            let status = 'Assessed';
            if (assessmentCount > 1) {
                status = response.is_selected ? 'Retake' : 'Assessed';
            }
            
            const flattenedData = {
                'Response #': index + 1,
                'Name': `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || response.user_name || 'N/A',
                'Email': userInfo.email || 'N/A',
                'Company': userInfo.firm_name || 'N/A',
                'Assessment Year': response.assessment_year || response.year || 'N/A',
                'Sector': userInfo.sector || 'N/A',
                'Size': userInfo.business_size || 'N/A',
                'Industry': userInfo.industry || 'N/A',
                'Location': userInfo.location || userInfo.address?.location || 'N/A',
                'User ID': response.user_id || 'N/A',
                'Environment Score': response.score?.Environment || 'N/A',
                'Social Score': response.score?.Social || 'N/A',
                'Governance Score': response.score?.Governance || 'N/A',
                'Total Score': response.score?.total_score ? parseFloat((((response.score.total_score / (response.score.max_score || 300)) * 100).toFixed(2))) : 'N/A',
                'Submitted At': response.submitted_at ? formatDate(response.submitted_at) : 'N/A',
                'Status': status
            };

            // Add consumption data (Prerequisites)
            if (response.consumption && typeof response.consumption === 'object') {
                Object.entries(response.consumption).forEach(([key, value]) => {
                    const consumptionValue = Array.isArray(value) ? value[0] : value;
                    const unit = key.includes('Electricity') ? ' kWh' :
                        key.includes('Water') ? ' L' :
                            key.includes('Petrol') || key.includes('Diesel') ? ' L' : '';
                    flattenedData[`Prerequisites - ${key}`] = consumptionValue ? `${consumptionValue}${unit}` : 'N/A';
                });
            }

            let questionCounter = 1;
            ['Environment', 'Social', 'Governance'].forEach(category => {
                const categoryResponses = groupedResponses[category] || [];
                categoryResponses.forEach((questionResponse) => {
                    const questionText = questionResponse.question?.text || questionResponse.text || 'Question text not available';
                    const answer = (() => {
                        if (questionResponse.answer?.selected_option_text && questionResponse.answer.selected_option_text.length > 0) {
                            return questionResponse.answer.selected_option_text.join(', ');
                        } else if (questionResponse.answer?.selected_option_submarks && questionResponse.answer.selected_option_submarks.length > 0) {
                            const totalScore = questionResponse.answer.selected_option_submarks.reduce((sum, subMark) => sum + (subMark || 0), 0);
                            const maxScore = questionResponse.answer.total_possible_score || 0;
                            return `${totalScore} / ${maxScore} points`;
                        } else if (questionResponse.answer?.question_score !== undefined) {
                            return `${questionResponse.answer.question_score} / ${questionResponse.answer.question_max} points`;
                        } else if (questionResponse.selectedOptions && questionResponse.selectedOptions.length > 0) {
                            return questionResponse.selectedOptions.join(', ');
                        } else {
                            return 'No response';
                        }
                    })();
                    
                    flattenedData[`Q${questionCounter} (${category})`] = questionText;
                    flattenedData[`Q${questionCounter} Answer (${category})`] = answer;
                    questionCounter++;
                });
            });

            return flattenedData;
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        const colWidths = [
            { wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 15 },
            { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 },
        ];
        
        // Add column widths for consumption data (Prerequisites)
        const consumptionColumns = Object.keys(excelData[0] || {}).filter(key => key.includes('Prerequisites -'));
        consumptionColumns.forEach(() => {
            colWidths.push({ wch: 25 });
        });
        
        const questionColumns = Object.keys(excelData[0] || {}).filter(key => key.includes('Q'));
        questionColumns.forEach(() => {
            colWidths.push({ wch: 30 });
            colWidths.push({ wch: 20 });
        });
        
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, 'Assessment Responses');

        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `assessment_responses_${timestamp}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const getGroupedResponses = (responses) => {
        if (!responses || !Array.isArray(responses) || responses.length === 0) {
            return {};
        }

        const filteredResponses = responses.filter((response) => {
            const hasResponse = !!response;
            const hasQuestion = !!response?.question;
            const hasCategory = !!response?.question?.category;
            const isNotYearSelection = response?.question?.category !== 'Year Selection';
            const isQuestionWithCategory = !!response?.category && !response?.question;
            const questionCategory = response?.category || response?.question?.category;
            const isNotYearSelectionAlt = questionCategory !== 'Year Selection';
            const isFlatStructure = !!response?.questionId && !!response?.category && !!response?.text;
            const isFlatStructureValid = isFlatStructure && response?.category !== 'Year Selection';

            return (hasResponse && hasQuestion && hasCategory && isNotYearSelection) ||
                (hasResponse && isQuestionWithCategory && isNotYearSelectionAlt) ||
                (hasResponse && isFlatStructureValid);
        });

        const grouped = filteredResponses.reduce((acc, response, index) => {
            const category = response.question?.category || response.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({ ...response, originalIndex: index + 1 });
            return acc;
        }, {});

        return grouped;
    };

    // Render question response details
    const renderQuestionResponse = (response, categoryColor) => {
        const category = response.question?.category || response.category;
        const isPrerequisite = category === 'Prerequisites';
        
        // For Prerequisites, check if answer is a number or exists
        const hasAnswer = isPrerequisite 
            ? (response.answer !== undefined && response.answer !== null && response.answer !== '')
            : (response.answer?.selected_option_submarks ||
                response.answer?.selected_option_text ||
                response.selectedOptions ||
                response.question_score !== undefined);

        return (
            <div key={response.originalIndex} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease'
            }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-2">
                        <span style={{
                            background: categoryColor,
                            color: 'white',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            minWidth: '45px',
                            textAlign: 'center'
                        }}>
                            Q{response.originalIndex}
                        </span>
                        <span style={{
                            background: '#f8f9fa',
                            color: '#6c757d',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 500
                        }}>
                            {category}
                        </span>
                    </div>
                    <span style={{
                        background: hasAnswer ? '#d4edda' : '#fff3cd',
                        color: hasAnswer ? '#155724' : '#856404',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <i className={`fas ${hasAnswer ? 'fa-check-circle' : 'fa-minus-circle'}`}></i>
                        {hasAnswer ? 'Answered' : 'Not Answered'}
                    </span>
                </div>
                <div style={{
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: '#2c3e50',
                    lineHeight: 1.6,
                    marginBottom: '1rem'
                }}>
                    {response.question?.text || response.text || 'Question text not available'}
                </div>
                <div style={{
                    background: hasAnswer ? '#f0f9ff' : '#f8f9fa',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: `1px solid ${hasAnswer ? '#e3f2fd' : '#e9ecef'}`
                }}>
                    <div className="d-flex align-items-center">
                        <strong style={{ color: '#6c757d', fontSize: '0.9rem', marginRight: '0.5rem' }}>Response:</strong>
                        <span style={{
                            color: hasAnswer ? (isPrerequisite ? '#ff9800' : categoryColor.split(' ')[0]) : '#6c757d',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                        }}>
                            {(() => {
                                // Handle Prerequisites (simple number input)
                                if (isPrerequisite) {
                                    if (response.answer !== undefined && response.answer !== null && response.answer !== '') {
                                        return typeof response.answer === 'number' ? response.answer.toString() : response.answer;
                                    }
                                    return 'No response';
                                }
                                
                                // Handle other categories
                                if (response.answer?.selected_option_text && response.answer.selected_option_text.length > 0) {
                                    return response.answer.selected_option_text.join(', ');
                                } else if (response.answer?.selected_option_submarks && response.answer.selected_option_submarks.length > 0) {
                                    const totalScore = response.answer.selected_option_submarks.reduce((sum, subMark) => sum + (subMark || 0), 0);
                                    const maxScore = response.answer.total_possible_score || 0;
                                    return `${totalScore} / ${maxScore} points`;
                                } else if (response.answer?.question_score !== undefined) {
                                    return `${response.answer.question_score} / ${response.answer.question_max} points`;
                                } else if (response.selectedOptions && response.selectedOptions.length > 0) {
                                    return response.selectedOptions.join(', ');
                                } else {
                                    return 'No response';
                                }
                            })()}
                        </span>
                    </div>

                    {!isPrerequisite && response.answer?.selected_option_text && response.answer.selected_option_text.length > 0 && (
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e9ecef' }}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div>
                                        <small style={{ color: '#6c757d', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                                            Selected Options:
                                        </small>
                                        <div className="d-flex flex-wrap gap-2">
                                            {response.answer.selected_option_text.map((text, idx) => (
                                                <span key={idx} style={{
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    color: 'white',
                                                    padding: '0.4rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500
                                                }}>
                                                    {text}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div>
                                        <small style={{ color: '#6c757d', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                                            Scoring:
                                        </small>
                                        <div style={{
                                            background: 'white',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e9ecef'
                                        }}>
                                            <div style={{ fontSize: '0.9rem', color: '#2c3e50', fontWeight: 600 }}>
                                                {response.answer.total_selected_score || 0} / {response.answer.total_possible_score || 0} points
                                            </div>
                                            {response.answer.question_score !== undefined && (
                                                <div style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '0.25rem' }}>
                                                    Final: {response.answer.question_score.toFixed(2)} / {response.answer.question_max || 0}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render tab content
    const renderTabContent = () => {
        if (!selectedResponse) return null;

        const responses = selectedResponse.responses || selectedResponse.assessment_responses || [];
        const groupedResponses = getGroupedResponses(responses);

        if (activeTab === 'prerequisites') {
            const consumption = selectedResponse.consumption;
            if (!consumption || Object.keys(consumption).length === 0) {
                return (
                    <div className="text-center py-5" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '3rem'
                    }}>
                        <i className="fas fa-clipboard-check fa-3x mb-3" style={{ color: '#ff9800', opacity: 0.3 }}></i>
                        <h5 className="text-muted mb-2">No Prerequisites Data</h5>
                        <p className="text-muted ">No consumption data found for this assessment.</p>
                    </div>
                );
            }
            return (
                <div>
                    <h4 className="mb-4" style={{
                        color: '#2c3e50',
                        fontWeight: 600,
                        fontSize: '1.25rem'
                    }}>
                        <i className="fas fa-chart-bar me-1" style={{ color: '#ff9800' }}></i>
                        Resource Consumption Data
                    </h4>
                    <div className="row">
                        {Object.entries(consumption).map(([key, value]) => {
                            const consumptionValue = Array.isArray(value) ? value[0] : value;
                            const unit = key.includes('Electricity') ? ' kWh' :
                                key.includes('Water') ? ' L' :
                                    key.includes('Petrol') || key.includes('Diesel') ? ' L' : '';
                            
                            return (
                                <div key={key} className="col-md-6 col-lg-3 mb-3">
                                    <div style={{
                                        background: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px',
                                        padding: '1.5rem',
                                        textAlign: 'center',
                                        transition: 'all 0.3s ease',
                                        height: '100%'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                        e.currentTarget.style.borderColor = '#ff9800';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = '#e9ecef';
                                    }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <h6 style={{
                                                color: '#495057',
                                                fontWeight: 500,
                                                fontSize: '0.9rem',
                                                margin: 0,
                                                lineHeight: 1.4
                                            }}>
                                                {key}
                                            </h6>
                                        </div>
                                        <div style={{
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            color: '#2c3e50',
                                            marginBottom: '0.5rem'
                                        }}>
                                            {consumptionValue}
                                            <span style={{
                                                fontSize: '1rem',
                                                color: '#6c757d',
                                                fontWeight: 500
                                            }}>
                                                {unit}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: '#6c757d',
                                            fontStyle: 'italic'
                                        }}>
                                            per month
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (activeTab === 'environmental') {
            const environmentalResponses = groupedResponses['Environment'] || [];
            if (environmentalResponses.length === 0) {
                return (
                    <div className="text-center py-5" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '3rem'
                    }}>
                        <i className="fas fa-leaf fa-3x mb-3" style={{ color: '#28a745', opacity: 0.3 }}></i>
                        <h5 className="text-muted mb-2">No Environmental Responses</h5>
                        <p className="text-muted ">No Environmental responses found for this assessment.</p>
                    </div>
                );
            }
            return (
                <div>
                    {environmentalResponses.map((response) => renderQuestionResponse(response, 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'))}
                </div>
            );
        }

        if (activeTab === 'social') {
            const socialResponses = groupedResponses['Social'] || [];
            if (socialResponses.length === 0) {
                return (
                    <div className="text-center py-5" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '3rem'
                    }}>
                        <i className="fas fa-users fa-3x mb-3" style={{ color: '#007bff', opacity: 0.3 }}></i>
                        <h5 className="text-muted mb-2">No Social Responses</h5>
                        <p className="text-muted ">No Social responses found for this assessment.</p>
                    </div>
                );
            }
            return (
                <div>
                    {socialResponses.map((response) => renderQuestionResponse(response, 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'))}
                </div>
            );
        }

        if (activeTab === 'governance') {
            const governanceResponses = groupedResponses['Governance'] || [];
            if (governanceResponses.length === 0) {
                return (
                    <div className="text-center py-5" style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '3rem'
                    }}>
                        <i className="fas fa-shield-alt fa-3x mb-3" style={{ color: '#6f42c1', opacity: 0.3 }}></i>
                        <h5 className="text-muted mb-2">No Governance Responses</h5>
                        <p className="text-muted ">No Governance responses found for this assessment.</p>
                    </div>
                );
            }
            return (
                <div>
                    {governanceResponses.map((response) => renderQuestionResponse(response, 'linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%)'))}
                </div>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <Title title="All Assessment Responses" breadcrumb={[["Assessment", "/assessment"], "All Responses"]} />
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Title title="All Assessment Responses" breadcrumb={[["Assessment", "/assessment"], "All Responses"]} />

            {/* Filters and Controls */}
            <div className="row mb-1">
                <div className="col-lg-4 col-md-6 mb-3">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="fas fa-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by name, email, company, sector, size, industry, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedFirm}
                        onChange={(e) => setSelectedFirm(e.target.value)}
                    >
                        <option value="">All Firms</option>
                        {getUniqueFirms().map((firm, index) => (
                            <option key={index} value={firm}>
                                {firm}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="">All Years</option>
                        {getUniqueYears().map((year, index) => (
                            <option key={index} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                    >
                        <option value="">All Sectors</option>
                        {getUniqueSectors().map((sector, index) => (
                            <option key={index} value={sector}>
                                {sector}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                    >
                        <option value="">All Sizes</option>
                        {getUniqueSizes().map((size, index) => (
                            <option key={index} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="row mb-1">
                <div className="col-lg-3 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                    >
                        <option value="">All Industries</option>
                        {getUniqueIndustries().map((industry, index) => (
                            <option key={index} value={industry}>
                                {industry}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-3 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="">All Locations</option>
                        {getUniqueLocations().map((location, index) => (
                            <option key={index} value={location}>
                                {location}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-lg-6 col-md-6 mb-3">
                    {(searchTerm || selectedFirm || selectedYear || selectedSector || selectedSize || selectedIndustry || selectedLocation || filterLatestOnly) && (
                        <button
                            className="btn"
                            onClick={clearFilters}
                        >
                            <i className="fas fa-times me-1"></i>
                            Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Latest Filter */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="filterLatestOnly"
                            checked={filterLatestOnly}
                            onChange={(e) => setFilterLatestOnly(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="filterLatestOnly">
                            <i className="fas fa-filter me-1"></i>
                            Show only latest assessments (exclude previous attempts for same year)
                        </label>
                    </div>
                </div>
            </div>

            {/* Sort Controls */}
            <div className="row mb-3">
                <div className="col-lg-3 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="year">Sort by Year</option>
                        <option value="name">Sort by Name</option>
                        <option value="firm">Sort by Firm</option>
                        <option value="sector">Sort by Sector</option>
                        <option value="size">Sort by Size</option>
                        <option value="industry">Sort by Industry</option>
                        <option value="location">Sort by Location</option>
                        <option value="totalScore">Sort by Total Score</option>
                        <option value="submittedAt">Sort by Submitted Date</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
                <div className="col-lg-7 col-md-12 mb-3">
                    <div className="d-flex justify-content-end">
                        <button
                            className="btn btn-success"
                            onClick={exportToExcel}
                            disabled={filteredAndSortedResponses.length === 0}
                        >
                            <i className="fas fa-file-excel me-1"></i>
                            Download Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Items Per Page - Top Right */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                        <label className="form-label text-muted">Show:</label>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
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

            {/* Table */}
            <div className="row">
                <div className="col-12">
                    <div className="table-scroll-top overflow-y-auto card shadow-sm rounded bg-white">
                        <table className="table  table-nowrap rounded">
                            <thead className="table-dark">
                                <tr>
                                    <th>No.</th>
                                    <th>Actions</th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('name')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Name
                                        {sortBy === 'name' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('firm')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Firm
                                        {sortBy === 'firm' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('year')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Year
                                        {sortBy === 'year' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('sector')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Sector
                                        {sortBy === 'sector' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('size')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Size
                                        {sortBy === 'size' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('industry')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Industry
                                        {sortBy === 'industry' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('location')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Location
                                        {sortBy === 'location' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th>Status</th>
                                    <th>Email</th>
                                    <th>Environment</th>
                                    <th>Social</th>
                                    <th>Governance</th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('totalScore')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Total Score
                                        {sortBy === 'totalScore' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="sortable"
                                        onClick={() => handleSort('submittedAt')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Submitted At
                                        {sortBy === 'submittedAt' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                   
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedResponses.map((response, index) => {
                                    const userInfo = response.user_info && response.user_info.length > 0 ? response.user_info[0] : {};
                                    const userName = userInfo.first_name || userInfo.last_name
                                        ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim()
                                        : userInfo.email || response.user_name || 'N/A';
                                    const firmName = userInfo.firm_name || 'N/A';
                                    const email = userInfo.email || 'N/A';
                                    const year = response.assessment_year || response.year || 'N/A';
                                    const sector = userInfo.sector || 'N/A';
                                    const size = userInfo.business_size || 'N/A';
                                    const industry = userInfo.industry || 'N/A';
                                    const location = userInfo.location || userInfo.address?.location || 'N/A';
                                    const envScore = response.score?.Environment || 0;
                                    const socialScore = response.score?.Social || 0;
                                    const govScore = response.score?.Governance || 0;
                                    const totalScoreRaw = response.score?.total_score || 0;
                                    const maxScore = response.score?.max_score || 300;
                                    const totalScore = totalScoreRaw > 0 ? ((totalScoreRaw / maxScore) * 100).toFixed(2) : 0;

                                    return (
                                        <tr key={index}>
                                            <td>
                                                <span className="d-flex justify-content-center">{startIndex + index + 1}</span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1 justify-content-center flex-wrap">
                                                    <button
                                                        className="btn btn-sm"
                                                        onClick={() => handleViewResponse(response)}
                                                        title="View Details"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    {hasPermission(Permission.DELETE_ASSESSMENTS) && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeleteResponse(response)}
                                                            title="Delete response"
                                                        >
                                                            <i className="fas fa-trash-alt"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{userName}</strong>
                                            </td>
                                            <td>{firmName}</td>
                                            <td>
                                                <span className="fw-medium">{year}</span>
                                            </td>
                                            <td>
                                                <small className="text-muted">{sector}</small>
                                            </td>
                                            <td>
                                                <small className="text-muted">{size}</small>
                                            </td>
                                            <td>
                                                <small className="text-muted">{industry}</small>
                                            </td>
                                            <td>
                                                <small className="text-muted">{location}</small>
                                            </td>
                                            <td>
                                                {(() => {
                                                    const userId = response.user_id;
                                                    const year = response.assessment_year || response.year;
                                                    const key = `${userId}_${year}`;
                                                    const assessmentCount = getAssessmentCount[key] || 1;
                                                    
                                                    if (assessmentCount === 1) {
                                                        // Only one assessment for this year -> "Assessed" (blue)
                                                        return (
                                                            <span className="badge bg-info">
                                                                <i className="fas fa-check-circle me-1"></i>
                                                                Assessed
                                                            </span>
                                                        );
                                                    } else {
                                                        // Multiple assessments for this year
                                                        if (response.is_selected) {
                                                            // Latest one -> "Retake" (green)
                                                            return (
                                                                <span className="badge bg-success">
                                                                    <i className="fas fa-redo me-1"></i>
                                                                    Retake
                                                                </span>
                                                            );
                                                        } else {
                                                            // Not latest -> "Assessed" (blue)
                                                            return (
                                                                <span className="badge bg-info">
                                                                    <i className="fas fa-check-circle me-1"></i>
                                                                    Assessed
                                                                </span>
                                                            );
                                                        }
                                                    }
                                                })()}
                                            </td>
                                            <td>
                                                <small className="text-muted">{email}</small>
                                            </td>
                                            <td>
                                                <span className={getScoreColor(envScore)}>
                                                    {envScore}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getScoreColor(socialScore)}>
                                                    {socialScore}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={getScoreColor(govScore)}>
                                                    {govScore}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`fw-bold ${getScoreColor(parseFloat(totalScore))}`}>
                                                    {totalScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {formatDate(response.submitted_at)}
                                                </small>
                                            </td>
                                           
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalItems === 0 && (
                        <div className="text-center py-5">
                            <i className="fas fa-search fa-3x text-muted mb-3"></i>
                            <h5>No responses found</h5>
                            <p className="text-muted">Try adjusting your search criteria or filters.</p>
                        </div>
                    )}
                </div>
            </div>


            {/* Pagination - Bottom Center */}
            {totalPages > 1 && (
                <div className="row">
                    <div className="col-12">
                        <nav aria-label="Responses pagination">
                            <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                        </li>

                                        {(() => {
                                            const pages = [];
                                            const maxVisiblePages = 5;
                                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                            if (endPage - startPage + 1 < maxVisiblePages) {
                                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                            }

                                            if (startPage > 1) {
                                                pages.push(
                                                    <li key={1} className="page-item">
                                                        <button className="page-link" onClick={() => setCurrentPage(1)}>
                                                            1
                                                        </button>
                                                    </li>
                                                );
                                                if (startPage > 2) {
                                                    pages.push(
                                                        <li key="ellipsis-start" className="page-item disabled">
                                                            <span className="page-link">...</span>
                                                        </li>
                                                    );
                                                }
                                            }

                                            for (let i = startPage; i <= endPage; i++) {
                                                pages.push(
                                                    <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(i)}>
                                                            {i}
                                                        </button>
                                                    </li>
                                                );
                                            }

                                            if (endPage < totalPages) {
                                                if (endPage < totalPages - 1) {
                                                    pages.push(
                                                        <li key="ellipsis-end" className="page-item disabled">
                                                            <span className="page-link">...</span>
                                                        </li>
                                                    );
                                                }
                                                pages.push(
                                                    <li key={totalPages} className="page-item">
                                                        <button className="page-link" onClick={() => setCurrentPage(totalPages)}>
                                                            {totalPages}
                                                        </button>
                                                    </li>
                                                );
                                            }

                                            return pages;
                                        })()}

                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                        </div>
                    </div>
                )}

            {/* Fullscreen Modal */}
            {showModal && selectedResponse && (
                <div
                    className="modal fade show"
                    style={{
                        display: 'block',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1050
                    }}
                    onClick={closeModal}
                >
                    <div
                        className="modal-dialog modal-fullscreen"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content" style={{ height: '100vh', borderRadius: 0 }}>
                            {/* Modal Header */}
                            <div className="modal-header" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                borderBottom: 'none'
                            }}>
                                <div className="d-flex justify-content-between align-items-start w-100">
                                    <div>
                                        <h5 className="modal-title mb-2" style={{ fontWeight: 600 }}>
                                            {selectedResponse.user_info && selectedResponse.user_info.length > 0
                                                ? `${selectedResponse.user_info[0].first_name || ''} ${selectedResponse.user_info[0].last_name || ''}`.trim() || selectedResponse.user_info[0].email
                                                : selectedResponse.user_name || selectedResponse.company_name || 'Response Details'
                                            }
                                        </h5>
                                        <div className="d-flex flex-wrap gap-2 mt-2">
                                            <span style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                backdropFilter: 'blur(10px)'
                                            }}>
                                                <i className="fas fa-calendar me-1"></i>
                                                {selectedResponse.assessment_year || selectedResponse.year || 'N/A'}
                                            </span>
                                            {selectedResponse.user_info && selectedResponse.user_info.length > 0 && selectedResponse.user_info[0]?.firm_name && (
                                                <span style={{
                                                    background: 'rgba(255,255,255,0.2)',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    backdropFilter: 'blur(10px)'
                                                }}>
                                                    <i className="fas fa-building me-1"></i>
                                                    {selectedResponse.user_info[0].firm_name}
                                                </span>
                                            )}
                                        </div>
                                        {selectedResponse.user_info && selectedResponse.user_info.length > 0 && (
                                            <div style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                                <i className="fas fa-envelope me-1"></i>
                                                {selectedResponse.user_info[0].email}
                                            </div>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        {selectedResponse.score?.total_score !== undefined && (
                                            <div style={{
                                                background: 'rgba(255,255,255,0.2)',
                                                backdropFilter: 'blur(10px)',
                                                borderRadius: '12px',
                                                padding: '1rem',
                                                textAlign: 'center',
                                                minWidth: '100px'
                                            }}>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.25rem' }}>Total Score</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{((selectedResponse.score.total_score / (selectedResponse.score.max_score || 300)) * 100).toFixed(2)}%</div>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            className="btn-close btn-close-white px-2 pe-5"
                                            onClick={closeModal}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="modal-body" style={{ overflowY: 'auto', background: '#fafafa', padding: 0 }}>
                                {/* User Information and Scores Cards */}
                                {selectedResponse.user_info && selectedResponse.user_info.length > 0 && (
                                    <div className="p-4" style={{ background: 'white', borderBottom: '2px solid #f0f0f0' }}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div style={{
                                                    background: '#f8f9fa',
                                                    borderRadius: '12px',
                                                    padding: '1.25rem',
                                                    border: '1px solid #e9ecef'
                                                }}>
                                                    <h6 className="mb-3" style={{
                                                        color: '#667eea',
                                                        fontWeight: 600,
                                                        fontSize: '0.9rem',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        <i className="fas fa-user me-1"></i>
                                                        User Information
                                                    </h6>
                                                    <div className="mb-2">
                                                        <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>Name</small>
                                                        <div style={{ fontWeight: 600, color: '#2c3e50', marginTop: '0.25rem' }}>
                                                            {`${selectedResponse.user_info[0].first_name || ''} ${selectedResponse.user_info[0].last_name || ''}`.trim()}
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>Email</small>
                                                        <div style={{ fontWeight: 500, color: '#2c3e50', marginTop: '0.25rem' }}>
                                                            {selectedResponse.user_info[0].email}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <small style={{ color: '#6c757d', fontSize: '0.85rem' }}>User ID</small>
                                                        <div style={{ fontWeight: 500, color: '#2c3e50', marginTop: '0.25rem' }}>
                                                            {selectedResponse.user_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                {selectedResponse.score && (
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
                                                        borderRadius: '12px',
                                                        padding: '1.25rem',
                                                        border: '1px solid #e3f2fd'
                                                    }}>
                                                        <h6 className="mb-3" style={{
                                                            color: '#667eea',
                                                            fontWeight: 600,
                                                            fontSize: '0.9rem',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px'
                                                        }}>
                                                            <i className="fas fa-chart-line me-1"></i>
                                                            Assessment Scores
                                                        </h6>
                                                        <div className="row g-2">
                                                            <div className="col-6">
                                                                <div style={{
                                                                    background: 'white',
                                                                    borderRadius: '8px',
                                                                    padding: '0.75rem',
                                                                    textAlign: 'center',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>Environment</div>
                                                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#28a745' }}>
                                                                        {selectedResponse.score.Environment || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div style={{
                                                                    background: 'white',
                                                                    borderRadius: '8px',
                                                                    padding: '0.75rem',
                                                                    textAlign: 'center',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>Social</div>
                                                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#007bff' }}>
                                                                        {selectedResponse.score.Social || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div style={{
                                                                    background: 'white',
                                                                    borderRadius: '8px',
                                                                    padding: '0.75rem',
                                                                    textAlign: 'center',
                                                                    border: '1px solid #e9ecef'
                                                                }}>
                                                                    <div style={{ fontSize: '0.75rem', color: '#6c757d', marginBottom: '0.25rem' }}>Governance</div>
                                                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6f42c1' }}>
                                                                        {selectedResponse.score.Governance || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div style={{
                                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                    borderRadius: '8px',
                                                                    padding: '0.75rem',
                                                                    textAlign: 'center',
                                                                    color: 'white'
                                                                }}>
                                                                    <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '0.25rem' }}>Total</div>
                                                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                                                        {selectedResponse.score.total_score ? (((selectedResponse.score.total_score / (selectedResponse.score.max_score || 300)) * 100).toFixed(2) + '%') : 'N/A'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}


                                {/* Navigation Tabs */}
                                <div style={{
                                    background: 'white',
                                    borderBottom: '2px solid #f0f0f0',
                                    padding: '0 1.5rem'
                                }}>
                                    <ul className="nav nav-tabs border-0" style={{ marginBottom: 0 }}>
                                        {(() => {
                                            const hasConsumption = selectedResponse.consumption && Object.keys(selectedResponse.consumption).length > 0;
                                            
                                            return (
                                                <>
                                                    {hasConsumption && (
                                                        <li className="nav-item">
                                                            <button
                                                                className={`nav-link border-0 ${activeTab === 'prerequisites' ? 'active' : ''}`}
                                                                onClick={() => setActiveTab('prerequisites')}
                                                                style={{
                                                                    borderRadius: '0',
                                                                    padding: '1rem 1.5rem',
                                                                    fontWeight: 500,
                                                                    color: activeTab === 'prerequisites' ? '#ff9800' : '#6c757d',
                                                                    borderBottom: activeTab === 'prerequisites' ? '3px solid #ff9800' : '3px solid transparent',
                                                                    background: 'transparent',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                            >
                                                                <i className="fas fa-clipboard-check me-1"></i>
                                                                Prerequisites
                                                            </button>
                                                        </li>
                                                    )}
                                                    <li className="nav-item">
                                                        <button
                                                            className={`nav-link border-0 ${activeTab === 'environmental' ? 'active' : ''}`}
                                                            onClick={() => setActiveTab('environmental')}
                                                            style={{
                                                                borderRadius: '0',
                                                                padding: '1rem 1.5rem',
                                                                fontWeight: 500,
                                                                color: activeTab === 'environmental' ? '#28a745' : '#6c757d',
                                                                borderBottom: activeTab === 'environmental' ? '3px solid #28a745' : '3px solid transparent',
                                                                background: 'transparent',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        >
                                                            <i className="fas fa-leaf me-1"></i>
                                                            Environmental
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button
                                                            className={`nav-link border-0 ${activeTab === 'social' ? 'active' : ''}`}
                                                            onClick={() => setActiveTab('social')}
                                                            style={{
                                                                borderRadius: '0',
                                                                padding: '1rem 1.5rem',
                                                                fontWeight: 500,
                                                                color: activeTab === 'social' ? '#007bff' : '#6c757d',
                                                                borderBottom: activeTab === 'social' ? '3px solid #007bff' : '3px solid transparent',
                                                                background: 'transparent',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        >
                                                            <i className="fas fa-users me-1"></i>
                                                            Social
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button
                                                            className={`nav-link border-0 ${activeTab === 'governance' ? 'active' : ''}`}
                                                            onClick={() => setActiveTab('governance')}
                                                            style={{
                                                                borderRadius: '0',
                                                                padding: '1rem 1.5rem',
                                                                fontWeight: 500,
                                                                color: activeTab === 'governance' ? '#6f42c1' : '#6c757d',
                                                                borderBottom: activeTab === 'governance' ? '3px solid #6f42c1' : '3px solid transparent',
                                                                background: 'transparent',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                        >
                                                            <i className="fas fa-shield-alt me-1"></i>
                                                            Governance
                                                        </button>
                                                    </li>
                                                </>
                                            );
                                        })()}
                                    </ul>
                                </div>

                                {/* Tab Content */}
                                <div className="p-4" style={{ overflowY: 'auto', background: '#fafafa' }}>
                                    {renderTabContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminAllResponses;
