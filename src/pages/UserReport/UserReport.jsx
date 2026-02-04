import React, { useState, useEffect } from 'react';
import Title from '../../layouts/Title/Title';
import Dropzone from 'react-dropzone';
import Swal from 'sweetalert2';
import './UserReport.css';
import api, { API_BASE } from '../../utils/api';

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

function UserReport() {
    const [files, setFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUploadingFile, setCurrentUploadingFile] = useState('');
    const [showFilenameModal, setShowFilenameModal] = useState(false);
    const [customFilenames, setCustomFilenames] = useState({});

    // Replace with your actual user info retrieval
    const userId = localStorage.getItem('user_id') || 'demo-user';
    const userEmail = localStorage.getItem('user_email') || 'demo@email.com';
    const user = JSON.parse(localStorage.getItem('user'));
    const firmName = user.firm_name || 'Demo Firm';


    // Fetch user's reports
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/reports/user/${userId}`);
                setUploadedFiles(res.data);
            } catch (err) {
                setError('Failed to fetch reports');
            }
            setLoading(false);
        };
        fetchReports();
    }, [userId]);

    const acceptedFiles = {
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'text/csv': ['.csv'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    };

    const handleDrop = (acceptedFiles) => {
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        const invalidFiles = [];

        // Check file sizes before adding
        acceptedFiles.forEach(file => {
            if (file.size > MAX_FILE_SIZE) {
                invalidFiles.push({
                    name: file.name,
                    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
                });
            }
        });

        if (invalidFiles.length > 0) {
            const fileList = invalidFiles.map(f => `${f.name} (${f.size})`).join('\n');
            Swal.fire({
                title: 'File Too Large',
                html: `The following file(s) exceed the 5MB limit:<br/><br/>${fileList.replace(/\n/g, '<br/>')}`,
                icon: 'error'
            });
            return;
        }

        const newFiles = acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));

        // Check if adding these files would exceed the maximum
        const totalFiles = files.length + newFiles.length;
        if (totalFiles > 5) {
            Swal.fire({
                title: 'Too Many Files',
                text: `You can only upload up to 5 files at once. You currently have ${files.length} files selected.`,
                icon: 'warning'
            });
            return;
        }

        // Initialize custom filenames for new files
        const newCustomFilenames = { ...customFilenames };
        newFiles.forEach(file => {
            if (!newCustomFilenames[file.name]) {
                // Default to filename without extension for custom name
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                newCustomFilenames[file.name] = nameWithoutExt;
            }
        });
        setCustomFilenames(newCustomFilenames);
        setFiles(prevFiles => [...prevFiles, ...newFiles]);
    };

    const removeFile = (fileIndex) => {
        const newFiles = [...files];
        const removedFile = newFiles[fileIndex];
        URL.revokeObjectURL(removedFile.preview);
        newFiles.splice(fileIndex, 1);

        // Remove custom filename for removed file
        const newCustomFilenames = { ...customFilenames };
        delete newCustomFilenames[removedFile.name];
        setCustomFilenames(newCustomFilenames);

        setFiles(newFiles);
    };

    // Handle opening filename modal
    const handleUploadClick = () => {
        if (files.length === 0) return;
        // Initialize custom filenames if not set
        const newCustomFilenames = { ...customFilenames };
        files.forEach(file => {
            if (!newCustomFilenames[file.name]) {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                newCustomFilenames[file.name] = nameWithoutExt;
            }
        });
        setCustomFilenames(newCustomFilenames);
        setShowFilenameModal(true);
    };

    // Handle custom filename change
    const handleCustomFilenameChange = (fileName, customName) => {
        setCustomFilenames(prev => ({
            ...prev,
            [fileName]: customName
        }));
    };

    // Confirm upload from modal
    const handleConfirmUpload = () => {
        // Validate that all custom filenames are not empty
        const hasEmptyNames = files.some(file => {
            const customName = customFilenames[file.name] || '';
            return customName.trim() === '';
        });

        if (hasEmptyNames) {
            Swal.fire({
                title: 'Filename Required',
                text: 'Please provide a filename for all files.',
                icon: 'warning'
            });
            return;
        }

        setShowFilenameModal(false);
        handleUpload();
    };

    // Upload to backend
    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        const uploadResults = {
            successful: [],
            failed: []
        };

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setCurrentUploadingFile(file.name);

            // Use custom filename if available, fallback to original filename
            const customName = customFilenames[file.name] || file.name;
            const fileExtension = file.name.split('.').pop();
            const reportName = customName.trim() || file.name;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('firm_name', firmName);
            formData.append('year', new Date().getFullYear());
            formData.append('report_name', reportName);
            formData.append('user_id', userId);
            formData.append('user_email', userEmail);

            try {
                await api.post('/reports/upload-report', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 300000, // 5 minutes timeout for large files
                });

                uploadResults.successful.push(file.name);
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
                // Extract more detailed error message
                let errorMessage = err.message || 'Unknown error occurred';
                if (err.response?.data?.detail) {
                    errorMessage = err.response.data.detail;
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }

                uploadResults.failed.push({
                    name: file.name,
                    error: errorMessage
                });
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
        }

        setCurrentUploadingFile('');

        // Refetch reports after upload
        try {
            const res = await api.get(`/reports/user/${userId}`);
            setUploadedFiles(res.data);
        } catch (err) {
            console.error('Error fetching updated reports:', err);
        }

        setFiles([]);
        setCustomFilenames({});
        setIsUploading(false);
        setUploadProgress(0);

        // Show upload results
        if (uploadResults.successful.length > 0 && uploadResults.failed.length === 0) {
            // All successful
            Swal.fire({
                title: 'Upload Successful!',
                text: `${uploadResults.successful.length} file(s) uploaded successfully.`,
                icon: 'success'
            });
        } else if (uploadResults.successful.length > 0 && uploadResults.failed.length > 0) {
            // Partial success
            const failedDetails = uploadResults.failed.map(f => `${f.name}: ${f.error}`).join('\n');
            Swal.fire({
                title: 'Partial Upload Success',
                html: `${uploadResults.successful.length} file(s) uploaded successfully.<br/><br/><strong>Failed files:</strong><br/>${failedDetails.replace(/\n/g, '<br/>')}`,
                icon: 'warning'
            });
        } else {
            // All failed
            const failedDetails = uploadResults.failed.map(f => `${f.name}: ${f.error}`).join('\n');
            Swal.fire({
                title: 'Upload Failed',
                html: `All files failed to upload.<br/><br/><strong>Error details:</strong><br/>${failedDetails.replace(/\n/g, '<br/>')}`,
                icon: 'error'
            });
        }
    };

    // Download
    const handleDownload = (file) => {
        window.open(`${API_BASE}${file.file_url}`, '_blank');
    };

    // Delete
    const deleteUploadedFile = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this action!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/reports/user/delete-report/${id}`);
                setUploadedFiles(uploadedFiles.filter(file => file._id !== id));
                Swal.fire('Deleted!', 'Your report has been deleted.', 'success');
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

    // File color (optional, for icons)
    const getFileColor = (type) => {
        switch (type) {
            case 'pdf': return '#dc3545';
            case 'excel': return '#28a745';
            case 'csv': return '#17a2b8';
            case 'word': return '#007bff';
            default: return '#6c757d';
        }
    };

    // Truncate filename if exceeds 20 characters
    const truncateFilename = (filename, maxLength = 20) => {
        if (filename.length <= maxLength) return filename;
        return filename.substring(0, maxLength) + '...';
    };

    return (
        <div className="container-fluid user-report-page">
            <Title title="Sustainability Reports" breadcrumb={[["Sustainability Reports", "/reports"], "Sustainability Reports"]} />

            <div className="row g-3 g-lg-4">
                {/* Upload Section - left on large screens */}
                <div className="col-12 col-lg-5 col-xl-4">
                    <div className="">

                        <Dropzone
                            onDrop={handleDrop}
                            accept={acceptedFiles}
                            multiple={true}
                        >
                            {({ getRootProps, getInputProps, isDragActive }) => (
                                <div
                                    {...getRootProps()}
                                    className={`user-report-dropzone text-center rounded border-2 border-dashed ${isDragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="dz-message needsclick">
                                        <i className={`fas ${isDragActive ? 'fa-file-upload' : 'fa-cloud-upload-alt'} fa-2x text-primary mb-2`}></i>
                                        <p className=" fw-semibold small">
                                            {isDragActive ? 'Drop files here' : 'Drag & drop or click'}
                                        </p>
                                        <small className="text-muted">Up to 5 files · 5MB each</small>
                                    </div>
                                </div>
                            )}
                        </Dropzone>

                        {/* Preview section */}
                        {files.length > 0 && (
                            <div className="mt-3">
                                <div className="d-flex align-items-center mb-2">
                                    <span className="fw-semibold small me-2">
                                        <i className="fas fa-file-alt me-1 text-primary"></i>
                                        Selected
                                    </span>
                                    <span className="badge bg-primary">{files.length}</span>
                                </div>
                                <div className="list-group list-group-flush list-group-sm">
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="list-group-item list-group-item-action py-2 px-2"
                                        >
                                            <div className="d-flex align-items-center">
                                                <div
                                                    className="rounded d-flex align-items-center justify-content-center flex-shrink-0 me-2"
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        background: `linear-gradient(135deg, ${getFileColor(file.name.split('.').pop())}, ${getFileColor(file.name.split('.').pop())}dd)`,
                                                        color: 'white',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {getFileIcon(file.name.split('.').pop())}
                                                </div>
                                                <div className="flex-grow-1 min-w-0">
                                                    <span className="fw-semibold d-block small" title={file.name}>{truncateFilename(file.name)}</span>
                                                    <small className="text-muted">{(file.size / (1024 * 1024)).toFixed(2)} MB</small>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger btn-sm py-0 px-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(index);
                                                    }}
                                                    title="Remove file"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm w-100"
                                        onClick={handleUploadClick}
                                        disabled={isUploading || files.length === 0}
                                    >
                                        {isUploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                {uploadProgress}%
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-upload me-1"></i>
                                                Upload {files.length} file{files.length !== 1 ? 's' : ''}
                                            </>
                                        )}
                                    </button>

                                    {isUploading && (
                                        <div className="mt-2">
                                            <div className="progress" style={{ height: '6px' }}>
                                                <div
                                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                                    role="progressbar"
                                                    style={{ width: `${uploadProgress}%` }}
                                                    aria-valuenow={uploadProgress}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                />
                                            </div>
                                            {currentUploadingFile && (
                                                <small className="text-primary d-block mt-1" title={currentUploadingFile}>{truncateFilename(currentUploadingFile)}</small>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="alert alert-info py-2 px-2 mt-3  small">
                            <i className="fas fa-info-circle me-1"></i>
                            Up to 5 files · PDF, Excel, Word, CSV · 5MB each
                        </div>
                    </div>
                </div>

                {/* Uploaded Reports Section - right on large screens */}
                <div className="col-12 col-lg-7 col-xl-8">
                    <div className="">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2 text-muted small ">Loading reports...</p>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger py-2 px-3 small ">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                {error}
                            </div>
                        ) : uploadedFiles.length > 0 ? (
                            <div className="table-responsive shadow-sm rounded bg-white">
                                <table className="table table-hover align-middle">
                                    <thead className="table-dark table-nowrap">
                                        <tr>
                                            <th className="fw-bold text-nowrap">No</th>
                                            <th className="fw-bold text-center text-nowrap">Actions</th>
                                            <th className="fw-bold text-nowrap">File Name</th>
                                            <th className="fw-bold text-nowrap">Type</th>
                                            <th className="fw-bold text-nowrap">Size</th>
                                            <th className="fw-bold text-nowrap">Upload Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploadedFiles.map((file, index) => (
                                            <tr key={file._id}>
                                                <td>{index + 1}</td>
                                                <td className="text-center">
                                                    <div className="btn-group" role="group">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() => handleDownload(file)}
                                                            title="Download"
                                                        >
                                                            <i className="fas fa-download"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => deleteUploadedFile(file._id)}
                                                            title="Delete"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div>
                                                            <h6 className="fw-bold" title={file.report_name || file.file_name || 'N/A'}>
                                                                {truncateFilename(file.report_name || file.file_name || 'N/A')}
                                                            </h6>
                                                            <small className="text-muted">
                                                                {file.firm_name || 'N/A'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        {file.file_type ? file.file_type.toUpperCase() : 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="text-muted">
                                                        {file.file_size ? (file.file_size / (1024 * 1024)).toFixed(2) + ' MB' : '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        <i className="fas fa-calendar-alt me-1"></i>
                                                        {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        }) : '-'}
                                                    </small>
                                                </td>

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <i className="fas fa-folder-open fa-3x text-muted opacity-50 mb-2"></i>
                                <p className="fw-semibold text-muted mb-1 small">No reports yet</p>
                                <p className="text-muted small ">Upload using the panel on the left</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filename Modal */}
            {showFilenameModal && (
                <>
                    <div className="modal-backdrop fade show" onClick={() => !isUploading && setShowFilenameModal(false)}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title fw-bold">
                                        <i className="fas fa-file-alt me-2"></i>
                                        Set File Names
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowFilenameModal(false)}
                                        disabled={isUploading}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <p className="text-muted small mb-3">
                                        Enter custom names for your files. These names will be displayed in your reports list.
                                    </p>
                                    <div className="list-group">
                                        {files.map((file, index) => {
                                            const fileExtension = file.name.split('.').pop();
                                            return (
                                                <div key={index} className="list-group-item">
                                                    <div className="mb-2">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <div
                                                                className="rounded d-flex align-items-center justify-content-center flex-shrink-0 me-2"
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    background: `linear-gradient(135deg, ${getFileColor(fileExtension)}, ${getFileColor(fileExtension)}dd)`,
                                                                    color: 'white',
                                                                    fontSize: '0.875rem'
                                                                }}
                                                            >
                                                                {getFileIcon(fileExtension)}
                                                            </div>
                                                            <div className="flex-grow-1 min-w-0">
                                                                <small className="text-muted d-block" title={file.name}>
                                                                    Original: {truncateFilename(file.name)}
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <label className="form-label small fw-semibold mb-1">File Name</label>
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            value={customFilenames[file.name] || ''}
                                                            onChange={(e) => handleCustomFilenameChange(file.name, e.target.value)}
                                                            placeholder={`Enter file name (without extension)`}
                                                            disabled={isUploading}
                                                        />
                                                        <small className="text-muted">
                                                            Will be saved as: <strong title={(customFilenames[file.name] || file.name.replace(/\.[^/.]+$/, '')) + '.' + fileExtension}>
                                                                {truncateFilename((customFilenames[file.name] || file.name.replace(/\.[^/.]+$/, '')) + '.' + fileExtension)}
                                                            </strong>
                                                        </small>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setShowFilenameModal(false)}
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={handleConfirmUpload}
                                        disabled={isUploading}
                                    >
                                        <i className="fas fa-upload me-1"></i>
                                        Confirm & Upload
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default UserReport;