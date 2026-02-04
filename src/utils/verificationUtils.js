import Swal from 'sweetalert2';

/**
 * Check if user has submitted business verification (any valid method)
 * Valid: SME Corp number, or SSM + business (Register path)
 * @param {Object} userData - User data object
 * @returns {boolean} - True if verification data has been submitted, false otherwise
 */
export const isVerificationComplete = (userData) => {
    if (!userData || !userData.verification) {
        return false;
    }
    const verification = userData.verification;
    const hasSmeCorp = !!(verification.sme_corp?.number);
    const hasSsmAndBusiness = verification.ssm && verification.business &&
        Object.keys(verification.ssm).length > 0 &&
        Object.keys(verification.business).length > 0;
    return hasSmeCorp || hasSsmAndBusiness;
};

/**
 * Show verification prompt and redirect to verification page
 * @param {Function} navigate - React Router navigate function
 * @param {string} currentPath - Current path to redirect back to after verification
 */
export const showVerificationPrompt = (navigate, currentPath = '/dashboard') => {
    Swal.fire({
        title: 'Business Verification Required',
        html: `
            <div class="text-start">
                <p class="mb-3">Complete your business verification to comply with platform requirements and ensure accurate data collection.</p>
                <div class="alert alert-info">
                    <strong>Why verification is required:</strong>
                    <ul class=" mt-2">
                        <li>Compliance with platform policies</li>
                        <li>Accurate business data collection</li>
                        <li>MSME status validation</li>
                        <li>Platform access requirements</li>
                    </ul>
                </div>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Complete Verification',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#f39c12',
        cancelButtonColor: '#6c757d',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            // Store the current path to redirect back after verification
            localStorage.setItem('redirectAfterVerification', currentPath);
            navigate('/profile/verification');
        }
    });
};

/**
 * Check verification status and redirect if needed
 * @param {Object} userData - User data object
 * @param {Function} navigate - React Router navigate function
 * @param {string} currentPath - Current path
 * @returns {boolean} - True if verification is complete, false if redirected
 */
export const checkVerificationAndRedirect = (userData, navigate, currentPath = '/dashboard') => {
    if (!isVerificationComplete(userData)) {
        showVerificationPrompt(navigate, currentPath);
        return false;
    }
    return true;
};

/**
 * Show verification prompt without blocking access (for dashboard)
 * @param {Function} navigate - React Router navigate function
 */
export const showVerificationNotification = (navigate) => {
    Swal.fire({
        title: 'Complete Your Business Verification',
        html: `
            <div class="text-start">
                <p class="mb-3">Complete your business verification to comply with platform requirements and ensure accurate data collection.</p>
                <div class="alert alert-info">
                    <strong>Why verification is required:</strong>
                    <ul class=" mt-2">
                        <li>Compliance with platform policies</li>
                        <li>Accurate business data collection</li>
                        <li>MSME status validation</li>
                        <li>Platform access requirements</li>
                    </ul>
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Complete Verification',
        cancelButtonText: 'Maybe Later',
        confirmButtonColor: '#f39c12',
        cancelButtonColor: '#6c757d',
        reverseButtons: true,
        allowOutsideClick: true,
        allowEscapeKey: true
    }).then((result) => {
        if (result.isConfirmed) {
            navigate('/profile/verification');
        }
    });
};

/**
 * Get business verification status for display (uses status.business_verified, not email)
 * @param {Object} userData - User data object
 * @returns {Object} - Verification status object
 */
export const getVerificationStatus = (userData) => {
    if (!userData || !userData.verification || Object.keys(userData.verification).length === 0) {
        return {
            isComplete: false,
            status: 'Not Started',
            message: 'Business verification not completed',
            color: 'warning'
        };
    }

    const verification = userData.verification;
    const hasSmeCorp = !!(verification.sme_corp?.number);
    const hasSsmAndBusiness = verification.ssm && verification.business &&
        Object.keys(verification.ssm).length > 0 &&
        Object.keys(verification.business).length > 0;
    const hasSubmitted = hasSmeCorp || hasSsmAndBusiness;

    if (!hasSubmitted) {
        return {
            isComplete: false,
            status: 'Incomplete',
            message: 'Verification partially completed',
            color: 'warning'
        };
    }

    const isBusinessVerified = userData.status?.business_verified === true;
    return {
        isComplete: true,
        status: isBusinessVerified ? 'Verified' : 'Pending Review',
        message: isBusinessVerified ? 'Business verification completed and approved' : 'Verification submitted, pending admin review',
        color: isBusinessVerified ? 'success' : 'info'
    };
};
