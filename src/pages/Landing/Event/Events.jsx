import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LandingLayout from '../../../layouts/LandingLayout/LandingLayout';

const LandingEvents = ({ landing = false }) => {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';
    const [events, setEvents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('All');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API}/events/`);
                const data = await res.json();
                setEvents(data);
                setFiltered(data);
            } catch (error) {
                console.error(error);
                alert("Failed to load events.");
            }
        };

        fetchEvents();
    }, []);

    const handleFilter = (status) => {
        setSelectedStatus(status);
        if (status === 'All') {
            setFiltered(events);
        } else {
            setFiltered(events.filter(ev => ev.status === status));
        }
    };


    const statuses = ['All', 'Upcoming', 'Completed', 'Cancelled'];

    return (
        <>
            {(landing || isLandingPage) &&
                <div className="page-title-section" style={{ paddingTop: isLandingPage ? '5rem' : '10rem' }}>
                    <div className="container">
                        <div className="row">
                            <div className="col-12 text-center">
                                <h1 className="display-4 fw-bold">Events</h1>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {!landing &&

                <div>
                    <h1 className="mb-2 fw-bold" style={{ fontSize: '2.5rem' }}>
                        {selectedStatus} Events
                    </h1>
                    <p className=" fs-5 opacity-90">
                        Explore opportunities to engage with ESG activities and sustainability programs
                    </p>
                </div>
            }

            <div className="container mt-5 pb-3">
                {/* Status Filter */}
                <div className="row mb-5">
                    <div className="col-12">
                        <div className="d-flex justify-content-center flex-wrap gap-2">
                            {statuses.map((status, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleFilter(status)}
                                    className={`btn ${selectedStatus === status ? 'btn-primary' : 'btn-outline-primary'} rounded-pill`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Events Grid */}
                <div className="row g-4">
                    {filtered.map(event => (
                        <div key={event.id} className="col-lg-4 col-md-6">
                            <div className="h-100 border rounded-4 shadow overflow-hidden d-flex flex-column">
                                {event.image && (
                                    <img
                                        src={`${import.meta.env.VITE_APP_API}${event.image}`}
                                        className="card-img-top"
                                        height="200"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            objectFit: 'contain'
                                        }}
                                        alt={event.title}
                                    />
                                )}
                                <div className="card-body p-4 flex-grow-1 d-flex flex-column">
                                    <span className="badge bg-primary mb-2">
                                        {event.status || 'Upcoming'}
                                    </span>
                                    <h5 className="card-title fw-bold mb-3">{event.title}</h5>
                                    <p className="text-muted mb-3">
                                        {event.description?.length > 100
                                            ? event.description.slice(0, 100) + '...'
                                            : event.description}
                                    </p>
                                    <div className="mt-auto">
                                        <p className="mb-1">
                                            <strong>Date:</strong>{" "}
                                            {new Date(event.date).toLocaleString()}
                                        </p>
                                        <p className="mb-0">
                                            <strong>Location:</strong>{" "}
                                            {event.location || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent border-0 p-4 pt-0">
                                    <button
                                        className="btn btn-outline-primary w-100"
                                        onClick={() => {
                                            if (event.external_url) {
                                                window.open(event.external_url, "_blank");
                                            } else {
                                                window.location.href = `/events/preview/${event.id}`;
                                            }
                                        }}
                                    >
                                        <i className="fa-regular fa-calendar me-1"></i>View Event
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-5">
                            <p className="text-muted">No events found.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default LandingEvents;
