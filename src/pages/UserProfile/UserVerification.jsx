import React, { useState } from 'react';
import Swal from 'sweetalert2';
import Title from '../../layouts/Title/Title';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE } from '../../utils/api';
// import './UserVerification.css';

function UserVerification() {
    const navigate = useNavigate();
    const [verificationMethod, setVerificationMethod] = useState(''); // 'sme_corp' or 'register'
    const [formData, setFormData] = useState({
        smeCorpNumber: '',
        registrationNumber: '',
        registrationDate: '',
        businessAddress: '',
        employeeCount: '',
        annualRevenue: '',
        bumiputeraStatus: '',
        consentGiven: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [ssmCertificateFile, setSsmCertificateFile] = useState(null);
    const [ssmCertificateUrl, setSsmCertificateUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
        
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            Swal.fire({
                title: "Invalid File Type",
                text: "Please upload a PDF, JPG, JPEG, or PNG file.",
                icon: "error",
                confirmButtonColor: "#f5576c"
            });
            return;
        }

        // Validate file size (100MB max)
        const maxSize = 100 * 1024 * 1024; // 100MB in bytes
        if (file.size > maxSize) {
            Swal.fire({
                title: "File Too Large",
                text: "File size must be less than 100MB.",
                icon: "error",
                confirmButtonColor: "#f5576c"
            });
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', localStorage.getItem('user_id') || 'unknown');
        formData.append('folder_name', 'ssm_certificates');

        try {
            const response = await api.post('/storage/upload-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const uploadResult = response.data;
            setSsmCertificateUrl(uploadResult.file_url);
            setSsmCertificateFile(file);

            Swal.fire({
                title: "Upload Successful!",
                text: "SSM certificate uploaded successfully.",
                icon: "success",
                confirmButtonColor: "#667eea"
            });

        } catch (error) {
            Swal.fire({
                title: "Upload Failed",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#f5576c"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!verificationMethod) {
            errors.verificationMethod = 'Please select a verification method';
            setFieldErrors(errors);
            return false;
        }
        
        if (verificationMethod === 'sme_corp') {
            if (!formData.smeCorpNumber.trim()) {
                errors.smeCorpNumber = 'SME Corp Number is required';
            }
        } else if (verificationMethod === 'register') {
            if (!formData.registrationNumber.trim()) {
                errors.registrationNumber = 'SSM Registration Number is required';
            }
            
            if (!formData.registrationDate) {
                errors.registrationDate = 'Registration Date is required';
            }
            
            if (!formData.businessAddress.trim()) {
                errors.businessAddress = 'Business Address is required';
            }
            
            if (!formData.employeeCount) {
                errors.employeeCount = 'Number of Employees is required';
            } else if (parseInt(formData.employeeCount) < 1) {
                errors.employeeCount = 'Number of employees must be at least 1';
            }
            
            if (!formData.annualRevenue) {
                errors.annualRevenue = 'Annual Revenue is required';
            } else if (parseFloat(formData.annualRevenue) < 0) {
                errors.annualRevenue = 'Annual revenue cannot be negative';
            }
            
            if (!formData.bumiputeraStatus) {
                errors.bumiputeraStatus = 'Bumiputera Status is required';
            }
            
            if (!ssmCertificateUrl) {
                errors.ssmCertificate = 'SSM Certificate upload is required';
            }
        }
        
        if (!formData.consentGiven) {
            errors.consentGiven = 'You must agree to the terms and conditions to proceed';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        let payload = {
            consent: {
                given: formData.consentGiven,
                timestamp: new Date().toISOString(),
                version: "1.0"
            }
        };

        if (verificationMethod === 'sme_corp') {
            payload.sme_corp = {
                number: formData.smeCorpNumber.trim()
            };
        } else if (verificationMethod === 'register') {
            payload.ssm = {
                registration_number: formData.registrationNumber,
                registration_date: formData.registrationDate,
                certificate_file: ssmCertificateUrl
            };
            payload.business = {
                address: formData.businessAddress,
                employee_count: parseInt(formData.employeeCount),
                annual_revenue: parseFloat(formData.annualRevenue),
                bumiputera_status: formData.bumiputeraStatus === 'yes'
            };
        }
        
        const email = localStorage.getItem("user_email");
        console.log("Email for verification:", email);
        console.log("Verification method:", verificationMethod);
        console.log("Payload for verification:", payload);
        
        try {
            await api.put(`/auth/user/verification/update?email=${email}`, payload);
            
            Swal.fire({
                title: "Success!",
                text: "Your verification request has been submitted successfully.",
                icon: "success",
                confirmButtonColor: "#667eea",
                confirmButtonText: "Continue"
            }).then(() => {
                const redirectPath = localStorage.getItem('redirectAfterVerification');
                localStorage.removeItem('redirectAfterVerification');
                if (redirectPath && redirectPath.startsWith('/') && redirectPath !== '/profile/verification') {
                    navigate(redirectPath);
                } else {
                    navigate('/profile');
                }
            });
        } catch (err) {
            Swal.fire({
                title: "Error",
                text: err.message,
                icon: "error",
                confirmButtonColor: "#f5576c"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMSMECategory = () => {
        const employeeCount = parseInt(formData.employeeCount) || 0;
        const annualRevenue = parseFloat(formData.annualRevenue) || 0;
        
        if (employeeCount <= 5 && annualRevenue <= 300000) {
            return { category: 'Micro', color: 'success' };
        } else if (employeeCount <= 30 && annualRevenue <= 15000000) {
            return { category: 'Small', color: 'info' };
        } else if (employeeCount <= 75 && annualRevenue <= 50000000) {
            return { category: 'Medium', color: 'warning' };
        } else {
            return { category: 'Large', color: 'danger' };
        }
    };

    const msmCategory = getMSMECategory();

    return (
        <div className="container-fluid">
            <Title title="Business Verification" breadcrumb={[["Dashboard", "/dashboard"], ["Profile", "/profile"], "Business Verification"]} />
            
            <div className="row">
                <div className="col-12">
                    {/* Header Card */}
                    <div className="rounded mb-2 verification-card">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-4 text-end">
                                    <span className={`badge bg-${msmCategory.color} fs-6 px-3 py-2 d-none`}>
                                        <i className="fas fa-building me-1"></i>
                                        {msmCategory.category} MSME
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Verification Method Selection */}
                        {!verificationMethod && (
                            <div className="rounded mb-4 verification-card">
                                <div className="card-body">
                                    <h5 className="card-title mb-4 section-title">
                                        <i className="fas fa-check-circle me-1 text-primary"></i>
                                        How would you like to be verified?
                                    </h5>
                                    
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <div 
                                                className={`card h-100 border ${fieldErrors.verificationMethod ? 'border-danger' : 'border-secondary'} cursor-pointer`}
                                                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                                                onClick={() => {
                                                    setVerificationMethod('sme_corp');
                                                    setFieldErrors(prev => ({ ...prev, verificationMethod: '' }));
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = verificationMethod === 'sme_corp' ? '#667eea' : '#6c757d'}
                                            >
                                                <div className="card-body text-center">
                                                    <div className="mb-3">
                                                        <i className="fas fa-id-card text-primary" style={{ fontSize: '3rem' }}></i>
                                                    </div>
                                                    <h5 className="card-title fw-bold">SME Corp Number</h5>
                                                    <p className="text-muted">Quick verification using your SME Corp registration number</p>
                                                    <div className="mt-3">
                                                        <span className="badge bg-primary">Fast & Simple</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <div 
                                                className={`card h-100 border ${fieldErrors.verificationMethod ? 'border-danger' : 'border-secondary'} cursor-pointer`}
                                                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                                                onClick={() => {
                                                    setVerificationMethod('register');
                                                    setFieldErrors(prev => ({ ...prev, verificationMethod: '' }));
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#667eea'}
                                                onMouseLeave={(e) => e.currentTarget.style.borderColor = verificationMethod === 'register' ? '#667eea' : '#6c757d'}
                                            >
                                                <div className="card-body text-center">
                                                    <div className="mb-3">
                                                        <i className="fas fa-file-contract text-success" style={{ fontSize: '3rem' }}></i>
                                                    </div>
                                                    <h5 className="card-title fw-bold">Register Your Business</h5>
                                                    <p className="text-muted">Complete registration with SSM details and business information</p>
                                                    <div className="mt-3">
                                                        <span className="badge bg-success">Full Details</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {fieldErrors.verificationMethod && (
                                        <div className="text-danger mt-2">
                                            <i className="fas fa-exclamation-circle me-1"></i>
                                            {fieldErrors.verificationMethod}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SME Corp Number Form */}
                        {verificationMethod === 'sme_corp' && (
                            <>
                                <div className="rounded mb-4 verification-card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="card-title  section-title">
                                                <i className="fas fa-id-card me-1 text-primary"></i>
                                                SME Corp Number Verification
                                            </h5>
                                            <button
                                                type="button"
                                                className="btn "
                                                onClick={() => setVerificationMethod('')}
                                            >
                                                <i className="fas fa-arrow-left me-1"></i>
                                                Change Method
                                            </button>
                                        </div>
                                        
                                        <div className="alert alert-light border mb-4">
                                            <p className="">
                                                <i className="fas fa-info-circle text-info me-1"></i>
                                                Enter your SME Corp registration number for quick verification.
                                            </p>
                                        </div>
                                        
                                        <div className="row">
                                            <div className="col-md-8 mb-3">
                                                <label className="form-label fw-medium text-muted">
                                                    <i className="fas fa-hashtag me-1"></i>
                                                    SME Corp Number <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${fieldErrors.smeCorpNumber ? 'is-invalid' : ''}`}
                                                    name="smeCorpNumber"
                                                    value={formData.smeCorpNumber}
                                                    onChange={handleChange}
                                                    placeholder="Enter your SME Corp registration number"
                                                />
                                                {fieldErrors.smeCorpNumber && (
                                                    <div className="invalid-feedback">{fieldErrors.smeCorpNumber}</div>
                                                )}
                                                <small className="text-muted">Enter your registered SME Corp number</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Full Registration Form */}
                        {verificationMethod === 'register' && (
                            <>
                                <div className="rounded mb-4 verification-card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="card-title  section-title">
                                                <i className="fas fa-file-contract me-1 text-success"></i>
                                                Business Registration
                                            </h5>
                                            <button
                                                type="button"
                                                className="btn btn-sm"
                                                onClick={() => setVerificationMethod('')}
                                            >
                                                <i className="fas fa-arrow-left me-1"></i>
                                                Change Method
                                            </button>
                                        </div>
                                    </div>
                                </div>
                        {/* SSM Information Section */}
                        <div className="rounded mb-4 verification-card">
                            <div className="card-body ">
                                <h5 className="card-title mb-4 section-title">
                                    <i className="fas fa-file-contract me-1 text-primary"></i>
                                    SSM Registration Details
                                </h5>
                                
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">
                                            <i className="fas fa-hashtag me-1"></i>
                                            SSM Registration Number <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${fieldErrors.registrationNumber ? 'is-invalid' : ''}`}
                                            name="registrationNumber"
                                            value={formData.registrationNumber}
                                            onChange={handleChange}
                                            placeholder="e.g., 1234567-X"
                                        />
                                        {fieldErrors.registrationNumber && (
                                            <div className="invalid-feedback">{fieldErrors.registrationNumber}</div>
                                        )}
                                        <small className="text-muted">Companies Commission of Malaysia (SSM) registration number</small>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">
                                            <i className="fas fa-calendar me-1"></i>
                                            Registration Date <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            className={`form-control ${fieldErrors.registrationDate ? 'is-invalid' : ''}`}
                                            name="registrationDate"
                                            value={formData.registrationDate}
                                            onChange={handleChange}
                                        />
                                        {fieldErrors.registrationDate && (
                                            <div className="invalid-feedback">{fieldErrors.registrationDate}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">
                                            <i className="fas fa-file-pdf me-1"></i>
                                            SSM Certificate <span className="text-danger">*</span>
                                        </label>
                                        <div className="upload-section">
                                            <input
                                                type="file"
                                                id="ssmCertificate"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="form-control"
                                                disabled={isUploading}
                                            />
                                            {ssmCertificateFile && (
                                                <div className="mt-2">
                                                    <div className="d-flex align-items-center">
                                                        <i className="fas fa-file-pdf text-primary me-1"></i>
                                                        <span className="text-muted small">{ssmCertificateFile.name}</span>
                                                        <span className="badge bg-success ms-2">Uploaded</span>
                                                    </div>
                                                    {ssmCertificateUrl && (
                                                        <a 
                                                            href={`${API_BASE}${ssmCertificateUrl}`} 
                                                            target="_blank" 
                                                            rel="noreferrer" 
                                                            className="btn btn-outline-primary btn-sm mt-2"
                                                        >
                                                            <i className="fas fa-eye me-1"></i>
                                                            View Certificate
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {isUploading && (
                                                <div className="mt-2">
                                                    <div className="d-flex align-items-center">
                                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                        <span className="text-muted small">Uploading...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {fieldErrors.ssmCertificate && (
                                            <div className="invalid-feedback d-block">{fieldErrors.ssmCertificate}</div>
                                        )}
                                        <small className="text-muted">Upload your SSM registration certificate (PDF, JPG, PNG - Max 100MB)</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Details Section */}
                        <div className="rounded mb-4 verification-card">
                            <div className="card-body">
                                <h5 className="card-title mb-4 section-title">
                                    <i className="fas fa-store me-1 text-success"></i>
                                    Business Details
                                </h5>
                                
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">
                                            <i className="fas fa-users me-1"></i>
                                            Number of Employees <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className={`form-control ${fieldErrors.employeeCount ? 'is-invalid' : ''}`}
                                            name="employeeCount"
                                            value={formData.employeeCount}
                                            onChange={handleChange}
                                            min="1"
                                            placeholder="Enter total employees"
                                        />
                                        {fieldErrors.employeeCount && (
                                            <div className="invalid-feedback">{fieldErrors.employeeCount}</div>
                                        )}
                                        <small className="text-muted">MSME: Micro (1-5), Small (6-30), Medium (31-75)</small>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">
                                            <i className="fas fa-money-bill-wave me-1"></i>
                                            Annual Sales Turnover <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className={`form-control ${fieldErrors.annualRevenue ? 'is-invalid' : ''}`}
                                            name="annualRevenue"
                                            value={formData.annualRevenue}
                                            onChange={handleChange}
                                            min="0"
                                            placeholder="Enter annual revenue in RM"
                                        />
                                        {fieldErrors.annualRevenue && (
                                            <div className="invalid-feedback">{fieldErrors.annualRevenue}</div>
                                        )}
                                        <small className="text-muted">MSME: Micro (≤RM300K), Small (≤RM15M), Medium (≤RM50M)</small>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-medium text-muted">
                                            <i className="fas fa-flag me-1"></i>
                                            Bumiputera Status <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select ${fieldErrors.bumiputeraStatus ? 'is-invalid' : ''}`}
                                            name="bumiputeraStatus"
                                            value={formData.bumiputeraStatus}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Status</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                        {fieldErrors.bumiputeraStatus && (
                                            <div className="invalid-feedback">{fieldErrors.bumiputeraStatus}</div>
                                        )}
                                        <small className="text-muted">Indicate if your business is Bumiputera-owned</small>
                                    </div>

                                    <div className="col-12 mb-3">
                                        <label className="form-label fw-medium text-muted">
                                            <i className="fas fa-map-marker-alt me-1"></i>
                                            Business Address <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            className={`form-control ${fieldErrors.businessAddress ? 'is-invalid' : ''}`}
                                            name="businessAddress"
                                            value={formData.businessAddress}
                                            onChange={handleChange}
                                            rows="3"
                                            placeholder="Enter your complete business address in Malaysia"
                                        ></textarea>
                                        {fieldErrors.businessAddress && (
                                            <div className="invalid-feedback">{fieldErrors.businessAddress}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                            </>
                        )}

                        {/* Consent Section - Only shown when verification method is selected */}
                        {verificationMethod && (
                        <div className="rounded mb-4 verification-card">
                            <div className="card-body">
                                <h5 className="card-title mb-4 section-title">
                                    <i className="fas fa-shield-check me-1 text-success"></i>
                                    Data Protection & Consent Agreement
                                </h5>
                                
                                <div className="alert alert-light border mb-4">
                                    <div className="row">
                                        <div className="col-12">
                                            <h6 className="fw-bold text-dark mb-3">
                                                <i className="fas fa-info-circle text-info me-1"></i>
                                                Personal Data Protection Act 2010 (PDPA) Compliance
                                            </h6>
                                            
                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-dark">Purpose of Data Collection:</h6>
                                                <p className="text-muted mb-2">
                                                    We collect your business information to verify your Malaysian MSME status and provide you with access to ESG assessment tools, learning centre, and business support services.
                                                </p>
                                            </div>

                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-dark">Types of Data Collected:</h6>
                                                {verificationMethod === 'sme_corp' ? (
                                                    <ul className="text-muted mb-2">
                                                        <li>SME Corp registration number</li>
                                                        <li>Consent agreement and timestamp</li>
                                                    </ul>
                                                ) : (
                                                    <ul className="text-muted mb-2">
                                                        <li>SSM Registration details (registration number, date, certificate)</li>
                                                        <li>Business information (address, employee count, annual revenue)</li>
                                                        <li>Bumiputera status information</li>
                                                        <li>Consent agreement and timestamp</li>
                                                    </ul>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-dark">Data Usage & Disclosure:</h6>
                                                <p className="text-muted mb-2">
                                                    Your personal data will be used for the following purposes:
                                                </p>
                                                <ul className="text-muted mb-2">
                                                    <li>MSME verification and status confirmation</li>
                                                    <li>ESG assessment scoring and reporting</li>
                                                    <li>Providing access to learning centre and business support services</li>
                                                    <li>Platform functionality and service delivery</li>
                                                    <li>Compliance with Malaysian business regulations</li>
                                                </ul>
                                                <p className="text-muted mb-2">
                                                    We may share anonymized and aggregated data with government agencies for MSME program compliance and statistical purposes. 
                                                    Your personal data will not be sold or disclosed to third parties for marketing purposes without your explicit consent.
                                                </p>
                                            </div>

                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-dark">Data Retention:</h6>
                                                <p className="text-muted mb-2">
                                                    Your personal data will be retained for the duration of your account with us and for a period of 7 years after account closure, 
                                                    as required by Malaysian business regulations.
                                                </p>
                                            </div>

                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-dark">Your Rights Under PDPA:</h6>
                                                <p className="text-muted mb-2">
                                                    Under the Personal Data Protection Act 2010 (PDPA) of Malaysia, you have the following rights:
                                                </p>
                                                <ul className="text-muted mb-2">
                                                    <li><strong>Right to Access:</strong> Request access to your personal data held by us</li>
                                                    <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete personal data</li>
                                                    <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent for data processing at any time</li>
                                                    <li><strong>Right to Prevent Processing:</strong> Request to limit or stop processing of your personal data</li>
                                                    <li><strong>Right to Data Portability:</strong> Request a copy of your personal data in a structured format</li>
                                                </ul>
                                                <p className="text-muted mb-2">
                                                    To exercise any of these rights, please contact us through the platform's support channels or email the platform administrators.
                                                </p>
                                            </div>

                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-dark">Security Measures:</h6>
                                                <p className="text-muted mb-2">
                                                    We implement appropriate technical and organizational security measures to protect your personal data, including:
                                                </p>
                                                <ul className="text-muted mb-2">
                                                    <li>Encryption of data in transit and at rest</li>
                                                    <li>Access controls and authentication mechanisms</li>
                                                    <li>Regular security audits and assessments</li>
                                                    <li>Secure data storage and backup procedures</li>
                                                    <li>Staff training on data protection and privacy</li>
                                                </ul>
                                            </div>

                                            <div className="mb-3">
                                                <h6 className="fw-semibold text-dark">Contact Information:</h6>
                                                <p className="text-muted mb-2">
                                                    If you have any questions, concerns, or wish to exercise your rights under the PDPA regarding your personal data, 
                                                    please contact us through the platform's support channels or reach out to the platform administrators.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-check">
                                    <input
                                        className={`form-check-input ${fieldErrors.consentGiven ? 'is-invalid' : ''}`}
                                        type="checkbox"
                                        name="consentGiven"
                                        id="consentGiven"
                                        checked={formData.consentGiven}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label fw-medium" htmlFor="consentGiven">
                                        <strong>I hereby give my explicit consent</strong> <span className="text-danger">*</span> for the collection, processing, and use of my personal data 
                                        as described above, in accordance with the Personal Data Protection Act 2010 (PDPA) of Malaysia. 
                                        I understand that I can withdraw this consent at any time by contacting the platform administrators.
                                    </label>
                                    {fieldErrors.consentGiven && (
                                        <div className="invalid-feedback d-block">{fieldErrors.consentGiven}</div>
                                    )}
                                </div>

                                <div className="mt-3">
                                    <small className="text-muted">
                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                        <strong>Important:</strong> By checking this box, you acknowledge that you have read, understood, and agree to the terms outlined above. 
                                        This consent is required to proceed with your MSME verification.
                                    </small>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Submit Button - Only shown when verification method is selected */}
                        {verificationMethod && (
                        <div className="rounded verification-card mb-4">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-1 fw-bold text-dark">Ready to Submit?</h6>
                                        <p className="text-muted ">Review your information before submitting for verification</p>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check-circle me-1"></i>
                                                Submit Verification
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UserVerification;
