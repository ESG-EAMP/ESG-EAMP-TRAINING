import React, { useEffect, useState, useMemo, useRef } from 'react';
import Title from '../../layouts/Title/Title';
import { FaTrashAlt, FaEye, FaEdit, FaBuilding, FaUser, FaCheckCircle, FaClock, FaTimesCircle, FaUsers, FaToggleOn, FaToggleOff, FaShieldAlt, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Swal from 'sweetalert2';
import { hasPermission, Permission } from '../../utils/permissions';

function ManageUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterByStatus, setFilterByStatus] = useState('all');
    const [filterByAccountStatus, setFilterByAccountStatus] = useState('all');
    const [filterByEmailVerification, setFilterByEmailVerification] = useState('all');
    const [filterByBusinessVerification, setFilterByBusinessVerification] = useState('all');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUserForReset, setSelectedUserForReset] = useState(null);
    const [resetEmail, setResetEmail] = useState('');
    const [resetEmailError, setResetEmailError] = useState('');
    const [isResetEmailValid, setIsResetEmailValid] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const topScrollRef = useRef(null);
    const bottomScrollRef = useRef(null);

    // Fetch users on load
    useEffect(() => {
        setLoading(true);
        api.get('/management/users')
            .then(res => {
                const usersData = res.data.users || [];
                // Normalize user_status - handle both array and object formats
                const normalizedUsers = usersData.map(user => {
                    let userStatus = user.user_status;
                    // If user_status is an array, get the first element
                    if (Array.isArray(userStatus) && userStatus.length > 0) {
                        userStatus = userStatus[0];
                    }
                    // If user_status is null/undefined, set default values
                    if (!userStatus || typeof userStatus !== 'object') {
                        userStatus = { is_active: false, is_verified: false, last_login: null };
                    }
                    return {
                        ...user,
                        user_status: userStatus
                    };
                });
                setUsers(normalizedUsers);
            })
            .catch(err => {
                console.error("Failed to fetch users:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id) => {
        // Check permission before allowing delete
        if (!hasPermission(Permission.DELETE_USERS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to delete users.',
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

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/management/users/${id}`);
            setUsers(prev => prev.filter(user => user.id !== id));

            Swal.fire({
                title: 'Deleted!',
                text: 'User has been deleted.',
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
        } catch (err) {
            console.error("Error deleting user:", err);
            let errorMessage = 'Failed to delete user.';
            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleToggleAccountStatus = async (userId, currentStatus) => {
        // Check permission before allowing status update
        if (!hasPermission(Permission.UPDATE_USER_STATUS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to update user status.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const newStatus = !currentStatus;
        const action = newStatus ? 'activate' : 'deactivate';

        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${action} this account?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#28a745' : '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${action}!`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/management/users/${userId}/status`, {
                is_active: newStatus
            });

            setUsers(prev => prev.map(user =>
                user.id === userId
                    ? {
                        ...user,
                        user_status: {
                            ...user.user_status,
                            is_active: newStatus
                        }
                    }
                    : user
            ));

            Swal.fire({
                title: 'Success!',
                text: `Account ${action}d successfully.`,
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
        } catch (err) {
            console.error(`Error ${action}ing account:`, err);
            Swal.fire({
                title: 'Error!',
                text: `Failed to ${action} account.`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleToggleEmailVerification = async (userId, currentStatus) => {
        // Check permission before allowing verification update
        if (!hasPermission(Permission.UPDATE_USER_STATUS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to update user verification status.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const newStatus = !currentStatus;
        const action = newStatus ? 'verify' : 'unverify';

        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${action} this user's email?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#17a2b8' : '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${action}!`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/management/users/${userId}/verification`, {
                is_verified: newStatus
            });

            setUsers(prev => prev.map(user =>
                user.id === userId
                    ? {
                        ...user,
                        user_status: {
                            ...user.user_status,
                            is_verified: newStatus
                        }
                    }
                    : user
            ));

            Swal.fire({
                title: 'Success!',
                // text: `Email ${action}ed successfully.`,
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
        } catch (err) {
            console.error(`Error ${action}ing email:`, err);
            Swal.fire({
                title: 'Error!',
                text: err.response?.data?.detail || `Failed to ${action} email.`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleToggleBusinessVerification = async (userId, currentStatus, hasBusinessData) => {
        // Check permission before allowing verification update
        if (!hasPermission(Permission.UPDATE_USER_STATUS)) {
            Swal.fire({
                title: 'Permission Denied',
                text: 'You do not have permission to update user verification status.',
                icon: 'error',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        if (!hasBusinessData) {
            Swal.fire({
                title: 'No Business Data',
                text: 'This user has not submitted business verification data yet.',
                icon: 'warning',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const newStatus = !currentStatus;
        const action = newStatus ? 'verify' : 'unverify';

        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${action} this user's business verification?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#17a2b8' : '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${action}!`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await api.put(`/management/users/${userId}/business-verification`, {
                is_business_verified: newStatus
            });

            setUsers(prev => prev.map(user =>
                user.id === userId
                    ? {
                        ...user,
                        user_status: {
                            ...user.user_status,
                            business_verified: newStatus
                        }
                    }
                    : user
            ));

            Swal.fire({
                title: 'Success!',
                text: `Business verification ${action}ed successfully.`,
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });
        } catch (err) {
            console.error(`Error ${action}ing business verification:`, err);
            Swal.fire({
                title: 'Error!',
                text: err.response?.data?.detail || `Failed to ${action} business verification.`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    const handleViewDetails = (userId) => {
        navigate(`/admin/user-profile/${userId}`);
    };

    // Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    };

    // Handle reset password modal open
    const handleOpenResetPasswordModal = (user) => {
        setSelectedUserForReset(user);
        setResetEmail(user.email || '');
        setResetEmailError('');
        setIsResetEmailValid(validateEmail(user.email || ''));
        setShowResetPasswordModal(true);
    };

    // Handle reset password modal close
    const handleCloseResetPasswordModal = () => {
        setShowResetPasswordModal(false);
        setSelectedUserForReset(null);
        setResetEmail('');
        setResetEmailError('');
        setIsResetEmailValid(false);
    };

    // Handle email input change in reset password modal
    const handleResetEmailChange = (e) => {
        const value = e.target.value;
        setResetEmail(value);

        if (value === '') {
            setResetEmailError('');
            setIsResetEmailValid(false);
        } else if (!validateEmail(value)) {
            setResetEmailError('Please enter a valid email address');
            setIsResetEmailValid(false);
        } else {
            setResetEmailError('');
            setIsResetEmailValid(true);
        }
    };

    // Handle reset password submission
    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validate email before submission
        if (!resetEmail.trim()) {
            setResetEmailError('Email address is required');
            return;
        }

        if (!isResetEmailValid) {
            setResetEmailError('Please enter a valid email address');
            return;
        }

        setIsResettingPassword(true);

        try {
            const response = await api.post('/auth/user/resetpassword', { email: resetEmail });
            const data = response.data;

            Swal.fire({
                title: 'Password Reset Successful!',
                text: 'An email with password reset instructions has been sent.',
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                handleCloseResetPasswordModal();
            });
        } catch (error) {
            Swal.fire({
                title: 'Reset Failed',
                text: error.message || 'Failed to send reset password email. Please try again.',
                icon: 'error',
                confirmButtonText: 'Try Again'
            });
        } finally {
            setIsResettingPassword(false);
        }
    };

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        if (!users || !Array.isArray(users)) {
            return [];
        }

        // Filter by search term
        let filtered = users.filter(user => {
            const searchLower = (searchTerm || '').toLowerCase();
            const matchesSearch =
                (user.first_name?.toLowerCase().includes(searchLower) || false) ||
                (user.last_name?.toLowerCase().includes(searchLower) || false) ||
                (user.email?.toLowerCase().includes(searchLower) || false) ||
                (user.firm?.toLowerCase().includes(searchLower) || false) ||
                (user.business_size?.toLowerCase().includes(searchLower) || false) ||
                (user.sector?.toLowerCase().includes(searchLower) || false) ||
                (user.industry?.toLowerCase().includes(searchLower) || false) ||
                (user.location?.toLowerCase().includes(searchLower) || false) ||
                (user.address?.location?.toLowerCase().includes(searchLower) || false) ||
                (user.status?.toLowerCase().includes(searchLower) || false);

            // Filter by assessment status
            let matchesAssessmentStatus = true;
            if (filterByStatus !== 'all') {
                const status = (user.status || '').toLowerCase();
                matchesAssessmentStatus = status === filterByStatus.toLowerCase();
            }

            // Filter by account status
            let matchesAccountStatus = true;
            if (filterByAccountStatus !== 'all') {
                const isActive = user.user_status?.is_active;
                if (filterByAccountStatus === 'active') {
                    matchesAccountStatus = isActive === true;
                } else if (filterByAccountStatus === 'inactive') {
                    matchesAccountStatus = isActive === false;
                }
            }

            // Filter by email verification status
            let matchesEmailVerification = true;
            if (filterByEmailVerification !== 'all') {
                const isEmailVerified = user.user_status?.is_verified;
                if (filterByEmailVerification === 'verified') {
                    matchesEmailVerification = isEmailVerified === true;
                } else if (filterByEmailVerification === 'unverified') {
                    matchesEmailVerification = isEmailVerified === false;
                }
            }

            // Filter by business verification status
            let matchesBusinessVerification = true;
            if (filterByBusinessVerification !== 'all') {
                const hasBusinessData = !!(user.verification?.sme_corp?.number || user.verification?.ssm?.registration_number || user.verification?.business);
                const isBusinessVerified = user.user_status?.business_verified;
                
                if (filterByBusinessVerification === 'verified') {
                    matchesBusinessVerification = isBusinessVerified === true;
                } else if (filterByBusinessVerification === 'unverified') {
                    matchesBusinessVerification = hasBusinessData && !isBusinessVerified;
                } else if (filterByBusinessVerification === 'not_started') {
                    matchesBusinessVerification = !hasBusinessData;
                }
            }

            // Filter by sector
            let matchesSector = true;
            if (selectedSector) {
                const sector = (user.sector || '').toLowerCase();
                matchesSector = sector === selectedSector.toLowerCase();
            }

            // Filter by size
            let matchesSize = true;
            if (selectedSize) {
                const size = (user.business_size || '').toLowerCase();
                matchesSize = size === selectedSize.toLowerCase();
            }

            // Filter by industry
            let matchesIndustry = true;
            if (selectedIndustry) {
                const industry = (user.industry || '').toLowerCase();
                matchesIndustry = industry === selectedIndustry.toLowerCase();
            }

            // Filter by location
            let matchesLocation = true;
            if (selectedLocation) {
                const location = (user.location || user.address?.location || '').toLowerCase();
                matchesLocation = location === selectedLocation.toLowerCase();
            }

            return matchesSearch && matchesAssessmentStatus && matchesAccountStatus && matchesEmailVerification && matchesBusinessVerification && matchesSector && matchesSize && matchesIndustry && matchesLocation;
        });

        // Sort users
        filtered.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'name':
                    valueA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                    valueB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
                    break;
                case 'firm':
                    valueA = (a.firm || '').toLowerCase();
                    valueB = (b.firm || '').toLowerCase();
                    break;
                case 'size':
                    valueA = (a.business_size || '').toLowerCase();
                    valueB = (b.business_size || '').toLowerCase();
                    break;
                case 'sector':
                    valueA = (a.sector || '').toLowerCase();
                    valueB = (b.sector || '').toLowerCase();
                    break;
                case 'industry':
                    valueA = (a.industry || '').toLowerCase();
                    valueB = (b.industry || '').toLowerCase();
                    break;
                case 'location':
                    valueA = (a.location || a.address?.location || '').toLowerCase();
                    valueB = (b.location || b.address?.location || '').toLowerCase();
                    break;
                case 'status':
                    valueA = (a.status || '').toLowerCase();
                    valueB = (b.status || '').toLowerCase();
                    break;
                case 'accountStatus':
                    valueA = a.user_status?.is_active ? 'active' : 'inactive';
                    valueB = b.user_status?.is_active ? 'active' : 'inactive';
                    break;
                case 'emailVerification':
                    valueA = a.user_status?.is_verified ? 'verified' : 'unverified';
                    valueB = b.user_status?.is_verified ? 'verified' : 'unverified';
                    break;
                case 'businessVerification':
                    // Sort by whether business verification exists
                    const aHasBusinessVerification = !!(a.verification?.sme_corp?.number || a.verification?.ssm?.registration_number || a.verification?.business);
                    const bHasBusinessVerification = !!(b.verification?.sme_corp?.number || b.verification?.ssm?.registration_number || b.verification?.business);
                    valueA = aHasBusinessVerification ? 'verified' : 'not_started';
                    valueB = bHasBusinessVerification ? 'verified' : 'not_started';
                    break;
                case 'registered':
                    valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    break;
                default:
                    valueA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
                    valueB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        return filtered;
    }, [users, searchTerm, sortBy, sortOrder, filterByStatus, filterByAccountStatus, filterByEmailVerification, filterByBusinessVerification, selectedSector, selectedSize, selectedIndustry, selectedLocation]);

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to first page when filters or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, sortOrder, filterByStatus, filterByAccountStatus, filterByEmailVerification, filterByBusinessVerification, selectedSector, selectedSize, selectedIndustry, selectedLocation]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Sync scroll positions between top and bottom scrollbars
    useEffect(() => {
        const topScroll = topScrollRef.current;
        const bottomScroll = bottomScrollRef.current;

        if (!topScroll || !bottomScroll) return;

        // Sync scroll widths
        const syncScrollWidth = () => {
            if (bottomScroll.scrollWidth > bottomScroll.clientWidth) {
                const topTable = topScroll.querySelector('table');
                const bottomTable = bottomScroll.querySelector('table');
                if (topTable && bottomTable) {
                    topTable.style.minWidth = `${bottomTable.scrollWidth}px`;
                }
            }
        };

        syncScrollWidth();

        const handleTopScroll = () => {
            if (bottomScroll) {
                bottomScroll.scrollLeft = topScroll.scrollLeft;
            }
        };

        const handleBottomScroll = () => {
            if (topScroll) {
                topScroll.scrollLeft = bottomScroll.scrollLeft;
            }
        };

        topScroll.addEventListener('scroll', handleTopScroll);
        bottomScroll.addEventListener('scroll', handleBottomScroll);

        // Resize observer to handle table width changes
        const resizeObserver = new ResizeObserver(() => {
            syncScrollWidth();
        });

        resizeObserver.observe(bottomScroll);

        return () => {
            topScroll.removeEventListener('scroll', handleTopScroll);
            bottomScroll.removeEventListener('scroll', handleBottomScroll);
            resizeObserver.disconnect();
        };
    }, [currentUsers]);

    // Statistics
    const totalUsers = users.length;
    const completedAssessments = users.filter(u => u.status === 'Completed').length;
    const pendingEmailVerification = users.filter(u => !u.user_status?.is_verified).length;
    const pendingBusinessVerification = users.filter(u => {
        const hasBusinessData = !!(u.verification?.sme_corp?.number || u.verification?.ssm?.registration_number || u.verification?.business);
        return hasBusinessData && !u.user_status?.business_verified;
    }).length;

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return <FaCheckCircle className="text-success" />;
            case 'in progress':
                return <FaClock className="text-warning" />;
            case 'pending':
                return <FaTimesCircle className="text-danger" />;
            default:
                return <FaClock className="text-muted" />;
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-success';
            case 'in progress':
                return 'bg-warning';
            case 'pending':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'N/A';

            const day = date.getDate();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const year = date.getFullYear();

            return `${day} ${month} ${year}`;
        } catch (error) {
            return 'N/A';
        }
    };

    // Get unique sectors for filter dropdown
    const getUniqueSectors = () => {
        const sectors = users
            .map(user => user.sector || '')
            .filter(sector => sector && sector.trim() !== '')
            .filter((sector, index, self) => self.indexOf(sector) === index)
            .sort();
        return sectors;
    };

    // Get unique sizes for filter dropdown
    const getUniqueSizes = () => {
        const sizes = users
            .map(user => user.business_size || '')
            .filter(size => size && size.trim() !== '')
            .filter((size, index, self) => self.indexOf(size) === index)
            .sort();
        return sizes;
    };

    // Get unique industries for filter dropdown
    const getUniqueIndustries = () => {
        const industries = users
            .map(user => user.industry || '')
            .filter(industry => industry && industry.trim() !== '')
            .filter((industry, index, self) => self.indexOf(industry) === index)
            .sort();
        return industries;
    };

    // Get unique locations for filter dropdown
    const getUniqueLocations = () => {
        const locations = users
            .map(user => user.location || user.address?.location || '')
            .filter(location => location && location.trim() !== '')
            .filter((location, index, self) => self.indexOf(location) === index)
            .sort();
        return locations;
    };

    return (
        <div className="container-fluid">
            <Title title="Manage Users" breadcrumb={[["Manage Users", "/manage-users"], "Editor"]} />

            {/* Statistics Cards */}
            <div className="row g-2 mb-4">
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="">
                        <div className="card-body text-center">
                            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
                                <FaUsers className="fs-3 text-primary" />
                            </div>
                            <h6 className="card-title text-muted mb-1">Total Users</h6>
                            <h2 className="fw-bold text-primary ">{totalUsers}</h2>
                        </div>
                    </div>
                </div>
               
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="">
                        <div className="card-body text-center">
                            <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
                                <FaShieldAlt className="fs-3 text-warning" />
                            </div>
                            <h6 className="card-title text-muted mb-1">Pending Email Verification</h6>
                            <h2 className="fw-bold text-warning ">{pendingEmailVerification}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="">
                        <div className="card-body text-center">
                            <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
                                <FaShieldAlt className="fs-3 text-danger" />
                            </div>
                            <h6 className="card-title text-muted mb-1">Pending Business Verification</h6>
                            <h2 className="fw-bold text-danger ">{pendingBusinessVerification}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="">
                        <div className="card-body text-center">
                            <div className="d-inline-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
                                <FaShieldAlt className="fs-3 text-info" />
                            </div>
                            <h6 className="card-title text-muted mb-1">Verified</h6>
                            <h2 className="fw-bold text-info ">{users.filter(u => u.user_status?.is_verified).length}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="row mb-1">
                <div className="col-lg-12 col-md-6 mb-3">
                    <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                            <i className="mdi mdi-magnify text-muted"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search by name, firm, email, size, sector, industry, or location..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={filterByStatus}
                        onChange={(e) => setFilterByStatus(e.target.value)}
                    >
                        <option value="all">All Assessment Status</option>
                        <option value="completed">Started</option>
                        <option value="Not Started">Not Started</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={filterByAccountStatus}
                        onChange={(e) => setFilterByAccountStatus(e.target.value)}
                    >
                        <option value="all">All Account Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={filterByEmailVerification}
                        onChange={(e) => setFilterByEmailVerification(e.target.value)}
                    >
                        <option value="all">All Email Verification</option>
                        <option value="verified">Email Verified</option>
                        <option value="unverified">Email Unverified</option>
                    </select>
                </div>
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={filterByBusinessVerification}
                        onChange={(e) => setFilterByBusinessVerification(e.target.value)}
                    >
                        <option value="all">All Business Verification</option>
                        <option value="verified">Business Verified</option>
                        <option value="unverified">Business Pending</option>
                        <option value="not_started">Business Not Started</option>
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
                <div className="col-lg-2 col-md-6 mb-3">
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
                <div className="col-lg-2 col-md-6 mb-3">
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
                <div className="col-lg-2 col-md-6 mb-3">
                    <select
                        className="form-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="firm">Sort by Firm</option>
                        <option value="size">Sort by Size</option>
                        <option value="sector">Sort by Sector</option>
                        <option value="industry">Sort by Industry</option>
                        <option value="location">Sort by Location</option>
                        <option value="status">Sort by Assessment Status</option>
                        <option value="accountStatus">Sort by Account Status</option>
                        <option value="verification">Sort by Verification</option>
                        <option value="registered">Sort by Registered Date</option>
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
            </div>
            {(searchTerm || filterByStatus !== 'all' || filterByAccountStatus !== 'all' || filterByEmailVerification !== 'all' || filterByBusinessVerification !== 'all' || selectedSector || selectedSize || selectedIndustry || selectedLocation) && (
                <div className="row mb-3">
                    <div className="col-12">
                        <button
                            className="btn btn-light"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterByStatus('all');
                                setFilterByAccountStatus('all');
                                setFilterByEmailVerification('all');
                                setFilterByBusinessVerification('all');
                                setSelectedSector('');
                                setSelectedSize('');
                                setSelectedIndustry('');
                                setSelectedLocation('');
                            }}
                        >
                            <i className="fas fa-times me-1"></i>
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Items Per Page */}
            <div className="row mb-3">
                <div className="col-12">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                        <label className="form-label text-muted ">Show:</label>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            value={itemsPerPage}
                            onChange={e => {
                                setItemsPerPage(Number(e.target.value));
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

            {/* Users Table */}
            <div className="">
                <div className="p-0">
                    <div className="table-scroll-top overflow-y-auto card shadow-sm rounded" >
                        <table className="table table-hover table-nowrap">
                            <thead className="table-dark">
                                <tr>
                                    <th className="border-0 ps-4 py-3">No</th>
                                    <th className="border-0 py-3">Actions</th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('name')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        User
                                        {sortBy === 'name' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('firm')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Firm
                                        {sortBy === 'firm' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('size')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Size
                                        {sortBy === 'size' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('sector')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Sector
                                        {sortBy === 'sector' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('industry')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Industry
                                        {sortBy === 'industry' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('location')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Location
                                        {sortBy === 'location' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('status')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Assessment Status
                                        {sortBy === 'status' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('accountStatus')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Account Status
                                        {sortBy === 'accountStatus' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('emailVerification')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Email Verification
                                        {sortBy === 'emailVerification' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 py-3 sortable"
                                        onClick={() => handleSort('businessVerification')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Business Verification
                                        {sortBy === 'businessVerification' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                    <th
                                        className="border-0 pe-4 py-3 sortable"
                                        onClick={() => handleSort('registered')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Registered
                                        {sortBy === 'registered' && (
                                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-2`}></i>
                                        )}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-5">
                                            <div className="d-flex flex-column align-items-center justify-content-center">
                                                <div className="spinner-border text-primary mb-3" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="text-muted mb-0">Loading users...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((user, index) => (
                                    <tr key={user.id}>
                                        <td className="ps-4 py-3">
                                            <span className="fw-semibold">{startIndex + index + 1}</span>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => handleViewDetails(user.id)}
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <div className="dropdown">
                                                    <button className="btn btn-sm" type="button" data-bs-toggle="dropdown">
                                                        <i className="mdi mdi-dots-vertical"></i>
                                                    </button>
                                                    <ul className="dropdown-menu">
                                                        <li>
                                                            <button
                                                                className="dropdown-item"
                                                                type="button"
                                                                onClick={() => handleViewDetails(user.id)}
                                                            >
                                                                <FaEye className="me-1" />View Details
                                                            </button>
                                                        </li>
                                                        {hasPermission(Permission.UPDATE_USER_STATUS) && (
                                                            <li>
                                                                <button
                                                                    className={`dropdown-item ${user.user_status?.is_active ? 'text-warning' : 'text-success'}`}
                                                                    type="button"
                                                                    onClick={() => handleToggleAccountStatus(user.id, user.user_status?.is_active)}
                                                                >
                                                                    {user.user_status?.is_active ? (
                                                                        <>
                                                                            <FaToggleOff className="me-1" />Deactivate Account
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <FaToggleOn className="me-1" />Activate Account
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        )}
                                                        {hasPermission(Permission.UPDATE_USER_STATUS) && (
                                                            <li>
                                                                <button
                                                                    className={`dropdown-item ${user.user_status?.is_verified ? 'text-warning' : 'text-info'}`}
                                                                    type="button"
                                                                    onClick={() => handleToggleEmailVerification(user.id, user.user_status?.is_verified)}
                                                                >
                                                                    {user.user_status?.is_verified ? (
                                                                        <>
                                                                            <i className="fas fa-envelope-circle-check me-1"></i>Unverify Email
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i className="fas fa-envelope me-1"></i>Verify Email
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        )}
                                                        {hasPermission(Permission.UPDATE_USER_STATUS) && (
                                                            <li>
                                                                <button
                                                                    className={`dropdown-item ${user.user_status?.business_verified ? 'text-warning' : 'text-success'}`}
                                                                    type="button"
                                                                    onClick={() => handleToggleBusinessVerification(
                                                                        user.id, 
                                                                        user.user_status?.business_verified || false,
                                                                        !!(user.verification?.sme_corp?.number || user.verification?.ssm?.registration_number || user.verification?.business)
                                                                    )}
                                                                    disabled={!(user.verification?.sme_corp?.number || user.verification?.ssm?.registration_number || user.verification?.business)}
                                                                >
                                                                    {user.user_status?.business_verified ? (
                                                                        <>
                                                                            <i className="fas fa-shield-alt me-1"></i>Unverify Business
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i className="fas fa-shield-alt me-1"></i>Verify Business
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </li>
                                                        )}
                                                        <li>
                                                            <button
                                                                className="dropdown-item text-info"
                                                                type="button"
                                                                onClick={() => handleOpenResetPasswordModal(user)}
                                                            >
                                                                <FaLock className="me-1" />Reset Password
                                                            </button>
                                                        </li>
                                                        {hasPermission(Permission.DELETE_USERS) && (
                                                            <>
                                                                <li><hr className="dropdown-divider m-0 p-0" /></li>
                                                                <li>
                                                                    <button
                                                                        className="dropdown-item text-danger"
                                                                        type="button"
                                                                        onClick={() => handleDelete(user.id)}
                                                                    >
                                                                        <FaTrashAlt className="me-1" />Delete
                                                                    </button>
                                                                </li>
                                                            </>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle me-3" style={{ width: '40px', height: '40px' }}>
                                                    <FaUser className="text-primary" />
                                                </div>
                                                <div>
                                                    <h6 className=" fw-semibold">
                                                        {user.first_name} {user.last_name}
                                                    </h6>
                                                    <small className="text-muted">{user.email || 'N/A'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center">
                                                <FaBuilding className="text-muted me-1" />
                                                <span>{user.firm || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-muted">{user.business_size || 'N/A'}</span>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-muted">{user.sector || 'N/A'}</span>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-muted">{user.industry || 'N/A'}</span>
                                        </td>
                                        <td className="py-3">
                                            <span className="text-muted">{user.location || user.address?.location || 'N/A'}</span>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center gap-2">
                                                {getStatusIcon(user.status)}
                                                {/* <span className={`badge ${getStatusBadgeClass(user.status)}`}>*/}
                                                {user.status === 'Completed' ? 'Started' : user.status || 'Unknown'}
                                                {/*</span>*/}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`fas ${user.user_status?.is_active === true ? 'fa-check-circle text-success' : 'fa-times-circle text-danger'}`}></i>
                                                {/* <span className={`badge ${user.user_status?.is_active === true ? 'bg-success' : 'bg-danger'}`}> */}
                                                {user.user_status?.is_active === true ? 'Active' : 'Inactive'}
                                                {/*</span>*/}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`fas ${user.user_status?.is_verified === true ? 'fa-envelope-circle-check text-success' : 'fa-envelope text-warning'}`}></i>
                                                <span className={user.user_status?.is_verified === true ? 'text-success fw-semibold' : 'text-warning'}>
                                                    {user.user_status?.is_verified === true ? 'Verified' : 'Unverified'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                {user.verification?.sme_corp?.number || user.verification?.ssm?.registration_number || user.verification?.business ? (
                                                    <>
                                                        <i className={`fas ${user.user_status?.business_verified ? 'fa-shield-check text-success' : 'fa-shield text-warning'}`}></i>
                                                        <span className={user.user_status?.business_verified ? 'text-success fw-semibold' : 'text-warning'}>
                                                            {user.user_status?.business_verified ? 'Verified' : 'Pending'}
                                                        </span>
                                                        {user.verification?.sme_corp?.number && (
                                                            <span className="badge bg-info" title={`SME Corp Number: ${user.verification.sme_corp.number}`}>
                                                                <i className="fas fa-id-card me-1"></i>
                                                                SME Corp
                                                            </span>
                                                        )}
                                                        {user.verification?.ssm?.registration_number && (
                                                            <span className="badge bg-success" title={`SSM: ${user.verification.ssm.registration_number}`}>
                                                                <i className="fas fa-file-contract me-1"></i>
                                                                Business Reg
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted">
                                                        <i className="fas fa-minus-circle me-1"></i>
                                                        Not Started
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="pe-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <i className="mdi mdi-calendar text-muted me-1"></i>
                                                <span className="small">{formatDate(user.created_at)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {!loading && currentUsers.length === 0 && (
                <div className="">
                    <div className="">
                        <div className="text-center py-5">
                            <i className="mdi mdi-account-group display-1 text-muted"></i>
                            <h5 className="mt-3 text-muted">
                                {searchTerm ? 'No users found' : 'No MSME users available'}
                            </h5>
                            <p className="text-muted">
                                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding new MSME users'}
                            </p>
                           
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="row mt-4">
                    <div className="col-12">
                        <nav aria-label="Users pagination">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <i className="mdi mdi-chevron-left"></i>
                                    </button>
                                </li>

                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    const isActive = pageNum === currentPage;

                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <li key={pageNum} className={`page-item ${isActive ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return (
                                            <li key={pageNum} className="page-item disabled">
                                                <span className="page-link">...</span>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}

                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <i className="mdi mdi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            <div
                className={`modal fade ${showResetPasswordModal ? 'show d-block' : ''}`}
                tabIndex="-1"
                style={{ backgroundColor: showResetPasswordModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}
                onClick={handleCloseResetPasswordModal}
            >
                <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Reset Password</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleCloseResetPasswordModal}
                                disabled={isResettingPassword}
                            ></button>
                        </div>
                        <form onSubmit={handleResetPassword}>
                            <div className="modal-body">
                                <p className="text-muted mb-4">
                                    Make sure the email is correct. If not please go to this user's profile to update the email.
                                </p>
                                <div className="mb-3">
                                    <label htmlFor="resetEmail" className="form-label">
                                        Email address
                                    </label>
                                    <input
                                        className={`form-control ${resetEmailError ? 'is-invalid' : isResetEmailValid ? 'is-valid' : ''}`}
                                        type="email"
                                        id="resetEmail"
                                        name="resetEmail"
                                        required
                                        placeholder="Enter email address"
                                        value={resetEmail}
                                        onChange={handleResetEmailChange}
                                        disabled={true}
                                    />
                                    {resetEmailError && (
                                        <div className="invalid-feedback">
                                            {resetEmailError}
                                        </div>
                                    )}
                                    {isResetEmailValid && !resetEmailError && (
                                        <div className="valid-feedback">
                                            Email address looks good!
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleCloseResetPasswordModal}
                                    disabled={isResettingPassword}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!isResetEmailValid || !resetEmail.trim() || isResettingPassword}
                                >
                                    {isResettingPassword ? (
                                        <>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FaLock className="me-1" /> Send Reset Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageUsers;
