import React from 'react';
import LandingLayout from '../../layouts/LandingLayout/LandingLayout';

const Blogs = () => {
    const blogPosts = [
        {
            id: 1,
            title: "The Future of ESG: Trends to Watch in 2024",
            excerpt: "As we move into 2024, ESG practices are evolving rapidly. Discover the key trends that will shape sustainable business practices this year.",
            author: "Dr. Sarah Johnson",
            date: "January 15, 2024",
            readTime: "5 min read",
            category: "Trends",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop"
        },
        {
            id: 2,
            title: "How Small Businesses Can Implement ESG Practices",
            excerpt: "ESG isn't just for large corporations. Learn practical steps that small and medium enterprises can take to improve their sustainability.",
            author: "Michael Chen",
            date: "January 12, 2024",
            readTime: "7 min read",
            category: "Implementation",
            image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=250&fit=crop"
        },
        {
            id: 3,
            title: "Measuring Environmental Impact: A Comprehensive Guide",
            excerpt: "Understanding how to measure your environmental footprint is crucial for ESG success. This guide covers the essential metrics and tools.",
            author: "Emma Rodriguez",
            date: "January 10, 2024",
            readTime: "8 min read",
            category: "Measurement",
            image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=250&fit=crop"
        },
        {
            id: 4,
            title: "Social Responsibility in the Digital Age",
            excerpt: "How technology companies are redefining social responsibility and creating positive impact through digital innovation.",
            author: "David Kim",
            date: "January 8, 2024",
            readTime: "6 min read",
            category: "Technology",
            image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop"
        },
        {
            id: 5,
            title: "Governance Best Practices for Modern Organizations",
            excerpt: "Effective governance is the foundation of ESG success. Learn the best practices that leading organizations are implementing.",
            author: "Lisa Thompson",
            date: "January 5, 2024",
            readTime: "9 min read",
            category: "Governance",
            image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop"
        },
        {
            id: 6,
            title: "The ROI of ESG: Why Sustainability Pays Off",
            excerpt: "Discover how ESG initiatives can drive financial performance and create long-term value for stakeholders.",
            author: "Robert Wilson",
            date: "January 3, 2024",
            readTime: "6 min read",
            category: "Finance",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop"
        }
    ];

    const categories = ["All", "Trends", "Implementation", "Measurement", "Technology", "Governance", "Finance"];

    return (
        <LandingLayout>
            <div className="page-title-section">
                <div className="container">
                    <div className="row">
                        <div className="col-12 text-center">
                            <h1 className="display-4 fw-bold">ESG Blog</h1>
                            <p className="lead">Insights, trends, and best practices in Environmental, Social, and Governance</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-5">
                {/* Category Filter */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="d-flex justify-content-center flex-wrap gap-2">
                            {categories.map((category, index) => (
                                <button
                                    key={index}
                                    className={`btn ${index === 0 ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Featured Post */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="card border-0 shadow-lg">
                            <div className="row g-0">
                                <div className="col-md-6">
                                    <img
                                        src={blogPosts[0].image}
                                        className="img-fluid h-100 object-fit-cover"
                                        alt={blogPosts[0].title}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <div className="card-body p-5">
                                        <span className="badge bg-primary mb-2">{blogPosts[0].category}</span>
                                        <h2 className="card-title fw-bold mb-3">{blogPosts[0].title}</h2>
                                        <p className="card-text text-muted mb-4">{blogPosts[0].excerpt}</p>
                                        <div className="d-flex align-items-center mb-3">
                                            <img
                                                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                                                className="rounded-circle me-3"
                                                width="40"
                                                height="40"
                                                alt="Author"
                                            />
                                            <div>
                                                <small className="fw-semibold d-block">{blogPosts[0].author}</small>
                                                <small className="text-muted">{blogPosts[0].date} • {blogPosts[0].readTime}</small>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary">Read Full Article</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blog Posts Grid */}
                <div className="row g-4">
                    {blogPosts.slice(1).map((post) => (
                        <div key={post.id} className="col-lg-4 col-md-6">
                            <div className="card h-100 border-0 shadow-sm">
                                <img
                                    src={post.image}
                                    className="card-img-top"
                                    height="200"
                                    style={{ objectFit: 'cover' }}
                                    alt={post.title}
                                />
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <span className="badge bg-light text-dark">{post.category}</span>
                                        <small className="text-muted">{post.readTime}</small>
                                    </div>
                                    <h5 className="card-title fw-bold mb-3">{post.title}</h5>
                                    <p className="card-text text-muted mb-3">{post.excerpt}</p>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <img
                                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=30&h=30&fit=crop&crop=face"
                                                className="rounded-circle me-1"
                                                width="30"
                                                height="30"
                                                alt="Author"
                                            />
                                            <small className="fw-semibold">{post.author}</small>
                                        </div>
                                        <small className="text-muted">{post.date}</small>
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent border-0 p-4 pt-0">
                                    <button className="btn btn-outline-primary w-100">Read More</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Newsletter Signup */}
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="card bg-primary text-white border-0">
                            <div className="card-body p-5 text-center">
                                <h3 className="fw-bold mb-3">Stay Updated with ESG Insights</h3>
                                <p className="mb-4">Get the latest ESG trends and best practices delivered to your inbox.</p>
                                <div className="row justify-content-center">
                                    <div className="col-md-6">
                                        <div className="input-group">
                                            <input
                                                type="email"
                                                className="form-control"
                                                placeholder="Enter your email address"
                                            />
                                            <button className="btn btn-light">Subscribe</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
};

export default Blogs; 