import React, { useEffect, useState } from 'react';
import Title from '../../layouts/Title/Title';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

function UserFAQ() {
    const [faqs, setFaqs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupedFaqs, setGroupedFaqs] = useState({});

    // Fetch FAQs from backend
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        // Only fetch published FAQs for users
        params.append('status', 'Published');

        api.get(`/faq/get-faq-list?${params.toString()}`)
            .then(res => setFaqs(res.data.faqs || res.data))
            .catch(() => setFaqs([]));
    }, [searchTerm]);

    // Group FAQs by category
    useEffect(() => {
        const groups = {};
        if (faqs.length > 0) {
            faqs?.forEach(faq => {
                if (!groups[faq.category]) groups[faq.category] = [];
                    groups[faq.category].push(faq);
                });
        }
        setGroupedFaqs(groups);
    }, [faqs]);

    // Icons for categories
    const categoryIcons = {
        "General": "fa-circle-question",
        "Assessment": "fa-clipboard-check",
        "Goals": "fa-bullseye",
        // Add more as needed
    };

    return (
        <div className="container-fluid">
            <Title title="FAQs" breadcrumb={[["Support", "/support"], "FAQs"]} />

            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search FAQs..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <button className="btn btn-outline-secondary" type="button" onClick={() => { }}>
                            <i className="fa-solid fa-magnifying-glass"></i>
                        </button>
                    </div>
                </div>
            </div>

            {Object.keys(groupedFaqs).length === 0 && (
                <div className="text-center text-muted py-5">
                    <i className="fa-solid fa-circle-question fs-1 mb-3"></i>
                    <h5>No FAQs found</h5>
                    <p>Try adjusting your search or check back later.</p>
                </div>
            )}

            {Object.entries(groupedFaqs).map(([category, items], catIndex) => (
                <div key={catIndex} className="mb-4">
                    <h4 className="mb-3">
                        <i className={`fa-solid ${categoryIcons[category] || "fa-circle-question"} me-1`}></i>
                        {category}
                    </h4>
                    <div className="accordion" id={`accordion-${catIndex}`}>
                        {items.map((item) => (
                            <div className="accordion-item" key={item.id}>
                                <h2 className="accordion-header" id={`heading-${item.id}`}>
                                    <button
                                        className="accordion-button collapsed"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#collapse-${item.id}`}
                                        aria-expanded="false"
                                        aria-controls={`collapse-${item.id}`}
                                    >
                                        {item.title}
                                    </button>
                                </h2>
                                <div
                                    id={`collapse-${item.id}`}
                                    className="accordion-collapse collapse"
                                    aria-labelledby={`heading-${item.id}`}
                                    data-bs-parent={`#accordion-${catIndex}`}
                                >
                                    <div className="accordion-body">
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="mt-4">
                <Link to="/support" className="btn btn-outline-secondary">
                    <i className="fa-solid fa-arrow-left me-1"></i> Back to Support
                </Link>
            </div>
        </div>
    );
}

export default UserFAQ;