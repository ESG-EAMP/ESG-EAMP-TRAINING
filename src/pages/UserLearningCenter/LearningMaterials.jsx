import React, { useEffect, useState } from 'react';
import LandingLayout from '../../layouts/LandingLayout/LandingLayout';
import { FaExternalLinkAlt, FaDownload, FaBook, FaGlobe, FaCertificate, FaMoneyBillWave, FaTrophy } from 'react-icons/fa';
import './LearningMaterials.css';
import api, { API_BASE } from '../../utils/api';

function LearningMaterials() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await api.get('/learning-materials-sections/');
      const data = res.data;
      setSections(Array.isArray(data) ? data.filter(section => section.status === 'Published') : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    {
      name: "ESG & Sustainability",
      icon: <FaBook className="fs-1" />,
      color: "success",
      description: "Learn about Environmental, Social and Governance principles"
    },
    {
      name: "Website & Platform",
      icon: <FaGlobe className="fs-1" />,
      color: "primary", 
      description: "Platform guides and tutorials"
    },
    {
      name: "Resources",
      icon: <FaDownload className="fs-1" />,
      color: "info",
      description: "Downloadable resources and tools"
    },
    {
      name: "Certification",
      icon: <FaCertificate className="fs-1" />,
      color: "warning",
      description: "Certification programs and standards"
    },
    {
      name: "Financing & Incentives",
      icon: <FaMoneyBillWave className="fs-1" />,
      color: "secondary",
      description: "Financial solutions and incentives"
    },
    {
      name: "ESG Champion",
      icon: <FaTrophy className="fs-1" />,
      color: "danger",
      description: "Success stories and champions"
    }
  ];

  const getSectionsByCategory = (categoryName) => {
    return sections.filter(section => section.category === categoryName);
  };

  const getCategoryInfo = (categoryName) => {
    return categories.find(cat => cat.name === categoryName);
  };

  if (loading) {
    return (
      <LandingLayout>
        <div className="container-fluid">
          <div className="loading-spinner">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="page-title-section">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h1 className="display-4 fw-bold">Learning Centre</h1>
              <p className="lead">Comprehensive resources to help your business implement sustainable practices and achieve ESG excellence</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-5">

        {/* Categories Sections */}
        {categories.map((category, index) => {
          const categorySections = getSectionsByCategory(category.name);
          
          return (
            <div key={category.name} className="mb-5">
              <div className="row mb-4">
                <div className="col-12 text-center">
                  <div className={`category-icon ${category.color} mb-3`}>
                    <div className="text-white">
                      {category.icon}
                    </div>
                  </div>
                  <h2 className={`mb-3 fw-bold text-${category.color}`}>{category.name}</h2>
                  <p className="text-muted fs-5 ">{category.description}</p>
                </div>
              </div>
              
              {categorySections.length > 0 ? (
                <div className="row g-4">
                  {categorySections.map((section) => (
                    <div className="col-lg-4 col-md-6" key={section.id}>
                      <div className="material-card card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                        {section.image_url && (
                          <div className="position-relative">
                            <img
                              className="card-img-top"
                              src={`${API_BASE}${section.image_url}`}
                              alt={section.title}
                              style={{ 
                                height: '220px', 
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        )}
                        <div className="card-body d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className={`category-badge badge bg-${category.color}`}>
                              {category.name}
                            </span>
                            {section.external_url && (
                              <small className="text-muted fw-medium">
                                <FaExternalLinkAlt className="me-1" />
                                External Link
                              </small>
                            )}
                          </div>
                          <h5 className="card-title fw-bold mb-3">
                            {section.title}
                          </h5>
                          <p className="card-text flex-grow-1 text-muted mb-4">
                            {section.description || section.content.substring(0, 150) + '...'}
                          </p>
                          {section.external_url ? (
                            <a 
                              href={section.external_url}
                              className="btn-link btn ps-0 align-self-start text-decoration-none fw-semibold"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Visit Resource <FaExternalLinkAlt className="ms-2" />
                            </a>
                          ) : (
                            <button className="btn-link btn-info ps-0 align-self-start text-decoration-none fw-semibold">
                              Read More <i className="bi bi-arrow-right ms-2"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className={`empty-icon text-${category.color}`}>
                    {category.icon}
                  </div>
                  <h5>No materials available</h5>
                  <p>Check back soon for new content in this category</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </LandingLayout>
  );
}

export default LearningMaterials;
