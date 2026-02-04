import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LandingLayout from '../../../layouts/LandingLayout/LandingLayout';
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaLink } from 'react-icons/fa';
import api from '../../../utils/api';

const LandingEventPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch (error) {
        console.error(error);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <LandingLayout>
        <div style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading event details...</p>
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }

  if (error || !event) {
    return (
      <LandingLayout>
        <div style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
          <div className="container">
            <div className="text-center py-5">
              <h2 className="text-muted">Event Not Found</h2>
              <p className="text-muted">The requested event could not be found.</p>
              <button className="btn" onClick={() => navigate('/events')}>
                <FaArrowLeft className="me-1" />
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div style={{ paddingTop: '6rem', paddingBottom: '4rem', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="container">
          {/* Back Button */}
          <div className="mb-4">
            <button
              className="btn btn-link text-decoration-none p-0 mb-3"
              onClick={() => navigate('/events')}
              style={{ color: '#46015E' }}
            >
              <FaArrowLeft className="me-3" />
              <span className="fw-semibold">Back to Events</span>
            </button>
          </div>

          <div className="row">
            {/* Main Content */}
            <div className="col-lg-8">
              <article className="bg-white rounded-4 shadow-sm p-4 p-md-5 mb-4">
                {/* Header Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1">
                      <span className="badge rounded-pill px-3 py-2 mb-3" 
                        style={{ 
                          backgroundColor: event.status === 'Published' ? '#28a745' : 
                                         event.status === 'Draft' ? '#6c757d' : '#ffc107',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                        {event.status || 'Event'}
                      </span>
                      <h1 className="display-5 fw-bold mb-3" style={{ color: '#212529', lineHeight: '1.2' }}>
                        {event.title}
                      </h1>
                    </div>
                  </div>

                  {event.description && (
                    <p className="lead text-muted mb-4" style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                      {event.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="d-flex flex-wrap gap-4 mb-4 pb-3 border-bottom">
                    <div className="d-flex align-items-center text-muted">
                      <FaCalendarAlt className="me-3" style={{ color: '#46015E', fontSize: '1.1rem' }} />
                      <span className="fw-medium">
                        {new Date(event.date).toLocaleDateString('en-GB', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="d-flex align-items-center text-muted">
                        <FaMapMarkerAlt className="me-3" style={{ color: '#46015E', fontSize: '1.1rem' }} />
                        <span className="fw-medium">{event.location}</span>
                      </div>
                    )}
                    {event.external_url && (
                      <div className="d-flex align-items-center">
                        <FaLink className="me-3" style={{ color: '#46015E', fontSize: '1.1rem' }} />
                        <a 
                          href={event.external_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none fw-medium"
                          style={{ color: '#46015E' }}
                        >
                          External Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Image */}
                {event.image && (
                  <div className="mb-5">
                    <img
                      src={`${import.meta.env.VITE_APP_API}${event.image}`}
                      alt={event.title}
                      className="img-fluid rounded-3 shadow-sm"
                      style={{ 
                        width: '100%', 
                        maxHeight: '500px', 
                        objectFit: 'cover',
                        border: '1px solid #e9ecef'
                      }}
                    />
                  </div>
                )}

                {/* Event Content if available */}
                {event.content && (
                  <div 
                    className="content mt-4"
                    style={{
                      fontSize: '1.1rem',
                      lineHeight: '1.8',
                      color: '#495057'
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: event.content }} />
                  </div>
                )}
              </article>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="bg-white rounded-4 shadow-sm p-4 sticky-top" style={{ top: '100px' }}>
                <h5 className="fw-bold mb-4" style={{ color: '#46015E' }}>Event Information</h5>
                
                <div className="mb-4">
                  <div className="d-flex align-items-start mb-3">
                    <FaCalendarAlt className="me-3 mt-1" style={{ color: '#46015E', fontSize: '1.1rem', flexShrink: 0 }} />
                    <div>
                      <small className="text-muted d-block mb-1">Event Date</small>
                      <span className="fw-semibold d-block">
                        {new Date(event.date).toLocaleDateString('en-GB', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </span>
                      <small className="text-muted">
                        {new Date(event.date).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="d-flex align-items-start mb-3">
                      <FaMapMarkerAlt className="me-3 mt-1" style={{ color: '#46015E', fontSize: '1.1rem', flexShrink: 0 }} />
                      <div>
                        <small className="text-muted d-block mb-1">Location</small>
                        <span className="fw-semibold">{event.location}</span>
                      </div>
                    </div>
                  )}

                  <div className="d-flex align-items-center mb-3">
                    <span className="badge rounded-pill px-3 py-2" 
                      style={{ 
                        backgroundColor: event.status === 'Published' ? '#28a745' : 
                                       event.status === 'Draft' ? '#6c757d' : '#ffc107',
                        color: 'white'
                      }}>
                      {event.status}
                    </span>
                  </div>

                  {event.external_url && (
                    <div className="d-flex align-items-start mb-3">
                      <FaLink className="me-3 mt-1" style={{ color: '#46015E', fontSize: '1.1rem', flexShrink: 0 }} />
                      <div>
                        <small className="text-muted d-block mb-1">External Link</small>
                        <a 
                          href={event.external_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none fw-semibold"
                          style={{ color: '#46015E' }}
                        >
                          Visit Event Page
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
};

export default LandingEventPreview;
