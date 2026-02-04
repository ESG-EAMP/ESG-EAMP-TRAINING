import React, { useEffect, useState } from 'react';

const LandingFooter = () => {
    const [footerContent, setFooterContent] = useState(null);
    const [loading, setLoading] = useState(true);

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
        const fetchFooter = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API}/static-pages/footer`);
                if (res.ok) {
                    const data = await res.json();
                    setFooterContent(data);
                }
            } catch (err) {
                console.error('Error fetching footer:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFooter();
    }, []);

    // Default footer content if no content is loaded or content is empty
    const defaultContent = `© ${new Date().getFullYear()} Copyright SME Corp. Malaysia All rights reserved.`;

    return (
        <footer className="bg-dark py-2">
            <div className="container">
                <div className="row">
                    {loading ? (
                        <p className="">
                            {defaultContent}
                        </p>
                    ) : footerContent && footerContent.content && !isContentEmpty(footerContent.content) ? (
                        <div 
                            className=""
                            style={{ width: '100%' }}
                            dangerouslySetInnerHTML={{ __html: footerContent.content }}
                        />
                    ) : (
                        <p className="">
                            {defaultContent}
                        </p>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter; 