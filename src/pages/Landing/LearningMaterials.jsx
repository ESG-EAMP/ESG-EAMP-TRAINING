import React, { useEffect, useState } from 'react';
import LandingLayout from '../../layouts/LandingLayout/LandingLayout';
import { useLocation } from 'react-router-dom';
import Empty from '../../components/Empty';
import api, { getToken } from '../../utils/api';

function LearningMaterials({ landing = false }) {
    const [sections, setSections] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
    const [isCheckingAssessment, setIsCheckingAssessment] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();
    const selectedCategory = (() => {
        try {
            const params = new URLSearchParams(location.search);
            return params.get('category');
        } catch (e) {
            return null;
        }
    })();

    // Helper function to convert section name to URL-friendly ID
    const getSectionId = (sectionName) => {
        if (!sectionName) return '';
        return sectionName
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Scroll to section if hash is present
    useEffect(() => {
        const scrollToSection = () => {
            const hash = window.location.hash;
            if (hash) {
                const sectionId = hash.substring(1); // Remove the #
                const element = document.getElementById(sectionId);
                if (element) {
                    // Small delay to ensure DOM is ready
                    setTimeout(() => {
                        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
                        const viewportHeight = window.innerHeight;
                        // Scroll to 5% from top of viewport
                        const scrollPosition = elementTop - (viewportHeight * 0.08);
                        window.scrollTo({
                            top: Math.max(0, scrollPosition),
                            behavior: 'smooth'
                        });
                    }, 100);
                }
            }
        };

        // Check on mount and when sections are loaded
        if (!loading && sections.length > 0) {
            scrollToSection();
        }

        // Listen for hash changes
        const handleHashChange = () => {
            scrollToSection();
        };

        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [loading, sections]);

    // Check if user is logged in and has completed at least 1 assessment
    useEffect(() => {
        const checkLoginAndAssessment = async () => {
            try {
                // Use getToken() utility which checks both sessionStorage and localStorage
                const userId = localStorage.getItem('user_id');
                const token = getToken(); // This checks sessionStorage first, then localStorage
                const loggedIn = !!(userId && token);
                
                // Update login status
                console.log('Login status check:', { 
                    userId: !!userId, 
                    userIdValue: userId,
                    token: !!token, 
                    tokenValue: token ? token.substring(0, 20) + '...' : null,
                    loggedIn 
                });
                setIsLoggedIn(loggedIn);
                
                // Only check assessment if user is logged in
                if (!loggedIn) {
                    setHasCompletedAssessment(false);
                    setIsCheckingAssessment(false);
                    return;
                }

                // Fetch user's assessment responses
                // Using selected_only=true means only completed/selected assessments are returned
                const response = await api.get(`/assessment/user/v2/get-responses-2?user_id=${userId}&selected_only=true`);
                const data = response.data;
                
                // Check if user has completed at least one assessment
                // Response structure: [{ user_id, years: [{ year, data, score, ... }] }]
                // Since selected_only=true, any returned assessment is completed
                if (Array.isArray(data) && data.length > 0) {
                    const firstResponse = data[0];
                    const years = firstResponse?.years || [];
                    // If there are any years in the response, user has completed at least one assessment
                    // (because selected_only=true filters to only completed assessments)
                    const hasCompleted = years.length > 0;
                    console.log('Assessment completion check:', { 
                        hasCompleted, 
                        yearsCount: years.length,
                        userId 
                    });
                    setHasCompletedAssessment(hasCompleted);
                } else {
                    console.log('No completed assessments found for user:', userId);
                    setHasCompletedAssessment(false);
                }
            } catch (err) {
                console.error('Error checking assessment completion:', err);
                // If error, assume user hasn't completed assessment (safer default)
                setHasCompletedAssessment(false);
            } finally {
                setIsCheckingAssessment(false);
            }
        };

        checkLoginAndAssessment();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Always check login status directly from storage to ensure we have the latest value
                const userId = localStorage.getItem('user_id');
                const token = getToken();
                const loggedIn = !!(userId && token);
                
                // Update state if it's different
                if (loggedIn !== isLoggedIn) {
                    console.log('Login status mismatch, updating state:', { 
                        stateValue: isLoggedIn, 
                        storageValue: loggedIn,
                        hasUserId: !!userId,
                        hasToken: !!token
                    });
                    setIsLoggedIn(loggedIn);
                }
                
                // Fetch sections - use different endpoint based on login status
                let dynamicSections = [];
                if (loggedIn) {
                    // For logged-in users, use authenticated endpoint to get all published sections
                    try {
                        const sectionsRes = await api.get('/learning-materials-sections/user/list');
                        dynamicSections = sectionsRes.data || [];
                    } catch (err) {
                        console.error('Failed to fetch sections for logged-in user:', err);
                        setError('Failed to load learning sections. Please try refreshing the page.');
                        setLoading(false);
                        return;
                    }
                } else {
                    // For non-logged-in users, use public endpoint
                    const sectionsRes = await fetch(`${import.meta.env.VITE_APP_API}/learning-materials-sections/public`);
                    if (!sectionsRes.ok) {
                        console.error('Failed to fetch sections:', sectionsRes.status, sectionsRes.statusText);
                        const errorText = await sectionsRes.text();
                        console.error('Error response:', errorText);
                        setError('Failed to load learning sections.');
                        setLoading(false);
                        return;
                    }
                    dynamicSections = await sectionsRes.json();
                }

                // Fetch materials - use different endpoint based on login status
                let dynamicMaterials = [];
                if (loggedIn) {
                    // For logged-in users, use authenticated endpoint to get all published materials
                    // No fallback - if this fails, show error to user
                    try {
                        const materialsRes = await api.get('/learning-materials/user/list');
                        dynamicMaterials = materialsRes.data || [];
                    } catch (err) {
                        console.error('Failed to fetch materials for logged-in user:', err);
                        setError('Failed to load learning materials. Please try refreshing the page.');
                        setLoading(false);
                        return;
                    }
                } else {
                    // For non-logged-in users, use public endpoint
                    const materialsRes = await fetch(`${import.meta.env.VITE_APP_API}/learning-materials/public/list`);
                    if (!materialsRes.ok) {
                        console.error('Failed to fetch materials:', materialsRes.status, materialsRes.statusText);
                        const errorText = await materialsRes.text();
                        console.error('Error response:', errorText);
                        setError('Failed to load learning materials.');
                        setLoading(false);
                        return;
                    }
                    dynamicMaterials = await materialsRes.json();
                }

                console.log('Fetched sections:', dynamicSections.length, dynamicSections);
                console.log('Fetched materials:', dynamicMaterials.length, dynamicMaterials);

                // Filter materials based on settings
                // Note: Backend already filters by isMaterialPublic for public endpoint
                // and returns all published materials for user endpoint
                const materialsBeforeFilter = dynamicMaterials.length;
                dynamicMaterials = dynamicMaterials.filter((m) => {
                    // For non-logged-in users, public endpoint already filters by isMaterialPublic
                    // Just double-check for safety
                    if (!loggedIn && m.isMaterialPublic === false) {
                        return false;
                    }
                    
                    // Filter by assessment completion requirement
                    if (m.requiresAssessmentCompletion === true) {
                        const shouldShow = hasCompletedAssessment;
                        if (!shouldShow) {
                            console.log(`Material "${m.title}" requires assessment completion but user hasn't completed one`);
                        }
                        return shouldShow;
                    }
                    
                    // Otherwise, show the material
                    return true;
                });
                
                console.log('Materials filtering:', {
                    before: materialsBeforeFilter,
                    after: dynamicMaterials.length,
                    hasCompletedAssessment,
                    loggedIn,
                    materialsRequiringAssessment: dynamicMaterials.filter(m => m.requiresAssessmentCompletion === true).length
                });

                // Sort sections by order (backend already filters by status and isSectionPublic)
                const sortedSections = (dynamicSections || []).sort((a, b) => {
                    const orderA = a.order || 999;
                    const orderB = b.order || 999;
                    return orderA - orderB;
                });

                setSections(sortedSections);
                setMaterials(dynamicMaterials || []);
            } catch (err) {
                console.error('Error fetching learning materials:', err);
                setError('Failed to load learning materials.');
            } finally {
                setLoading(false);
            }
        };
        
        // Only fetch materials after assessment check is complete
        if (!isCheckingAssessment) {
            fetchData();
        }
    }, [isCheckingAssessment, hasCompletedAssessment, isLoggedIn]);

    // Helper to resolve the correct image URL
    const getImageUrl = (m) => {
        if (!m.image_url) return null;

        // If already a full URL (e.g., starts with http/https)
        if (m.image_url.startsWith('http')) return m.image_url;

        // If flagged as a frontend asset
        if (m.isfrontendurl) return m.image_url;

        // Otherwise, assume it's hosted in backend's uploads folder
        return `${import.meta.env.VITE_APP_API}${m.image_url}`;
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


    const isLandingPage = location.pathname === '/';

    return (
        <div className="">
            {(landing || isLandingPage) &&
                <div className="page-title-section" style={{ paddingTop: isLandingPage ? '5rem' : '10rem' }}>
                    <div className="container">
                        <div className="row">
                            <div className="col-12 text-center">
                                <h1 className="display-4 fw-bold">Learning Centre</h1>
                                <p className="lead">Comprehensive resources to help your business implement sustainable practices.</p>
                            </div>
                        </div>
                    </div>
                </div>
            }

            <div>
                {loading && (
                    <div className="text-center py-5 text-muted">Loading learning materials...</div>
                )}
                {error && (
                    <div className="alert alert-danger" role="alert">{error}</div>
                )}
                {!loading && !error && (
                    <>
                        {(() => {
                            const normalize = (v) => (v || '').toString().trim().toLowerCase();
                            const sectionList = selectedCategory
                                ? sections.filter((s) => normalize(s.category || s.title) === normalize(selectedCategory))
                                : sections;

                            if (sectionList.length === 0) {
                                return (
                                    <div className="pt-2"><Empty title="Oops! No sections to display." /></div>
                                );
                            }

                            return sectionList.map((section, idx) => {
                                const sectionKey = section.__displayTitle || section.category || section.title;
                                const sectionId = getSectionId(sectionKey);

                                // Show all materials for all users
                                const sectionMaterials = materials.filter(
                                    (m) => normalize(m.category) === normalize(sectionKey)
                                );

                                return (
                                    <section key={section.id} id={sectionId} className={`lm-snap-section ${idx % 2 === 1 && landing ? 'lm-band-alt' : 'lm-band'}`}>
                                        <div className="container lm-section-block" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                                            <div className="lm-section-header">
                                                <h4 className="lm-section-title ">{section.__displayTitle || section.title}</h4>
                                            </div>
                                            
                                            {/* Display section content if it exists and is not empty */}
                                            {section.content && (
                                                <div 
                                                    className="section-content mb-4"
                                                    dangerouslySetInnerHTML={{ __html: section.content }}
                                                />
                                            )}
                                            
                                             <div className="row g-4">
                                                 {sectionMaterials.map((m) => {
                                                     const isTransparent = false; // Update logic as needed
                                                    return (
                                                        <div key={m.id} className="col-lg-4 col-md-6">
                                                            <div className={`card h-100 p-0 border lm-material-card d-flex flex-column ${isTransparent ? 'opacity-50' : ''}`}>

                                                                {/* Optional debug output */}
                                                                {/* {JSON.stringify(m)} */}

                                                                {m.image_url ? (
                                                                    m.external_url ? (
                                                                        <a href={m.external_url} target="_blank" rel="noreferrer">
                                                                            <img
                                                                                src={getImageUrl(m)}
                                                                                className="card-img-top lm-thumb"
                                                                                alt={m.title}
                                                                                onError={(e) => {
                                                                                    console.log('Image failed to load:', m.image_url, e.target.src);
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
                                                                                console.log('Image failed to load:', m.image_url, e.target.src);
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
                                                                            <a className="btn btn-outline-info w-100" href={`${import.meta.env.VITE_APP_API || ''}${m.downloadable_file_url}`} download><i className="fa-solid fa-download me-1"></i>Download</a>
                                                                        ) : m.external_url ? (
                                                                            <a className="btn btn-outline-info w-100" href={m.external_url} target="_blank" rel="noreferrer"><i className="fa-regular fa-circle-info me-1"></i>Read More</a>
                                                                        ) : (
                                                                            <a className="btn btn-outline-info w-100" href={landing ? `/learning-materials/${m.id}` : `/learning-centre/material/${m.id}`}><i className="fa-regular fa-circle-info me-1"></i>Read More</a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* {sectionMaterials.length === 0 && (
                                                    <div className="pt-2"><Empty title="Oops! No materials in this section yet." /></div>
                                                )} */}
                                            </div>
                                        </div>
                                    </section>
                                );
                            });
                        })()}
                    </>
                )}
            </div>
        </div>
    );
}

export default LearningMaterials;


