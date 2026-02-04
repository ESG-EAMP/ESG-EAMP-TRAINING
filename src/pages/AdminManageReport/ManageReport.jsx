import React, { useEffect, useState } from 'react';
import Title from '../../layouts/Title/Title';
import { FaFileAlt, FaExclamationTriangle, FaFolder, FaFilePdf, FaFileWord, FaFileExcel, FaFileCsv, FaFileArchive } from 'react-icons/fa';
import api, { API_BASE } from '../../utils/api';
import Swal from 'sweetalert2';
import { hasPermission, Permission } from '../../utils/permissions';
import './Report.css';

// File icon
const getFileIcon = (type) => {
	switch (type) {
		case 'pdf':
			return '📄';
		case 'excel':
			return '📊';
		case 'csv':
			return '📈';
		case 'word':
			return '📝';
		default:
			return '📁';
	}
};

// Truncate filename if exceeds 20 characters
const truncateFilename = (filename, maxLength = 20) => {
	if (!filename) return filename;
	if (filename.length <= maxLength) return filename;
	return filename.substring(0, maxLength) + '...';
};

function ManageReport() {
	const [reports, setReports] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	// Dashboard statistics
	const [statistics, setStatistics] = useState({
		total_reports: 0,
		msmes_reporting_this_year: 0,
		current_year: new Date().getFullYear()
	});
	const [statisticsLoading, setStatisticsLoading] = useState(false);
	const [missingReports, setMissingReports] = useState(15); // hardcodded still
	// Filtering and search
	const [searchTerm, setSearchTerm] = useState('');
	const [filterYear, setFilterYear] = useState('');
	const [filterFileType, setFilterFileType] = useState('');
	const [sortBy, setSortBy] = useState('uploaded_at');
	const [sortOrder, setSortOrder] = useState('desc');
	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);
	// File manager state
	const [selectedCompany, setSelectedCompany] = useState(null);

	useEffect(() => {
		const fetchReports = async () => {
			setLoading(true);
			try {
				const res = await api.get('/reports/get-report-list?limit=100');
				setReports(res.data);
			} catch (err) {
				setError('Failed to fetch reports');
			}
			setLoading(false);
		};
		fetchReports();
	}, []);

	useEffect(() => {
		const fetchStatistics = async () => {
			setStatisticsLoading(true);
			try {
				const res = await api.get('/reports/statistics');
				setStatistics(res.data);
			} catch (err) {
				console.error('Failed to fetch statistics:', err);
			}
			setStatisticsLoading(false);
		};
		fetchStatistics();
	}, []);
	// Get unique years for filter dropdown
	const yearOptions = Array.from(new Set(reports.map(r => r.year))).sort((a, b) => b - a);
	// Get unique file types for filter dropdown
	const fileTypeOptions = Array.from(new Set(reports.map(r => r.file_type).filter(Boolean))).sort();

	// Filtered and sorted reports
	const filteredReports = reports.filter(report => {
		const matchesYear = filterYear ? `${report.year}` === filterYear : true;
		const matchesFileType = filterFileType ? report.file_type === filterFileType : true;
		const matchesSearch = searchTerm
			? (
				(report.firm_name && report.firm_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
				(report.report_name && report.report_name.toLowerCase().includes(searchTerm.toLowerCase()))
			)
			: true;
		return matchesYear && matchesFileType && matchesSearch;
	}).sort((a, b) => {
		let aValue, bValue;

		switch (sortBy) {
			case 'firm_name':
				aValue = a.firm_name || '';
				bValue = b.firm_name || '';
				break;
			case 'year':
				aValue = a.year || 0;
				bValue = b.year || 0;
				break;
			case 'file_size':
				aValue = a.file_size || 0;
				bValue = b.file_size || 0;
				break;
			case 'report_name':
				aValue = a.report_name || '';
				bValue = b.report_name || '';
				break;
			case 'uploaded_at':
			default:
				aValue = new Date(a.uploaded_at || 0);
				bValue = new Date(b.uploaded_at || 0);
				break;
		}

		if (sortOrder === 'asc') {
			return aValue > bValue ? 1 : -1;
		} else {
			return aValue < bValue ? 1 : -1;
		}
	});

	// Pagination logic
	const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentReports = filteredReports.slice(startIndex, endIndex);

	// Pagination handlers
	const handlePageChange = (page) => {
		setCurrentPage(page);
	};

	const handleItemsPerPageChange = (newItemsPerPage) => {
		setItemsPerPage(newItemsPerPage);
		setCurrentPage(1); // Reset to first page
	};

	// Reset pagination when filters change
	React.useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterYear, filterFileType, sortBy, sortOrder]);

	// Download helper
	const handleDownload = (url, filename) => {
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', filename || '');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Delete report (admin only)
	const deleteReport = async (reportId, reportName) => {
		// Check permission before allowing delete
		if (!hasPermission(Permission.DELETE_FILES)) {
			Swal.fire({
				title: 'Permission Denied',
				text: 'You do not have permission to delete reports.',
				icon: 'error',
				confirmButtonColor: '#3085d6'
			});
			return;
		}

		const result = await Swal.fire({
			title: 'Are you sure?',
			text: `Delete "${truncateFilename(reportName || 'this report')}"? This action cannot be undone.`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'Cancel'
		});

		if (result.isConfirmed) {
			try {
				await api.delete(`/reports/delete-report/${reportId}`);
				// Remove from local state
				setReports(reports.filter(report => report._id !== reportId));
				// Refresh statistics
				try {
					const res = await api.get('/reports/statistics');
					setStatistics(res.data);
				} catch (err) {
					console.error('Failed to refresh statistics:', err);
				}
				Swal.fire('Deleted!', 'The report has been deleted.', 'success');
			} catch (error) {
				console.error('Error deleting report:', error);
				let errorMessage = 'Failed to delete report';
				if (error.response?.data?.detail) {
					errorMessage = error.response.data.detail;
				} else if (error.response?.data?.message) {
					errorMessage = error.response.data.message;
				}
				Swal.fire('Error', errorMessage, 'error');
			}
		}
	};

	// Get unique companies for file manager
	const companies = Array.from(new Set(reports.map(r => r.firm_name))).sort();

	// Get files for a specific company
	const getCompanyFiles = (companyName) => {
		return reports.filter(r => r.firm_name === companyName);
	};

	// Handle company folder click
	const handleCompanyClick = (companyName) => {
		setSelectedCompany(companyName);
	};

	// Handle back to file manager
	const handleBackToFileManager = () => {
		setSelectedCompany(null);
	};

	// Get file icon based on file type
	const getFileManagerIcon = (type) => {
		switch (type) {
			case 'pdf':
				return <FaFilePdf className="font-16" />;
			case 'excel':
				return <FaFileExcel className="font-16" />;
			case 'csv':
				return <FaFileCsv className="font-16" />;
			case 'word':
				return <FaFileWord className="font-16" />;
			case 'zip':
			case 'rar':
				return <FaFileArchive className="font-16" />;
			default:
				return <FaFileAlt className="font-16" />;
		}
	};

	// Get file size in readable format
	const formatFileSize = (bytes) => {
		if (!bytes) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	};

	return (
		<div className="container-fluid">
			<Title title="User Sustainability Reports" breadcrumb={[['Admin', '/admin'], 'User Sustainability Reports']} />

			{/* Statistics Cards */}
			<div className="row mb-4">
				<div className="col-md-4">
					<div className="bg-white p-3 rounded shadow-sm border-start border-primary border-4">
						<div className="d-flex align-items-center">
							<div className="flex-shrink-0">
								<FaFileAlt className="fs-2 text-primary" />
							</div>
							<div className="flex-grow-1 ms-3">
								<h6 className="text-muted mb-1">Total Reports Received</h6>
								<h3 className=" fw-bold">
									{statisticsLoading ? '...' : statistics.total_reports}
								</h3>
								<small className="text-success">All time reports</small>
							</div>
						</div>
					</div>
				</div>
				{/*<div className="col-md-4">
					<div className="bg-white p-3 rounded shadow-sm border-start border-warning border-4">
						<div className="d-flex align-items-center">
							<div className="flex-shrink-0">
								<FaExclamationTriangle className="fs-2 text-warning" />
							</div>
							<div className="flex-grow-1 ms-3">
								<h6 className="text-muted mb-1">Missing Reports</h6>
								<h3 className=" fw-bold">{missingReports}</h3>
								<small className="text-warning">Pending submissions</small>
							</div>
						</div>
					</div>
				</div> */}
			</div>

			{/* File Manager Section */}
			{!selectedCompany ? (
				<div className="mb-4 file-manager-container company-folder-section">
					<h5 className="mb-3 fw-semibold">File Manager - Firm Folders</h5>
					<div className="row g-3">
						{companies.map(company => (
							<div key={company} className="col-xxl-3 col-lg-6 col-md-6">
								<div
									className="company-folder-item cursor-pointer bg-white p-3 rounded shadow-sm"
									style={{ cursor: 'pointer' }}
									onClick={() => handleCompanyClick(company)}
								>
									<div className="">
										<div className="row align-items-center">
											<div className="col-auto">
												<div className="avatar-sm">
													<span className="avatar-title bg-primary-lighten text-primary rounded">
														<FaFolder className="font-16" />
													</span>
												</div>
											</div>
											<div className="col ps-0">
												<h6 className="mb-1 fw-bold text-dark">{company}</h6>
												<p className=" font-13 text-muted">
													{getCompanyFiles(company).length} file(s)
												</p>
											</div>
										</div>

									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				/* Company Files Detail Section */
				<div className="mb-4 file-manager-container company-files-section">
					<div className="d-flex align-items-center justify-content-between mb-3">
						<button
							className="btn me-3 back-button"
							onClick={handleBackToFileManager}
						>
							<i className="fas fa-arrow-left me-1"></i>
							Back to File Manager
						</button>
						<div>
							<h5 className="mb-1 fw-semibold">{selectedCompany} - All Files</h5>
							<p className=" text-muted">{getCompanyFiles(selectedCompany).length} files uploaded</p>
						</div>
					</div>

					<div className="row g-3">
						{getCompanyFiles(selectedCompany).map((file) => (
							<div key={file._id} className="col-xxl-3 col-lg-6 col-md-6">
								<div className="file-item btn btn-light w-100 text-start pt-3" onClick={() => handleDownload(`${API_BASE}${file.file_url}`, file.report_name)}>
									<a
										href="javascript:void(0);"
										className="text-muted fw-bold d-block"
										style={{ maxWidth: '200px' }}
										title={file.report_name ? file.report_name.replace(/_/g, " ") : ''}
									>
										{getFileManagerIcon(file.file_type)}&nbsp;&nbsp;{truncateFilename(file.report_name ? file.report_name.replace(/_/g, " ") : '')}
									</a>
									<p className="font-13 text-muted">
										{formatFileSize(file.file_size)} • {file.year}
									</p>
									<p className="font-13 text-muted ">
										{file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : '-'}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Search and Filter */}
			<div className="mb-4">
				<div className="row align-items-center mb-3">
					<div className="col-md-4">
						<div className="input-group">
							<span className="input-group-text bg-light border-end-0">
								<i className="fas fa-search text-muted"></i>
							</span>
							<input
								type="text"
								className="form-control border-start-0"
								placeholder="Search by firm or file name..."
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
					<div className="col-md-2">
						<select
							className="form-select"
							value={filterYear}
							onChange={e => setFilterYear(e.target.value)}
						>
							<option value="">All Years</option>
							{yearOptions.map(year => (
								<option key={year} value={year}>{year}</option>
							))}
						</select>
					</div>
					<div className="col-md-2">
						<select
							className="form-select"
							value={filterFileType}
							onChange={e => setFilterFileType(e.target.value)}
						>
							<option value="">All File Types</option>
							{fileTypeOptions.map(type => (
								<option key={type} value={type}>{type.toUpperCase()}</option>
							))}
						</select>
					</div>
					<div className="col-md-2">
						<select
							className="form-select"
							value={sortBy}
							onChange={e => setSortBy(e.target.value)}
						>
							<option value="uploaded_at">Sort by Date</option>
							<option value="firm_name">Sort by Firm</option>
							<option value="year">Sort by Year</option>
							<option value="file_size">Sort by Size</option>
							<option value="report_name">Sort by File Name</option>
						</select>
					</div>
					<div className="col-md-2">
						<select
							className="form-select"
							value={sortOrder}
							onChange={e => setSortOrder(e.target.value)}
						>
							<option value="desc">Descending</option>
							<option value="asc">Ascending</option>
						</select>
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
							onChange={e => handleItemsPerPageChange(Number(e.target.value))}
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

			{/* Reports Table */}
			<div className="">
				<div className="mb-4">
					<h5 className="fw-semibold ">User Uploaded Reports ({filteredReports.length})</h5>
				</div>
				<div className="table-scroll-top overflow-y-auto card">
					<table className="table  table-hover table-nowrap">
						<thead className="table-dark">
							<tr>
								<th className="border-0 text-center">No.</th>
								<th className="border-0 text-center">Actions</th>
								<th className="border-0">Firm Name</th>
								<th className="border-0">Year</th>
								<th className="border-0">Size</th>
								<th className="border-0">File Name</th>
								<th className="border-0">Upload Date</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr>
									<td colSpan={7} className="text-center py-4">Loading...</td>
								</tr>
							) : error ? (
								<tr>
									<td colSpan={7} className="text-center text-danger py-4">{error}</td>
								</tr>
							) : filteredReports.length === 0 ? (
								<tr>
									<td colSpan={7} className="text-center py-5">
										<FaFileAlt className="fs-1 text-muted mb-3" />
										<h5 className="text-muted">No reports found</h5>
										<p className="text-muted">No user reports have been uploaded yet.</p>
									</td>
								</tr>
							) : (
								currentReports.map((report, index) => (
									<tr key={report._id} className="align-middle">
										<td className="text-center">
											<span className="fw-medium">{startIndex + index + 1}</span>
										</td>
										<td>
											<div className="d-flex justify-content-center gap-1">
												<button
													className="btn btn-sm btn-outline-primary"
													title="Download"
													onClick={() => handleDownload(`${API_BASE}${report.file_url}`, report.report_name)}
												>
													<i className="fas fa-download"></i>
												</button>
												{hasPermission(Permission.DELETE_FILES) && (
													<button
														className="btn btn-sm btn-outline-danger"
														title="Delete"
														onClick={() => deleteReport(report._id, report.report_name)}
													>
														<i className="fas fa-trash"></i>
													</button>
												)}
											</div>
										</td>
										<td>
											<h6 className="mb-1 fw-semibold">{report.firm_name}</h6>
										</td>
										<td>
											<span className="badge bg-info">{report.year}</span>
										</td>
										<td>
											<span className="badge bg-light text-dark px-2 py-1 rounded-pill">
												{report.file_size ? (report.file_size / (1024 * 1024)).toFixed(1) + ' MB' : '-'}
											</span>
										</td>
										<td>
											<div className="d-flex align-items-center">
												<span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>{getFileIcon(report.file_type)}</span>
												<span className="fw-medium" title={report.report_name || ''}>
													{truncateFilename(report.report_name || '')}
												</span>
											</div>
										</td>
										<td>
											<span className="text-muted fw-medium">
												{report.uploaded_at ? new Date(report.uploaded_at).toLocaleDateString() : '-'}
											</span>
										</td>

									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>


			{/* Pagination - Bottom Center */}
			{totalPages > 1 && (
				<div className="row mt-4">
					<div className="col-12">
						<nav aria-label="Reports pagination">
							<ul className="pagination justify-content-center">
								<li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
									<button
										className="page-link"
										onClick={() => handlePageChange(currentPage - 1)}
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
													onClick={() => handlePageChange(pageNum)}
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
										onClick={() => handlePageChange(currentPage + 1)}
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
		</div>
	);
}

export default ManageReport;