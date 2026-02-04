import React, { useEffect, useState } from 'react';
import LandingLayout from '../../layouts/LandingLayout/LandingLayout';
import { FaSpinner } from 'react-icons/fa';

function About() {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Helper to check if HTML content is empty or mostly blank
    const isContentEmpty = (htmlContent) => {
        if (!htmlContent || typeof htmlContent !== 'string') return true;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const trimmedText = textContent.trim().replace(/\s+/g, ' ');
        
        return trimmedText.length < 3;
    };

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API}/static-pages/about`);
                if (!res.ok) throw new Error('Page not found');
                const data = await res.json();
                setPageData(data);
            } catch (err) {
                console.error('Error fetching page:', err);
                setError('Failed to load page');
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, []);

    if (loading) {
        return (
            <LandingLayout>
                <div className="container mt-5">
                    <div className="text-center py-5">
                        <FaSpinner className="spinner-border text-primary" />
                        <p className="mt-3 text-muted">Loading...</p>
                    </div>
                </div>
            </LandingLayout>
        );
    }

    if (error || !pageData) {
        return (
            <LandingLayout>
                <div className="container mt-5">
                    <div className="text-center py-5">
                        <h2 className="text-muted">Page Not Found</h2>
                        <p className="text-muted">The requested page could not be found.</p>
                    </div>
                </div>
            </LandingLayout>
        );
    }

    return (
        <LandingLayout>
            <div className="container mt-5 mb-5">
                <article className="card shadow-sm">
                    <div className="card-body p-5">
                        <h1 className="card-title mb-4">{pageData.title || 'About'}</h1>
                        <hr className="my-4" />
                        {pageData.content && !isContentEmpty(pageData.content) && (
                            <div className="content" style={{ lineHeight: 1.8 }}>
                                <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
                            </div>
                        )}
                        {(!pageData.content || isContentEmpty(pageData.content)) && (
                            <div className="text-muted text-center py-5">
                                <p>Content is being prepared. Please check back later.</p>
                            </div>
                        )}
                    </div>
                </article>
            </div>
        </LandingLayout>
    );
}

export default About;

