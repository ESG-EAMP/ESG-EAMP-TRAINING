import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaExternalLinkAlt } from 'react-icons/fa';
import api, { API_BASE } from '../../utils/api';

const categoryMeta = {
  'ESG & Sustainability': { color: 'success', icon: '📘' },
  'Website & Platform': { color: 'primary', icon: '🌐' },
  'Resources': { color: 'info', icon: '⬇️' },
  'Certification': { color: 'warning', icon: '🎖️' },
  'Financing & Incentives': { color: 'secondary', icon: '💸' },
  'ESG Champion': { color: 'danger', icon: '🏆' }
};

function PreviewMaterial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const res = await api.get(`/learning-materials/${id}`);
        const data = res.data;
        setMaterial(data);
      } catch (err) {
        console.error(err);
        alert('Error loading material preview.');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id]);

  if (loading) return <div className="container p-4"><p>Loading...</p></div>;
  if (!material) return <div className="container p-4"><p>Material not found.</p></div>;

  const meta = categoryMeta[material.category] || { color: 'light', icon: '📄' };

  return (
    <div className="container py-4">
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {material.image_url && (
          <div className="position-relative">
            <img
              className="w-100"
              src={`${API_BASE}${material.image_url}`}
              alt={material.title}
              style={{ maxHeight: '320px', objectFit: 'cover' }}
            />
          </div>
        )}

        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className={`badge bg-${meta.color} px-3 py-2 rounded-pill`}>{material.category}</span>
            <span className={`badge ${material.status === 'Published' ? 'bg-success' : material.status === 'Draft' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{material.status}</span>
          </div>

          <h2 className="fw-bold mb-2" style={{ lineHeight: 1.3 }}>{material.title}</h2>
          {material.description && (
            <p className="text-muted mb-3">{material.description}</p>
          )}

          <div className="small text-muted mb-3">
            <span className="me-3"><strong>Type:</strong> {material.type}</span>
            <span><strong>Date:</strong> {new Date(material.created_at).toLocaleDateString('en-GB')}</span>
          </div>

          {material.content && !isContentEmpty(material.content) && (
            <div className="mt-3">
              <div
                className="border rounded p-3"
                style={{ lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: material.content }}
              />
            </div>
          )}

          {material.external_url && (
            <a
              href={material.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn btn-link mt-3 ps-0 text-${meta.color}`}
            >
              Visit Resource <FaExternalLinkAlt className="ms-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewMaterial;
