import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Title from '../../layouts/Title/Title';
import api, { API_BASE } from '../../utils/api';

const ESG_EventsPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        const data = res.data;
        setEvent(data);
      } catch (err) {
        console.error(err);
        alert('Failed to load event details.');
        navigate('/user/events');
      }
    };
    fetchEvent();
  }, [id, navigate]);

  return (
    <div className="container-fluid">
      <Title
        title="Event Details"
        breadcrumb={[['Events', '/user/events'], 'Event Details']}
      />

      <div
        className="row py-5"
        style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}
      >
        <div className="container ms-5">
          {event ? (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4">
                  {event.image && (
                    <img
                      src={`${API_BASE}${event.image}`}
                      alt={event.title}
                      className="mb-4 w-100"
                      style={{
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                  <h3 className="fw-bold mb-3">{event.title}</h3>
                  <p className="text-muted mb-4">{event.description}</p>
                  <p className="mb-2">
                    <strong>Date:</strong>{' '}
                    {new Date(event.date).toLocaleString()}
                  </p>
                  <p className="mb-2">
                    <strong>Location:</strong> {event.location || 'N/A'}
                  </p>
                  <p className="mb-4">
                    <strong>Status:</strong>{' '}
                    <span
                      className="badge px-3 py-2 rounded-pill"
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {event.status || 'Upcoming'}
                    </span>
                  </p>

                  <button
                    className="btn"
                    onClick={() => navigate('/user/events')}
                  >
                    Back to Events
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">Loading event details...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ESG_EventsPreview;
